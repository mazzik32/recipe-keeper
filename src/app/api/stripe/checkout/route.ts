import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use service role to update credits reliably or just to verify auth if needed
// Actually validation of user usually uses the auth header, but for checkout creation we just need the user ID.
// For server-side auth validation we should use createClient from @supabase/ssr if possible or just verifying the token.
// But typically for route handlers in Next.js App Router we use:
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';

const PACKAGES = {
  'price_20_credits': { credits: 20, price: 500 }, // 5.00 CHF
  'price_50_credits': { credits: 50, price: 1000 }, // 10.00 CHF
  'price_100_credits': { credits: 100, price: 3500 }, // 35.00 CHF
};

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Create a Supabase client configured to use cookies
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
             // We don't need to set cookies here usually
          }
        }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { packageId, returnUrl } = body;

    // Validate package
    // In a real app, you would fetch prices from Stripe or a DB. 
    // Here we map package IDs to hardcoded Stripe Price IDs or just create ad-hoc Line Items if configured, 
    // but best practice is using Price IDs. 
    // For this implementation, I will treat packageId AS the custom identifier we use to lookup price.
    
    // NOTE: The user's prompt picture showed prices in CHF.
    // 20 Scan-Credits = 5,00 CHF
    // 50 Scan Credits = 10,00 CHF
    // 100 Scan Credits = 35,00 CHF
    
    // We need to define WHAT 'packageId' is. It's likely we haven't created these products in Stripe yet.
    // So we will use line_items with `price_data` for on-the-fly pricing, similar to "Payment Links" style, 
    // unless the user provided Price IDs. 
    // Implementation Plan didn't specify Price ID creation.
    // I will use `price_data` for simplicity so it works immediately without manual Stripe setup.

    let lineItem;
    if (packageId === 'pack_20') {
        lineItem = {
            price_data: {
                currency: 'chf',
                product_data: {
                    name: '20 Scan Credits',
                    description: 'Add 20 credits to your account',
                },
                unit_amount: 500, // 5.00 CHF
            },
            quantity: 1,
        };
    } else if (packageId === 'pack_50') {
        lineItem = {
            price_data: {
                currency: 'chf',
                product_data: {
                    name: '50 Scan Credits',
                    description: 'Add 50 credits to your account',
                },
                unit_amount: 1000, // 10.00 CHF
            },
            quantity: 1,
        };
    } else if (packageId === 'pack_100') {
        lineItem = {
            price_data: {
                currency: 'chf',
                product_data: {
                    name: '100 Scan Credits',
                    description: 'Add 100 credits to your account',
                },
                unit_amount: 3500, // 35.00 CHF
            },
            quantity: 1,
        };
    } else {
        return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [lineItem],
      mode: 'payment',
      success_url: `${returnUrl || `${req.headers.get('origin')}/dashboard`}[?&]checkout_success=true`.replace('[?&]', (returnUrl || '').includes('?') ? '&' : '?'),
      cancel_url: `${returnUrl || `${req.headers.get('origin')}/dashboard`}[?&]checkout_canceled=true`.replace('[?&]', (returnUrl || '').includes('?') ? '&' : '?'),
      metadata: {
        userId: user.id,
        packageId: packageId,
        credits: packageId === 'pack_20' ? '20' : packageId === 'pack_50' ? '50' : '100'
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error('Stripe Checkout Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
