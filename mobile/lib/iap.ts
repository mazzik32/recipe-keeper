/**
 * In-App Purchase configuration and helpers for react-native-iap v14.
 *
 * Handles IAP initialization, product fetching, purchase flow,
 * and server-side receipt validation.
 */
import { Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  type Purchase,
  type Product,
  type PurchaseError,
} from 'react-native-iap';
import { supabase } from './supabase';

/** Product IDs — must match App Store Connect / Google Play Console */
export const CREDIT_PRODUCT_IDS = [
  'org.recipekeeper.credits.20',
  'org.recipekeeper.credits.50',
  'org.recipekeeper.credits.400',
];

/** Map product ID → credits (client-side display only; server is authoritative) */
export const PRODUCT_CREDITS: Record<string, number> = {
  'org.recipekeeper.credits.20': 20,
  'org.recipekeeper.credits.50': 50,
  'org.recipekeeper.credits.400': 400,
};

/**
 * Initialize IAP connection and fetch available products.
 */
export async function initIAP(): Promise<Product[]> {
  await initConnection();
  const products = await fetchProducts({ skus: CREDIT_PRODUCT_IDS });
  return products;
}

/**
 * Clean up IAP connection.
 */
export async function cleanupIAP(): Promise<void> {
  await endConnection();
}

/**
 * Request a purchase for the given product ID.
 * Uses the v14 API with platform-specific request objects.
 */
export async function purchaseProduct(productId: string): Promise<void> {
  await requestPurchase({
    request: {
      apple: { sku: productId },
      google: { skus: [productId] },
    },
    type: 'in-app',
  });
}

/**
 * Validate receipt with our server and fulfill credits.
 * Returns the new credit balance.
 */
export async function validateAndFulfill(
  purchase: Purchase
): Promise<{ credits: number; added: number }> {
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
  await finishTransaction({ purchase, isConsumable: true });

  return { credits: data.credits, added: data.added || 0 };
}

export type { Purchase, Product, PurchaseError };
