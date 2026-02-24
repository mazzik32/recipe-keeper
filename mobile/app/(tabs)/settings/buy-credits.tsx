import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCredits } from "../../../contexts/CreditsContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { ArrowLeft, Coins, Sparkles, Crown, Zap } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";

const PACKAGE_ICONS = [Coins, Sparkles, Crown];
const PACKAGE_COLORS = ["#f59e0b", "#8b5cf6", "#ec4899"];

/** Map product ID → credits (client-side display only) */
const PRODUCT_CREDITS: Record<string, number> = {
    'org.recipekeeper.credits.20': 20,
    'org.recipekeeper.credits.50': 50,
    'org.recipekeeper.credits.400': 400,
};

/** Get the product ID from a product object (v14 uses `id`, older versions use `productId`) */
function getProductId(product: any): string {
    return product.productId || product.id || '';
}

/** Parse credit amount from a product object */
function parseCreditAmount(product: any): number {
    const pid = getProductId(product);
    let creditAmount = PRODUCT_CREDITS[pid];
    if (!creditAmount && pid) {
        const match = pid.match(/\d+$/);
        if (match) {
            creditAmount = parseInt(match[0], 10);
        } else {
            const titleMatch = product.title?.match(/\d+/);
            creditAmount = titleMatch ? parseInt(titleMatch[0], 10) : 0;
        }
    }
    return creditAmount || 0;
}

/** 
 * Safely extract the formatted, localized price string.
 * v14 API changes depending on platform (iOS: localizedPriceString, Android: various).
 */
function getProductPrice(product: any): string {
    // iOS v14 or general formatted price
    if (product.localizedPriceString) return product.localizedPriceString;
    if (product.localizedPrice) return product.localizedPrice;

    // Android v14 (Subscriptions / In-app)
    if (product.subscriptionOfferDetailsAndroid?.[0]?.pricingPhases?.[0]?.formattedPrice) {
        return product.subscriptionOfferDetailsAndroid[0].pricingPhases[0].formattedPrice;
    }
    if (product.oneTimePurchaseOfferDetailsAndroid?.formattedPrice) {
        return product.oneTimePurchaseOfferDetailsAndroid.formattedPrice;
    }

    // Fallback
    return String(product.price || '');
}

