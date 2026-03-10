import { NextRequest, NextResponse } from 'next/server';
import { paddle } from '@/lib/paddle';
import { addCredits } from '@/lib/credits';
import { EventName } from '@paddle/paddle-node-sdk';
import { recordWebhookEvent } from '@/lib/webhook-events';
import { trackAnalyticsEvent } from '@/lib/analytics';

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
      const eventId = (eventData as { eventId?: string; event_id?: string }).eventId ?? (eventData as { event_id?: string }).event_id;
      if (eventId) {
        const isNew = await recordWebhookEvent('paddle', eventId);
        if (!isNew) {
          return NextResponse.json({ received: true });
        }
      } else {
        console.warn('Paddle webhook event missing event id');
      }

      switch (eventData.eventType) {
        case EventName.TransactionCompleted: {
          const transaction = eventData.data as {
            id?: string;
            customData?: { userId?: string; credits?: string; packCode?: string; userTypeSnapshot?: 'anonymous' | 'registered' | 'unknown' };
          };
          const customData = transaction.customData;

          if (customData?.userId) {
            const creditsToAdd = parseInt(customData.credits || '0', 10);
            if (creditsToAdd > 0) {
              await addCredits(customData.userId, creditsToAdd, {
                source: 'paddle',
                sourceReference: transaction.id ?? eventId,
                packCode: customData.packCode ?? undefined,
                userTypeSnapshot: customData.userTypeSnapshot ?? 'unknown',
                metadata: {
                  provider: 'paddle',
                  eventId,
                },
              });

              await trackAnalyticsEvent({
                eventName: 'purchase_completed',
                userId: customData.userId,
                userTypeSnapshot: customData.userTypeSnapshot ?? 'unknown',
                channel: 'paddle-web',
                eventKey: transaction.id ?? eventId ?? customData.userId,
                metadata: {
                  creditsAdded: creditsToAdd,
                  packCode: customData.packCode ?? undefined,
                  eventId,
                  transactionId: transaction.id ?? null,
                },
              });
            }
          }
          break;
        }
        default:
          console.log(`Unhandled event type: ${eventData.eventType}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Paddle Webhook Error:', err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
