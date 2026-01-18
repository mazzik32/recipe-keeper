import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';

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

    // We need to use Service Role to decrement accurately/atomically if RLS blocks update
    // But usually users can update their own profile? Only if RLS allows.
    // The policy "Users can update own profile" likely allows it.
    // Ideally we'd use a postgres function `decrement_credits(user_id, amount)` to be atomic.
    // Or we rely on client sending update... wait.
    // If I use client-side update, user can fake it.
    // So I MUST use a server-side route that uses Service Role (admin) to decrement,
    // ensuring the user cannot avoid it.
    
    const supabaseAdmin = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Fetch current credits
    const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();
        
    const userProfile = profile as any;
        
    if (fetchError || !userProfile) {
        return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
    }
    
    if (userProfile.credits < 1) {
        return NextResponse.json({ error: 'Insufficient credits' }, { status: 403 });
    }
    
    // Decrement
    const { error: updateError } = await (supabaseAdmin
        .from('profiles') as any)
        .update({ credits: userProfile.credits - 1 })
        .eq('id', user.id);
        
    if (updateError) {
        return NextResponse.json({ error: 'Failed to deduct credit' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, credits: userProfile.credits - 1 });
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
