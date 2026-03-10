import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { trackCreditTransaction, type AnalyticsUserType, type CreditTransactionSource } from '@/lib/analytics';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type CreditsDatabase = Database & {
  public: Database["public"] & {
    Functions: {
      increment_credits: {
        Args: { p_user_id: string; p_amount: number };
        Returns: number;
      };
      decrement_credits: {
        Args: { p_user_id: string; p_amount: number };
        Returns: number;
      };
    };
  };
};

function getAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is missing');
  }

  return createClient<CreditsDatabase>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

interface CreditMutationOptions {
  source?: CreditTransactionSource;
  sourceReference?: string;
  packCode?: string;
  userTypeSnapshot?: AnalyticsUserType;
  metadata?: Record<string, unknown>;
}

export async function addCredits(userId: string, amount: number, options: CreditMutationOptions = {}): Promise<number> {
  if (!userId || amount <= 0) {
    throw new Error('Invalid userId or amount');
  }

  const supabaseAdmin = getAdminClient();

  const { data, error } = await supabaseAdmin.rpc(
    'increment_credits',
    { p_user_id: userId, p_amount: amount } as never
  );

  if (error) {
    console.error('Error incrementing credits:', error);
    throw error;
  }

  await trackCreditTransaction({
    userId,
    direction: 'grant',
    amount,
    source: options.source ?? 'admin_adjustment',
    sourceReference: options.sourceReference,
    packCode: options.packCode,
    userTypeSnapshot: options.userTypeSnapshot,
    metadata: options.metadata,
  });

  return data as number;
}

export async function deductCredits(userId: string, amount: number, options: CreditMutationOptions = {}): Promise<number> {
  if (!userId || amount <= 0) {
    throw new Error('Invalid userId or amount');
  }

  const supabaseAdmin = getAdminClient();

  const { data, error } = await supabaseAdmin.rpc(
    'decrement_credits',
    { p_user_id: userId, p_amount: amount } as never
  );

  if (error) {
    console.error('Error decrementing credits:', error);
    throw error;
  }

  await trackCreditTransaction({
    userId,
    direction: 'consume',
    amount,
    source: options.source ?? 'scan_consume',
    sourceReference: options.sourceReference,
    packCode: options.packCode,
    userTypeSnapshot: options.userTypeSnapshot,
    metadata: options.metadata,
  });

  return data as number;
}
