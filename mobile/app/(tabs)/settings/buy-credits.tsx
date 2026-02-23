import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCredits } from "../../../contexts/CreditsContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { ArrowLeft, Coins, Sparkles, Crown, Zap } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { PRODUCT_CREDITS } from "../../../lib/iap";
import { Platform } from "react-native";

const PACKAGE_ICONS = [Coins, Sparkles, Crown];
const PACKAGE_COLORS = ["#f59e0b", "#8b5cf6", "#ec4899"];

export default function BuyCreditsScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    const { credits, products, purchasing, loadingProducts, buyCredits } = useCredits();

    const handlePurchase = (productId: string) => {
        const creditAmount = PRODUCT_CREDITS[productId] || 0;

        Alert.alert(
            t.nav.credits,
            `${creditAmount} Credits?`,
            [
                { text: t.common.cancel, style: "cancel" },
                {
                    text: t.common.confirm,
                    onPress: async () => {
                        try {
                            await buyCredits(productId);
                        } catch (err: any) {
                            Alert.alert('Store Connection Error', err.message || 'Could not connect to the App Store.');
                        }
                    },
                },
            ]
        );
    };

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
                    ) : products.length === 0 ? (
                        /* Fallback when products can't be loaded (e.g., simulator) */
                        <View className="bg-white rounded-2xl border border-warm-gray-100 p-6 items-center">
                            <Text className="text-warm-gray-500 text-center">
                                {Platform.OS === 'ios'
                                    ? 'In-App Purchases are not available in the simulator. Please use a physical device.'
                                    : 'In-App Purchases are currently unavailable. Please try again later.'}
                            </Text>
                        </View>
                    ) : (
                        <View className="gap-3">
                            {products.map((product, index) => {
                                const Icon = PACKAGE_ICONS[index] || Coins;
                                const color = PACKAGE_COLORS[index] || "#f59e0b";
                                // Extract credit amount from productId (e.g. 'org.recipekeeper.credits.20' -> 20)
                                // or fallback to parsing the title/description
                                let creditAmount = PRODUCT_CREDITS[product.productId];
                                if (!creditAmount) {
                                    const match = product.productId.match(/\d+$/);
                                    if (match) {
                                        creditAmount = parseInt(match[0], 10);
                                    } else {
                                        // Fallback to title parsing
                                        const titleMatch = product.title?.match(/\d+/);
                                        creditAmount = titleMatch ? parseInt(titleMatch[0], 10) : 0;
                                    }
                                }

                                return (
                                    <TouchableOpacity
                                        key={product.productId}
                                        onPress={() => handlePurchase(product.productId)}
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
                                                {product.localizedPrice || product.price}
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
