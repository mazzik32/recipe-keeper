import { NextRequest, NextResponse } from 'next/server';
import { paddle } from '@/lib/paddle';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';

// TODO: REPLACE THESE WITH YOUR ACTUAL PADDLE PRICE IDS
const PADDLE_PRICES = {
  'pack_20': process.env.PADDLE_PRICE_ID_20 || 'pri_PLACEHOLDER_20',
  'pack_50': process.env.PADDLE_PRICE_ID_50 || 'pri_PLACEHOLDER_50',
  'pack_100': process.env.PADDLE_PRICE_ID_100 || 'pri_PLACEHOLDER_100',
};

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
             // We don't need to set cookies here
          }
        }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { packageId } = body;

    const priceId = PADDLE_PRICES[packageId as keyof typeof PADDLE_PRICES];

    if (!priceId) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    // Create a transaction to attach custom data securely
    const transaction = await paddle.transactions.create({
      items: [
        {
          quantity: 1,
          priceId: priceId
        }
      ],
      customData: {
        userId: user.id,
        packageId: packageId,
        credits: packageId === 'pack_20' ? '20' : packageId === 'pack_50' ? '50' : '100'
      },
    });

    return NextResponse.json({ transactionId: transaction.id });
  } catch (err: any) {
    console.error('Paddle Checkout Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
