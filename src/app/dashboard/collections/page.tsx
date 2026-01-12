import { createClient } from "@/lib/supabase/server";
import { CollectionsManager } from "@/components/recipes/CollectionsManager";

export default async function CollectionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user's collections with recipe count
  const { data: collections } = await supabase
    .from("collections")
    .select(
      `
      *,
      recipe_collections(count)
    `
    )
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  // Transform data to include count
  const collectionsWithCount =
    collections?.map((col) => ({
      ...col,
      recipe_count:
        (col.recipe_collections as { count: number }[])?.[0]?.count || 0,
    })) || [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-gray-700 mb-2">
          Collections
        </h1>
        <p className="text-warm-gray-500">
          Group your recipes into custom collections.
        </p>
      </div>

      <CollectionsManager initialCollections={collectionsWithCount} />
    </div>
  );
}
