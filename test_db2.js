require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('recipe_images').select('image_url').order('created_at', { ascending: false }).limit(5);
  if (error) console.error(error);
  console.log(JSON.stringify(data, null, 2));
}

run();
