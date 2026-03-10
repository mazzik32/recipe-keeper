import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserTypeSnapshot, trackAnalyticsEvent } from '@/lib/analytics';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as {
      eventName: string;
      channel?: string;
      eventKey?: string;
      recipeId?: string;
      metadata?: Record<string, unknown>;
    };

    await trackAnalyticsEvent({
      eventName: body.eventName,
      userId: user.id,
      userTypeSnapshot: getUserTypeSnapshot(user),
      channel: body.channel ?? 'web',
      eventKey: body.eventKey ?? null,
      recipeId: body.recipeId ?? null,
      metadata: body.metadata ?? {},
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Analytics event API error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
