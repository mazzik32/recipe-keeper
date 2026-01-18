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

/**
 * Adds credits to a user's account.
 * @param userId - The ID of the user to add credits to.
 * @param amount - The number of credits to add.
 * @returns The new credit balance or throws an error.
 */
export async function addCredits(userId: string, amount: number): Promise<number> {
  if (!userId || amount <= 0) {
    throw new Error('Invalid userId or amount');
  }

  console.log(`Adding ${amount} credits to user ${userId}`);

  try {
    // 1. Fetch current credits
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching profile:', fetchError);
      throw fetchError;
    }

    const currentProfile = profile as any; // Temporary fix for type inference if needed
    const currentCredits = currentProfile?.credits || 0;
    const newCredits = currentCredits + amount;

    // 2. Update credits
    const { error: updateError } = await (supabaseAdmin
        .from('profiles') as any)
        .update({ credits: newCredits })
        .eq('id', userId);

    if (updateError) {
      console.error('Error updating credits:', updateError);
      throw updateError;
    }

    console.log(`Successfully added credits. New balance: ${newCredits}`);
    return newCredits;
  } catch (err) {
    console.error('Database update failed:', err);
    throw err;
  }
}
