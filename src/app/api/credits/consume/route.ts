import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';
import { deductCredits } from '@/lib/credits';

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
             // 
          }
        }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const newCredits = await deductCredits(user.id, 1);
      return NextResponse.json({ success: true, credits: newCredits });
    } catch (err: any) {
      const message = err?.message || '';
      if (message.includes('insufficient_credits')) {
        return NextResponse.json({ error: 'Insufficient credits' }, { status: 403 });
      }
      console.error('Failed to deduct credit:', err);
      return NextResponse.json({ error: 'Failed to deduct credit' }, { status: 500 });
    }
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
