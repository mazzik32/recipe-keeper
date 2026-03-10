import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export type AnalyticsUserType = Database['public']['Enums']['analytics_user_type'];
export type CreditTransactionDirection = Database['public']['Enums']['credit_transaction_direction'];
export type CreditTransactionSource = Database['public']['Enums']['credit_transaction_source'];

export interface TrackCreditTransactionInput {
  userId: string;
  direction: CreditTransactionDirection;
  amount: number;
  source: CreditTransactionSource;
  sourceReference?: string | null;
  packCode?: string | null;
  userTypeSnapshot?: AnalyticsUserType;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface TrackAnalyticsEventInput {
  eventName: string;
  userId?: string | null;
  userTypeSnapshot?: AnalyticsUserType;
  channel?: string | null;
  recipeId?: string | null;
  eventKey?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is missing');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getUserTypeSnapshot(user: Pick<User, 'is_anonymous'> | null | undefined): AnalyticsUserType {
  if (!user) return 'unknown';
  return user.is_anonymous ? 'anonymous' : 'registered';
}

export async function trackCreditTransaction(input: TrackCreditTransactionInput): Promise<void> {
  if (!input.userId || input.amount <= 0) {
    throw new Error('Invalid credit transaction payload');
  }

  const supabaseAdmin = getAdminClient();
  const payload: Database['public']['Tables']['credit_transactions']['Insert'] = {
    user_id: input.userId,
    direction: input.direction,
    amount: input.amount,
    source: input.source,
    source_reference: input.sourceReference ?? null,
    pack_code: input.packCode ?? null,
    user_type_snapshot: input.userTypeSnapshot ?? 'unknown',
    metadata: (input.metadata ?? {}) as Database['public']['Tables']['analytics_events']['Insert']['metadata'],
    created_at: input.createdAt ?? new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('credit_transactions').insert(payload as never);

  if (error && error.code !== '23505') {
    console.error('Failed to record credit transaction:', error);
    throw error;
  }
}

export async function trackAnalyticsEvent(input: TrackAnalyticsEventInput): Promise<void> {
  if (!input.eventName) {
    throw new Error('Invalid analytics event payload');
  }

  const supabaseAdmin = getAdminClient();
  const payload: Database['public']['Tables']['analytics_events']['Insert'] = {
    event_name: input.eventName,
    user_id: input.userId ?? null,
    user_type_snapshot: input.userTypeSnapshot ?? 'unknown',
    channel: input.channel ?? null,
    recipe_id: input.recipeId ?? null,
    event_key: input.eventKey ?? null,
    metadata: (input.metadata ?? {}) as Database['public']['Tables']['credit_transactions']['Insert']['metadata'],
    occurred_at: input.occurredAt ?? new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('analytics_events').insert(payload as never);

  if (error && error.code !== '23505') {
    console.error('Failed to record analytics event:', error);
    throw error;
  }
}