export default function BuyCreditsScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    const { credits, refreshCredits } = useCredits();

    // Local IAP state — all IAP logic is self-contained in this screen
    const [products, setProducts] = useState<any[]>([]);
    const [purchasing, setPurchasing] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [iapError, setIapError] = useState<string | null>(null);
    const iapRef = useRef<typeof import('react-native-iap') | null>(null);
    const purchaseUpdateSub = useRef<any>(null);
    const purchaseErrorSub = useRef<any>(null);

    // Load IAP module and fetch products on mount
    useEffect(() => {
        let mounted = true;

        async function setupIAP() {
            try {
                // Lazy-load the native module only when this screen mounts
                const RNIap = require('react-native-iap');
                iapRef.current = RNIap;

                await RNIap.initConnection();

                const fetchedProducts = await RNIap.fetchProducts({
                    skus: Object.keys(PRODUCT_CREDITS),
                });

                if (mounted) {
                    // Log raw product structure for debugging
                    console.log('IAP products received:', JSON.stringify(fetchedProducts, null, 2));
                    const sorted = (fetchedProducts || []).sort((a: any, b: any) => {
                        return (PRODUCT_CREDITS[getProductId(a)] || 0) - (PRODUCT_CREDITS[getProductId(b)] || 0);
                    });
                    setProducts(sorted);
                }
            } catch (err: any) {
                console.warn('IAP setup failed:', err);
                if (mounted) {
                    setIapError(err.message || 'Failed to connect to the store.');
                }
            } finally {
                if (mounted) setLoadingProducts(false);
            }
        }

        setupIAP();

        return () => {
            mounted = false;
            // Clean up connection
            if (iapRef.current) {
                iapRef.current.endConnection().catch(() => { });
            }
        };
    }, []);

    // Set up purchase listeners
    useEffect(() => {
        // Wait for IAP module to be loaded
        if (!iapRef.current) return;

        try {
            const RNIap = iapRef.current;

            purchaseUpdateSub.current = RNIap.purchaseUpdatedListener(
                async (purchase: any) => {
                    try {
                        // Validate receipt with backend
                        const result = await validatePurchase(purchase, RNIap);
                        refreshCredits();
                        Alert.alert(
                            '🎉 Credits Added!',
                            `${result.added} credits have been added to your account.`
                        );
                    } catch (err: any) {
                        console.error('Purchase fulfillment error:', err);
                        Alert.alert('Purchase Error', err.message || 'Failed to add credits.');
                    } finally {
                        setPurchasing(false);
                    }
                }
            );

            purchaseErrorSub.current = RNIap.purchaseErrorListener(
                (error: any) => {
                    if (error.code === 'E_USER_CANCELLED') {
                        setPurchasing(false);
                        return;
                    }
                    console.error('Purchase error:', error);
                    Alert.alert('Purchase Error', error.message || 'Something went wrong.');
                    setPurchasing(false);
                }
            );
        } catch (err) {
            console.warn('Failed to attach IAP listeners:', err);
        }

        return () => {
            purchaseUpdateSub.current?.remove();
            purchaseErrorSub.current?.remove();
        };
    }, [products]); // Re-run after products load (means IAP is ready)

    const handlePurchase = useCallback((product: any) => {
        const creditAmount = parseCreditAmount(product);
        const priceString = getProductPrice(product);

        Alert.alert(
            `Purchase ${creditAmount} Credits`,
            `Are you sure you want to buy ${creditAmount} credits for ${priceString}?`,
            [
                { text: t.common.cancel, style: "cancel" },
                {
                    text: t.common.confirm,
                    onPress: async () => {
                        if (!iapRef.current) {
                            Alert.alert('Store Error', 'In-App Purchases are not available.');
                            return;
                        }

                        setPurchasing(true);
                        try {
                            const sku = getProductId(product);
                            await iapRef.current.requestPurchase({
                                request: {
                                    apple: { sku },
                                    google: { skus: [sku] },
                                },
                                type: 'in-app'
                            });
                        } catch (err: any) {
                            console.error('requestPurchase error:', err);
                            Alert.alert('Store Connection Error', err.message || 'Could not connect to the App Store.');
                            setPurchasing(false);
                        }
                    },
                },
            ]
        );
    }, [t]);

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-cream">
            {/* Header */}
            <View className="px-4 py-4 border-b border-warm-gray-100 bg-white flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
                    <ArrowLeft color="#75716d" size={24} />
                </TouchableOpacity>
                <Text className="font-playfair text-2xl text-warm-gray-700">{t.nav.credits}</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Current Balance */}
                <View className="bg-white mx-4 mt-6 p-6 rounded-2xl border border-warm-gray-100 shadow-sm items-center">
                    <View className="w-16 h-16 bg-peach-100 rounded-full items-center justify-center mb-3">
                        <Zap color="#eb6e3e" size={32} />
                    </View>
                    <Text className="text-warm-gray-500 text-sm mb-1">{t.nav.credits}</Text>
                    <Text className="font-playfair text-4xl text-warm-gray-700">{credits}</Text>
                </View>

                {/* Packages */}
                <View className="mt-8 px-4">
                    <Text className="text-warm-gray-500 font-semibold mb-3 uppercase text-xs tracking-wider px-2">
                        {t.nav.credits}
                    </Text>

                    {loadingProducts ? (
                        <View className="py-12 items-center">
                            <ActivityIndicator size="large" color="#eb6e3e" />
                            <Text className="text-warm-gray-400 mt-3 text-sm">{t.common.loading}</Text>
                        </View>
                    ) : iapError || products.length === 0 ? (
                        <View className="bg-white rounded-2xl border border-warm-gray-100 p-6 items-center">
                            <Text className="text-warm-gray-500 text-center">
                                {iapError || (Platform.OS === 'ios'
                                    ? 'In-App Purchases are not available in the simulator. Please use a physical device.'
                                    : 'In-App Purchases are currently unavailable. Please try again later.')}
                            </Text>
                        </View>
                    ) : (
                        <View className="gap-3">
                            {products.map((product, index) => {
                                const Icon = PACKAGE_ICONS[index] || Coins;
                                const color = PACKAGE_COLORS[index] || "#f59e0b";
                                const creditAmount = parseCreditAmount(product);

                                return (
                                    <TouchableOpacity
                                        key={getProductId(product)}
                                        onPress={() => handlePurchase(product)}
                                        disabled={purchasing}
                                        className="bg-white rounded-2xl border border-warm-gray-100 shadow-sm p-5 flex-row items-center active:opacity-70"
                                        style={{ opacity: purchasing ? 0.6 : 1 }}
                                    >
                                        <View
                                            className="w-12 h-12 rounded-full items-center justify-center mr-4"
                                            style={{ backgroundColor: `${color}20` }}
                                        >
                                            <Icon color={color} size={24} />
                                        </View>

                                        <View className="flex-1">
                                            <Text className="font-playfair text-xl text-warm-gray-700">
                                                {creditAmount} Credits
                                            </Text>
                                            <Text className="text-warm-gray-400 text-sm mt-0.5" numberOfLines={2}>
                                                {product.description || `${creditAmount} Scan Credits`}
                                            </Text>
                                        </View>

                                        <View className="bg-peach-500 rounded-xl px-4 py-2">
                                            <Text className="text-white font-bold text-base">
                                                {getProductPrice(product)}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* Info */}
                <View className="mt-8 px-6 pb-10">
                    <Text className="text-warm-gray-400 text-xs text-center leading-5">
                        {Platform.OS === 'ios'
                            ? 'Payment will be charged to your Apple ID account. Credits are non-refundable and do not expire.'
                            : 'Payment will be processed through Google Play. Credits are non-refundable and do not expire.'}
                    </Text>
                </View>
            </ScrollView>

            {/* Purchasing overlay */}
            {purchasing && (
                <View className="absolute inset-0 bg-black/30 items-center justify-center">
                    <View className="bg-white rounded-2xl p-8 items-center mx-8 shadow-lg">
                        <ActivityIndicator size="large" color="#eb6e3e" />
                        <Text className="text-warm-gray-700 font-semibold mt-4 text-lg">{t.common.loading}</Text>
                    </View>
                </View>
            )}

            <StatusBar style="auto" />
        </SafeAreaView>
    );
}

/** Validate receipt with backend and finish transaction */
async function validatePurchase(
    purchase: any,
    RNIap: typeof import('react-native-iap')
): Promise<{ credits: number; added: number }> {
    const { supabase } = require('../../../lib/supabase');

    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const receipt = platform === 'ios'
        ? purchase.transactionReceipt
        : purchase.purchaseToken;

    if (!receipt) {
        throw new Error('No receipt/token found on purchase');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        throw new Error('Not authenticated');
    }

    const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';

    const response = await fetch(`${apiUrl}/api/iap/verify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
            platform,
            receipt,
            productId: purchase.productId,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
    }

    // Finish the transaction (tells Apple/Google we've delivered the content)
    await RNIap.finishTransaction({ purchase, isConsumable: true });

    return { credits: data.credits, added: data.added || 0 };
}
