import { NextRequest, NextResponse } from 'next/server';
import { paddle } from '@/lib/paddle';
import { addCredits } from '@/lib/credits';
import { EventName } from '@paddle/paddle-node-sdk';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('paddle-signature') as string;
  const body = await req.text();

  if (!signature || !process.env.PADDLE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
  }

  try {
    const eventData = await paddle.webhooks.unmarshal(
      body, 
      process.env.PADDLE_WEBHOOK_SECRET, 
      signature
    );

    if (eventData) {
      switch (eventData.eventType) {
        case EventName.TransactionCompleted:
          const transaction = eventData.data;
          const customData = transaction.customData;
          
          if (customData && customData.userId) {
             const creditsToAdd = parseInt((customData.credits as string) || '0', 10);
             if (creditsToAdd > 0) {
                 await addCredits(customData.userId as string, creditsToAdd);
             }
          }
          break;
        default:
          console.log(`Unhandled event type: ${eventData.eventType}`);
      }
    }
    
    return NextResponse.json({ received: true });

  } catch (err: any) {
    console.error('Paddle Webhook Error:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
