// Load .env.local (Next.js convention — not auto-loaded by Node)
const fs = require('fs'), path = require('path');
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && !key.startsWith('#')) process.env[key.trim()] ??= rest.join('=').trim();
  });
}
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, credits, created_at');
  if (profilesError) throw profilesError;

  for (const profile of profiles || []) {
    if ((profile.credits || 0) > 0) {
      await supabase.from('credit_transactions').upsert({
        user_id: profile.id,
        direction: 'adjustment',
        amount: profile.credits,
        source: 'admin_adjustment',
        source_reference: `backfill-balance:${profile.id}`,
        user_type_snapshot: 'unknown',
        metadata: { reason: 'initial_outstanding_balance_backfill' },
        created_at: profile.created_at,
      }, { onConflict: 'source,source_reference' });
    }
  }

  const { data: recipes, error: recipesError } = await supabase.from('recipes').select('id, user_id, created_at, source_type');
  if (recipesError) throw recipesError;

  for (const recipe of recipes || []) {
    await supabase.from('analytics_events').upsert({
      event_name: 'recipe_created',
      user_id: recipe.user_id,
      user_type_snapshot: 'unknown',
      channel: 'backfill',
      recipe_id: recipe.id,
      event_key: recipe.id,
      metadata: { source_type: recipe.source_type, backfilled: true },
      occurred_at: recipe.created_at,
    }, { onConflict: 'event_name,event_key' });
  }

  console.log(`Backfilled ${profiles?.length || 0} profiles and ${recipes?.length || 0} recipe events.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
