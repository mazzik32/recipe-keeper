require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('collections')
    .select(`
        *,
        recipes(count)
    `)
    .limit(1);
  console.log("DATA:", JSON.stringify(data));
  console.log("ERROR:", JSON.stringify(error));
}
test();
