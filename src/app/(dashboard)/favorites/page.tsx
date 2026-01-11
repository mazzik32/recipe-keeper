import { createClient } from "@/lib/supabase/server";
import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { EmptyState } from "@/components/shared/EmptyState";

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-gray-700 mb-2">
          Favorite Recipes
        </h1>
        <p className="text-warm-gray-500">
          Your most loved recipes, all in one place.
        </p>
      </div>

      {recipes && recipes.length > 0 ? (
        <RecipeGrid recipes={recipes} />
      ) : (
        <EmptyState
          icon="❤️"
          title="No favorites yet"
          description="Mark recipes as favorites to see them here."
          actionLabel="Browse Recipes"
          actionHref="/dashboard"
        />
      )}
    </div>
  );
}
