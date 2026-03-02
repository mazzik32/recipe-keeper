require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .limit(1);
  console.log("RECIPES COLUMNS:", data && data.length > 0 ? Object.keys(data[0]) : "NO DATA");
  console.log("ERROR:", JSON.stringify(error));
}
test();
