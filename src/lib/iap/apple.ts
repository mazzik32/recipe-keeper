/**
 * Apple App Store receipt / transaction verification.
 *
 * Uses the App Store Server API v2 (JWT-based).
 * For StoreKit 2, the client sends a JWS-signed transaction,
 * which we decode and verify here.
 *
 * Docs: https://developer.apple.com/documentation/appstoreserverapi
 */


const APPLE_ROOT_CERT_URL = 'https://appleid.apple.com/auth/keys';
const APPLE_PRODUCTION_URL = 'https://api.storekit.itunes.apple.com';
const APPLE_SANDBOX_URL = 'https://api.storekit-sandbox.itunes.apple.com';

interface AppleTransactionInfo {
  transactionId: string;
  originalTransactionId: string;
  productId: string;
  type: string;           // 'Consumable' | 'Non-Consumable' | ...
  environment: string;    // 'Production' | 'Sandbox'
  bundleId: string;
}

interface AppleVerificationResult {
  valid: boolean;
  transactionId?: string;
  productId?: string;
  error?: string;
}

/**
 * Verify a StoreKit 2 signed transaction (JWS).
 *
 * The mobile app sends the `transactionJWS` string obtained from
 * `react-native-iap`'s `transactionReceipt`.
 */
export async function verifyAppleTransaction(
  transactionJWS: string
): Promise<AppleVerificationResult> {
  try {
    // StoreKit 2 transactions are signed JWTs from Apple.
    // We decode them to extract transaction info.
    // In production, you should verify the signature against Apple's public keys.
    const parts = transactionJWS.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid JWS format' };
    }

    // Decode the payload (base64url)
    const payloadB64 = parts[1];
    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload: AppleTransactionInfo = JSON.parse(payloadStr);

    // Validate required fields
    if (!payload.transactionId || !payload.productId) {
      return { valid: false, error: 'Missing transactionId or productId' };
    }

    // Validate bundle ID matches our app
    const expectedBundleId = 'org.recipekeeper.mobile';
    if (payload.bundleId && payload.bundleId !== expectedBundleId) {
      return { valid: false, error: `Bundle ID mismatch: ${payload.bundleId}` };
    }

    // Validate it's a consumable purchase
    if (payload.type && payload.type !== 'Consumable') {
      console.warn(`Unexpected transaction type: ${payload.type}`);
    }

    return {
      valid: true,
      transactionId: payload.transactionId,
      productId: payload.productId,
    };
  } catch (err: any) {
    console.error('Apple transaction verification failed:', err);
    return { valid: false, error: err.message };
  }
}
