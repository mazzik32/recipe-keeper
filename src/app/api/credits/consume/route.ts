import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';
import { deductCredits } from '@/lib/credits';
import { getUserTypeSnapshot, trackAnalyticsEvent } from '@/lib/analytics';

export async function POST(req: NextRequest) {
  try {
    let user = null;
    const authHeader = req.headers.get("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const supabaseAdmin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data.user) {
        user = data.user;
      }
    }

    if (!user) {
      const cookieStore = await cookies();
      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll() {}
          }
        }
      );
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({})) as { sourceReference?: string; channel?: string; mode?: string };
    const userTypeSnapshot = getUserTypeSnapshot(user);

    try {
      const newCredits = await deductCredits(user.id, 1, {
        source: 'scan_consume',
        sourceReference: body.sourceReference,
        userTypeSnapshot,
        metadata: {
          channel: body.channel ?? 'web',
          mode: body.mode ?? null,
        },
      });

      await trackAnalyticsEvent({
        eventName: 'recipe_scan_started',
        userId: user.id,
        userTypeSnapshot,
        channel: body.channel ?? 'web',
        eventKey: body.sourceReference ?? null,
        metadata: {
          mode: body.mode ?? null,
        },
      });

      return NextResponse.json({ success: true, credits: newCredits });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('insufficient_credits')) {
        return NextResponse.json({ error: 'Insufficient credits' }, { status: 403 });
      }
      console.error('Failed to deduct credit:', err);
      return NextResponse.json({ error: 'Failed to deduct credit' }, { status: 500 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
