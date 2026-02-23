import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import {
    purchaseUpdatedListener,
    purchaseErrorListener,
} from 'react-native-iap';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import {
    initIAP,
    cleanupIAP,
    purchaseProduct,
    validateAndFulfill,
    PRODUCT_CREDITS,
    type Purchase,
    type Product,
    type PurchaseError,
} from '../lib/iap';

interface CreditsContextType {
    /** Current credit balance */
    credits: number;
    /** Available IAP products from the store */
    products: Product[];
    /** Whether a purchase is in progress */
    purchasing: boolean;
    /** Whether products are still loading */
    loadingProducts: boolean;
    /** Trigger a purchase flow */
    buyCredits: (productId: string) => Promise<void>;
    /** Re-fetch credit balance from Supabase */
    refreshCredits: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType>({
    credits: 0,
    products: [],
    purchasing: false,
    loadingProducts: true,
    buyCredits: async () => { },
    refreshCredits: async () => { },
});

export function CreditsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [credits, setCredits] = useState(0);
    const [products, setProducts] = useState<Product[]>([]);
    const [purchasing, setPurchasing] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const purchaseUpdateSubscription = useRef<any>(null);
    const purchaseErrorSubscription = useRef<any>(null);

    // Fetch credits from Supabase
    const refreshCredits = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single();

        if (data) {
            setCredits(data.credits ?? 0);
        }
    }, [user]);

    // Initialize IAP and fetch products
    useEffect(() => {
        let mounted = true;

        async function setup() {
            try {
                const fetchedProducts = await initIAP();
                if (mounted) {
                    // Sort products by credit amount
                    const sorted = fetchedProducts.sort((a, b) => {
                        const creditsA = PRODUCT_CREDITS[a.productId] || 0;
                        const creditsB = PRODUCT_CREDITS[b.productId] || 0;
                        return creditsA - creditsB;
                    });
                    setProducts(sorted);
                }
            } catch (err) {
                console.warn('IAP init failed (expected in simulator):', err);
            } finally {
                if (mounted) setLoadingProducts(false);
            }
        }

        setup();

        return () => {
            mounted = false;
            cleanupIAP().catch(() => { });
        };
    }, []);

    // Listen for purchase updates
    useEffect(() => {
        purchaseUpdateSubscription.current = purchaseUpdatedListener(
            async (purchase: Purchase) => {
                try {
                    const result = await validateAndFulfill(purchase);
                    setCredits(result.credits);
                    Alert.alert(
                        '🎉 Credits Added!',
                        `${result.added} credits have been added to your account.`
                    );
                } catch (err: any) {
                    console.error('Purchase fulfillment error:', err);
                    Alert.alert('Purchase Error', err.message || 'Failed to add credits. Please try again.');
                } finally {
                    setPurchasing(false);
                }
            }
        );

        purchaseErrorSubscription.current = purchaseErrorListener(
            (error: PurchaseError) => {
                // User cancelled is not an error
                if (error.code === 'E_USER_CANCELLED') {
                    setPurchasing(false);
                    return;
                }
                console.error('Purchase error:', error);
                Alert.alert('Purchase Error', error.message || 'Something went wrong.');
                setPurchasing(false);
            }
        );

        return () => {
            purchaseUpdateSubscription.current?.remove();
            purchaseErrorSubscription.current?.remove();
        };
    }, []);

    // Fetch credits when user changes
    useEffect(() => {
        refreshCredits();
    }, [refreshCredits]);

    const buyCredits = useCallback(async (productId: string) => {
        if (purchasing) return;
        setPurchasing(true);

        try {
            await purchaseProduct(productId);
            // The purchaseUpdatedListener will handle the rest
        } catch (err: any) {
            console.error('Purchase request error:', err);
            // Don't alert here — the purchaseErrorListener handles it
            setPurchasing(false);
        }
    }, [purchasing]);

    return (
        <CreditsContext.Provider
            value={{
                credits,
                products,
                purchasing,
                loadingProducts,
                buyCredits,
                refreshCredits,
            }}
        >
            {children}
        </CreditsContext.Provider>
    );
}

export const useCredits = () => useContext(CreditsContext);
