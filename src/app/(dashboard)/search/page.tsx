import { createClient } from "@/lib/supabase/server";
import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: query } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let recipes = null;

  if (query && user) {
    const { data } = await supabase
      .from("recipes")
      .select(
        `
        *,
        category:categories(*),
        images:recipe_images(*)
      `
      )
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    recipes = data;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-gray-700 mb-2">
          Search Results
        </h1>
        {query ? (
          <p className="text-warm-gray-500">
            {recipes?.length || 0} results for &quot;{query}&quot;
          </p>
        ) : (
          <p className="text-warm-gray-500">Enter a search term to find recipes.</p>
        )}
      </div>

      {recipes && recipes.length > 0 ? (
        <RecipeGrid recipes={recipes} />
      ) : query ? (
        <EmptyState
          icon="🔍"
          title="No recipes found"
          description={`We couldn't find any recipes matching "${query}". Try a different search term.`}
        />
      ) : (
        <EmptyState
          icon="🔍"
          title="Start searching"
          description="Use the search bar above to find recipes by title or description."
        />
      )}
    </div>
  );
}
