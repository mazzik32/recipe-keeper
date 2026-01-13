import { createClient } from "@/lib/supabase/server";
import { NewRecipeContent } from "@/components/pages/NewRecipeContent";

export default async function NewRecipePage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("order_index");

  return <NewRecipeContent categories={categories || []} />;
}
