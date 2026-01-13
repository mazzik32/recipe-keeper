import { createClient } from "@/lib/supabase/server";
import { FavoritesContent } from "@/components/pages/FavoritesContent";

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: recipes } = await supabase
    .from("recipes")
    .select(
      `
      *,
      category:categories(*),
      images:recipe_images(*)
    `
    )
    .eq("user_id", user!.id)
    .eq("is_favorite", true)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  return <FavoritesContent recipes={recipes || []} />;
}
