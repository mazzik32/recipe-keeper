import { createClient } from "@/lib/supabase/server";
import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function DashboardPage() {
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
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-gray-700 mb-2">
          My Recipes
        </h1>
        <p className="text-warm-gray-500">
          Your collection of family recipes, all in one place.
        </p>
      </div>

      {recipes && recipes.length > 0 ? (
        <RecipeGrid recipes={recipes} />
      ) : (
        <EmptyState
          icon="📖"
          title="No recipes yet"
          description="Start building your family cookbook by adding your first recipe."
          actionLabel="Add Recipe"
          actionHref="/dashboard/recipes/new"
        />
      )}
    </div>
  );
}
