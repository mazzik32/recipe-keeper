import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Library } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch the collection
  const { data: collection } = await supabase
    .from("collections")
    .select("*")
    .eq("id", id)
    .single();

  if (!collection) {
    notFound();
  }

  // Fetch recipes in this collection
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

  return (
    <div>
      {/* Back Link */}
      <Link
        href="/dashboard/collections"
        className="inline-flex items-center text-warm-gray-500 hover:text-warm-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        All Collections
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Library className="w-8 h-8 text-peach-500" />
          <h1 className="font-display text-3xl text-warm-gray-700">
            {collection.name}
          </h1>
        </div>
        {collection.description && (
          <p className="text-warm-gray-500 mb-2">{collection.description}</p>
        )}
        <p className="text-sm text-peach-600">
          {recipes?.length || 0} recipe{recipes?.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Recipes */}
      {recipes && recipes.length > 0 ? (
        <RecipeGrid recipes={recipes} />
      ) : (
        <EmptyState
          title="No recipes in this collection"
          description="Add recipes to this collection from the recipe detail page."
          actionLabel="Browse Recipes"
          actionHref="/dashboard"
        />
      )}
    </div>
  );
}
