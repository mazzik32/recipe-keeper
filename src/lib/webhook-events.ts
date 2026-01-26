import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is missing');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function recordWebhookEvent(provider: string, eventId: string): Promise<boolean> {
  if (!provider || !eventId) {
    throw new Error('Invalid provider or eventId');
  }

  const supabaseAdmin = getAdminClient();

  const { error } = await supabaseAdmin
    .from('webhook_events')
    .insert({ provider, event_id: eventId });

  if (!error) {
    return true;
  }

  if (error.code === '23505') {
    return false; // duplicate
  }

  console.error('Failed to record webhook event:', error);
  throw error;
}
