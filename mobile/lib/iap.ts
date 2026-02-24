/**
 * In-App Purchase configuration and helpers for react-native-iap v14.
 *
 * Handles IAP initialization, product fetching, purchase flow,
 * and server-side receipt validation.
 *
 * All functions are wrapped with try/catch to prevent crashes
 * if the native IAP module is not available (e.g. old builds
 * without the plugin, or simulators).
 */
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Lazy-load react-native-iap to prevent crash if native module is missing
let RNIap: typeof import('react-native-iap') | null = null;
try {
  RNIap = require('react-native-iap');
} catch (e) {
  console.warn('react-native-iap native module not available. IAP disabled.');
}

/** Product IDs — must match App Store Connect / Google Play Console */
export const CREDIT_PRODUCT_IDS = [
  'org.recipekeeper.credits.20',
  'org.recipekeeper.credits.50',
  'org.recipekeeper.credits.200',
  'org.recipekeeper.credits.400',
];

/** Map product ID → credits (client-side display only; server is authoritative) */
export const PRODUCT_CREDITS: Record<string, number> = {
  'org.recipekeeper.credits.20': 20,
  'org.recipekeeper.credits.50': 50,
  'org.recipekeeper.credits.200': 200,
  'org.recipekeeper.credits.400': 400,
};

// Re-export types (safe even if module is missing)
export type Purchase = import('react-native-iap').Purchase;
export type Product = import('react-native-iap').Product;
export type PurchaseError = import('react-native-iap').PurchaseError;

/** Whether the IAP native module is available */
export const isIAPAvailable = (): boolean => RNIap !== null;

/**
 * Initialize IAP connection and fetch available products.
 * Returns empty array if IAP is not available or crashes.
 */
export async function initIAP(): Promise<any[]> {
  if (!RNIap) return [];
  try {
    await RNIap.initConnection();
    const products = await RNIap.fetchProducts({ skus: CREDIT_PRODUCT_IDS });
    return products || [];
  } catch (err) {
    console.warn('initIAP failed (Nitro/native module may not be ready):', err);
    return [];
  }
}

/**
 * Clean up IAP connection.
 */
export async function cleanupIAP(): Promise<void> {
  if (!RNIap) return;
  try {
    await RNIap.endConnection();
  } catch (err) {
    console.warn('cleanupIAP failed:', err);
  }
}

/**
 * Request a purchase for the given product ID.
 * Uses the v14 API with platform-specific request objects.
 */
export async function purchaseProduct(productId: string): Promise<void> {
  if (!RNIap) throw new Error('IAP not available');
  
  try {
    await RNIap.requestPurchase({
      request: {
        apple: { sku: productId },
        google: { skus: [productId] },
      },
      type: 'in-app'
    });
  } catch (err: any) {
    console.error('purchaseProduct native error:', err);
    throw err;
  }
}

/**
 * Get purchase listeners (safe — returns null if IAP unavailable or crashes).
 */
export function getPurchaseListeners() {
  if (!RNIap) return null;
  try {
    return {
      purchaseUpdatedListener: RNIap.purchaseUpdatedListener,
      purchaseErrorListener: RNIap.purchaseErrorListener,
    };
  } catch (err) {
    console.warn('getPurchaseListeners failed:', err);
    return null;
  }
}

/**
 * Validate receipt with our server and fulfill credits.
 * Returns the new credit balance.
 */
export async function validateAndFulfill(
  purchase: any
): Promise<{ credits: number; added: number }> {
  if (!RNIap) throw new Error('IAP not available');

  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const receipt = platform === 'ios'
    ? purchase.transactionReceipt
    : purchase.purchaseToken;

  if (!receipt) {
    throw new Error('No receipt/token found on purchase');
  }

  // Get current session for auth
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const apiUrl = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.vercel.app');

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
