import { createClient } from "@/lib/supabase/server";
import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchFilters } from "@/components/recipes/SearchFilters";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    difficulty?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const { q: query, category, difficulty, sort } = params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch categories for filter dropdown
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("order_index");

  let recipes = null;

  if (user) {
    let queryBuilder = supabase
      .from("recipes")
      .select(
        `
        *,
        category:categories(*),
        images:recipe_images(*)
      `
      )
      .eq("user_id", user.id)
      .eq("is_archived", false);

    // Apply search query
    if (query) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,description.ilike.%${query}%`
      );
    }

    // Apply category filter
    if (category) {
      queryBuilder = queryBuilder.eq("category_id", category);
    }

    // Apply difficulty filter
    if (difficulty) {
      queryBuilder = queryBuilder.eq("difficulty", difficulty);
    }

    // Apply sorting
    switch (sort) {
      case "title":
        queryBuilder = queryBuilder.order("title", { ascending: true });
        break;
      case "oldest":
        queryBuilder = queryBuilder.order("created_at", { ascending: true });
        break;
      case "prep_time":
        queryBuilder = queryBuilder.order("prep_time_minutes", {
          ascending: true,
          nullsFirst: false,
        });
        break;
      case "cook_time":
        queryBuilder = queryBuilder.order("cook_time_minutes", {
          ascending: true,
          nullsFirst: false,
        });
        break;
      default:
        queryBuilder = queryBuilder.order("created_at", { ascending: false });
    }

    const { data } = await queryBuilder;
    recipes = data;
  }

  const hasFilters = query || category || difficulty || sort;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-warm-gray-700 mb-2">
          {query ? "Search Results" : "Browse Recipes"}
        </h1>
        {query ? (
          <p className="text-warm-gray-500">
            {recipes?.length || 0} results for &quot;{query}&quot;
          </p>
        ) : (
          <p className="text-warm-gray-500">
            Filter and sort your recipe collection.
          </p>
        )}
      </div>

      {/* Filters */}
      <SearchFilters
        categories={categories || []}
        currentParams={params}
      />

      {/* Results */}
      {recipes && recipes.length > 0 ? (
        <RecipeGrid recipes={recipes} />
      ) : hasFilters ? (
        <EmptyState
          icon="🔍"
          title="No recipes found"
          description="Try adjusting your filters or search term."
        />
      ) : (
        <EmptyState
          icon="🔍"
          title="Start searching"
          description="Use the search bar and filters to find recipes."
        />
      )}
    </div>
  );
}
