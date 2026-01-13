import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CollectionDetailContent } from "@/components/pages/CollectionDetailContent";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: collection } = await supabase
    .from("collections")
    .select("*")
    .eq("id", id)
    .single();

  if (!collection) {
    notFound();
  }

  const { data: recipeConnections } = await supabase
    .from("recipe_collections")
    .select("recipe_id")
    .eq("collection_id", id);

  const recipeIds = recipeConnections?.map((rc) => rc.recipe_id) || [];

  let recipes = null;
  if (recipeIds.length > 0) {
    const { data } = await supabase
      .from("recipes")
      .select(
        `
        *,
        category:categories(*),
        images:recipe_images(*)
      `
      )
      .in("id", recipeIds)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    recipes = data;
  }

  return <CollectionDetailContent collection={collection} recipes={recipes || []} />;
}
