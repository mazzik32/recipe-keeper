/**
 * Google Play receipt / purchase verification.
 *
 * Uses the Google Play Developer API (androidpublisher v3)
 * to verify consumable product purchases.
 *
 * Docs: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products
 */

interface GoogleServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri: string;
}

interface GoogleVerificationResult {
  valid: boolean;
  transactionId?: string;
  productId?: string;
  error?: string;
}

/**
 * Get an OAuth2 access token using the service account credentials.
 */
async function getAccessToken(serviceAccount: GoogleServiceAccountKey): Promise<string> {
  // Build JWT for service account auth
  const now = Math.floor(Date.now() / 1000);

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: serviceAccount.token_uri,
    iat: now,
    exp: now + 3600,
  })).toString('base64url');

  const { createSign } = await import('crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(serviceAccount.private_key, 'base64url');

  const jwt = `${header}.${payload}.${signature}`;

  const response = await fetch(serviceAccount.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Google access token: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Verify a Google Play purchase.
 *
 * @param productId  The product ID (e.g. 'org.recipekeeper.credits.20')
 * @param purchaseToken  The purchase token from the client
 */
export async function verifyGooglePurchase(
  productId: string,
  purchaseToken: string
): Promise<GoogleVerificationResult> {
  try {
    const serviceAccountRaw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const packageName = process.env.GOOGLE_PACKAGE_NAME || 'org.recipekeeper.mobile';

    if (!serviceAccountRaw) {
      return { valid: false, error: 'GOOGLE_SERVICE_ACCOUNT_KEY not configured' };
    }

    const serviceAccount: GoogleServiceAccountKey = JSON.parse(serviceAccountRaw);
    const accessToken = await getAccessToken(serviceAccount);

    // Verify the purchase with Google Play Developer API
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${productId}/tokens/${purchaseToken}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { valid: false, error: `Google API error: ${response.status} ${errorText}` };
    }

    const purchase = await response.json();

    // purchaseState: 0 = purchased, 1 = canceled, 2 = pending
    if (purchase.purchaseState !== 0) {
      return { valid: false, error: `Purchase not completed (state: ${purchase.purchaseState})` };
    }

    // Acknowledge the purchase (required for consumables)
    if (purchase.acknowledgementState === 0) {
      const ackUrl = `${url}:acknowledge`;
      await fetch(ackUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    }

    // Consume the purchase so it can be bought again
    const consumeUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${productId}/tokens/${purchaseToken}:consume`;
    await fetch(consumeUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      valid: true,
      transactionId: purchase.orderId,
      productId,
    };
  } catch (err: any) {
    console.error('Google purchase verification failed:', err);
    return { valid: false, error: err.message };
  }
}
