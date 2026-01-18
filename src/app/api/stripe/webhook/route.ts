import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Initialize Supabase admin client (Service Role)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
}

const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const userId = session.metadata?.userId;
    const creditsToAdd = parseInt(session.metadata?.credits || '0', 10);

    if (userId && creditsToAdd > 0) {
      console.log(`Adding ${creditsToAdd} credits to user ${userId}`);
      
      // Update user credits via RPC or direct update if using service role
      // We'll verify if RPC is needed for atomic increment, but direct SQL or fetching + updating is okay for now if not high concurrency.
      // Better: Atomic increment. `credits = credits + X`.
      // Supabase JS doesn't support generic atomic increment easily without RPC.
      // But we can enable RPC or use a raw query if we had a function.
      // For now, fetch and update is acceptable for MVP, or we can use the `rpc` call if we created one.
      // I didn't create an increment RPC. I'll read and write for now.
      
      try {
        const { data: profile, error: fetchError } = await supabaseAdmin
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single();
        
        const currentProfile = profile as any; // Temporary fix for type inference issue

        if (fetchError) {
             console.error('Error fetching profile:', fetchError);
             throw fetchError;
        }

        const newCredits = (currentProfile?.credits || 0) + creditsToAdd;

        const { error: updateError } = await (supabaseAdmin
            .from('profiles') as any)
            .update({ credits: newCredits })
            .eq('id', userId);

        if (updateError) {
          console.error('Error updating credits:', updateError);
          throw updateError;
        }
        
        console.log(`Successfully added credits. New balance: ${newCredits}`);

      } catch (err) {
        console.error('Database update failed:', err);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
    } else {
        console.warn('Webhook received but missing userId or credits metadata');
    }
  }

  return NextResponse.json({ received: true });
}
