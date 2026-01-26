import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { addCredits } from '@/lib/credits';
import { recordWebhookEvent } from '@/lib/webhook-events';

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
    try {
      const isNew = await recordWebhookEvent('stripe', event.id);
      if (!isNew) {
        return NextResponse.json({ received: true });
      }
    } catch (err) {
      console.error('Failed to record webhook event:', err);
      return NextResponse.json({ error: 'Webhook idempotency check failed' }, { status: 500 });
    }

    const session = event.data.object as any;
    const userId = session.metadata?.userId;
    const creditsToAdd = parseInt(session.metadata?.credits || '0', 10);

    if (userId && creditsToAdd > 0) {
      console.log(`Adding ${creditsToAdd} credits to user ${userId}`);

      try {
        await addCredits(userId, creditsToAdd);
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
