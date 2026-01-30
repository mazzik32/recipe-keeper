import { createClient } from "@/lib/supabase/server";
import { SearchContent } from "@/components/pages/SearchContent";

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

    if (query) {
      // 1. Search in recipes (title, description)
      const { data: recipeMatches } = await supabase
        .from("recipes")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

      // 2. Search in ingredients
      const { data: ingredientMatches } = await supabase
        .from("recipe_ingredients")
        .select("recipe_id")
        .ilike("name", `%${query}%`);

      // Merge IDs
      const matchedIds = new Set<string>();
      recipeMatches?.forEach((r) => matchedIds.add(r.id));
      ingredientMatches?.forEach((i) => matchedIds.add(i.recipe_id));

      if (matchedIds.size === 0) {
        // No matches found, return empty result immediately
        recipes = [];
      } else {
        queryBuilder = queryBuilder.in("id", Array.from(matchedIds));
      }
    }

    if (!query || (query && recipes === null)) {
      if (category) {
        queryBuilder = queryBuilder.eq("category_id", category);
      }

      if (difficulty) {
        queryBuilder = queryBuilder.eq("difficulty", difficulty);
      }

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
  }

  return (
    <SearchContent
      recipes={recipes}
      categories={categories || []}
      currentParams={params}
    />
  );
}
