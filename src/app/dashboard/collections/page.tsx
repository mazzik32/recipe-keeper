import { createClient } from "@/lib/supabase/server";
import { CollectionsPageContent } from "@/components/pages/CollectionsPageContent";

export default async function CollectionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const collectionsWithCount =
    collections?.map((col) => ({
      ...col,
      recipe_count:
        (col.recipe_collections as { count: number }[])?.[0]?.count || 0,
    })) || [];

  return <CollectionsPageContent initialCollections={collectionsWithCount} />;
}
