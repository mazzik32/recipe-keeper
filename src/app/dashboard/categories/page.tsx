import { createClient } from "@/lib/supabase/server";
import { CategoriesContent } from "@/components/pages/CategoriesContent";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("order_index");

  const { data: recipeCounts } = await supabase
    .from("recipes")
    .select("category_id")
    .eq("user_id", user!.id)
    .eq("is_archived", false);

  const countMap: Record<string, number> = {};
  recipeCounts?.forEach((r) => {
    if (r.category_id) {
      countMap[r.category_id] = (countMap[r.category_id] || 0) + 1;
    }
  });

  return <CategoriesContent categories={categories || []} countMap={countMap} />;
}
