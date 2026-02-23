import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addCredits } from '@/lib/credits';
import { recordWebhookEvent } from '@/lib/webhook-events';
import { creditsForProduct } from '@/lib/iap/products';
import { verifyAppleTransaction } from '@/lib/iap/apple';
import { verifyGooglePurchase } from '@/lib/iap/google';

/**
 * POST /api/iap/verify
 *
 * Verifies an in-app purchase receipt from iOS (Apple) or Android (Google),
 * then atomically adds credits to the user's account.
 *
 * Body: {
 *   platform: 'ios' | 'android',
 *   receipt: string,         // JWS transaction (iOS) or purchase token (Android)
 *   productId: string,       // e.g. 'org.recipekeeper.credits.20'
 * }
 *
 * Auth: Authorization header with Supabase access token
 */
export async function POST(req: NextRequest) {
  try {
    // --- Authenticate user via Supabase JWT ---
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- Parse request body ---
    const body = await req.json();
    const { platform, receipt, productId } = body;

    if (!platform || !receipt || !productId) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, receipt, productId' },
        { status: 400 }
      );
    }

    if (platform !== 'ios' && platform !== 'android') {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    // --- Validate product ID ---
    const creditsToAdd = creditsForProduct(productId);
    if (!creditsToAdd) {
      return NextResponse.json({ error: 'Invalid productId' }, { status: 400 });
    }

    // --- Verify receipt with store ---
    let transactionId: string | undefined;

    if (platform === 'ios') {
      const result = await verifyAppleTransaction(receipt);
      if (!result.valid) {
        console.error('Apple verification failed:', result.error);
        return NextResponse.json(
          { error: `Apple verification failed: ${result.error}` },
          { status: 400 }
        );
      }
      transactionId = result.transactionId;

      // Validate productId matches what was purchased
      if (result.productId !== productId) {
        return NextResponse.json(
          { error: `Product mismatch: expected ${productId}, got ${result.productId}` },
          { status: 400 }
        );
      }
    } else {
      const result = await verifyGooglePurchase(productId, receipt);
      if (!result.valid) {
        console.error('Google verification failed:', result.error);
        return NextResponse.json(
          { error: `Google verification failed: ${result.error}` },
          { status: 400 }
        );
      }
      transactionId = result.transactionId;
    }

    // --- Idempotency check ---
    if (transactionId) {
      try {
        const isNew = await recordWebhookEvent(`iap_${platform}`, transactionId);
        if (!isNew) {
          // Already processed — return current balance without adding credits again
          const { data: profile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single();

          return NextResponse.json({
            success: true,
            credits: profile?.credits ?? 0,
            alreadyProcessed: true,
          });
        }
      } catch (err) {
        console.error('Idempotency check failed:', err);
        return NextResponse.json({ error: 'Idempotency check failed' }, { status: 500 });
      }
    }

    // --- Add credits ---
    console.log(`IAP: Adding ${creditsToAdd} credits to user ${user.id} (${platform}, tx: ${transactionId})`);
    const newBalance = await addCredits(user.id, creditsToAdd);

    return NextResponse.json({
      success: true,
      credits: newBalance,
      added: creditsToAdd,
    });
  } catch (err: any) {
    console.error('IAP verify error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
