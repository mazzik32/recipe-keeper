import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/pages/DashboardContent";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tags } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", user!.id)
    .order("name");

  const { data: rawRecipes } = await supabase
    .from("recipes")
    .select(
      `
      *,
      category:categories(*),
      images:recipe_images(*),
      recipe_tags(
        tags(*)
      )
    `
    )
    .eq("user_id", user!.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  // Transform recipes to include flat tags array
  const recipes = rawRecipes?.map((recipe) => ({
    ...recipe,
    tags: recipe.recipe_tags.map((rt: any) => rt.tags).filter(Boolean),
  })) || [];

  return <DashboardContent recipes={recipes} allTags={tags || []} />;
}
