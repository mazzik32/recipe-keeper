import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch the category
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!category) {
    notFound();
  }

  // Fetch recipes in this category
  const { data: recipes } = await supabase
    .from("recipes")
    .select(
      `
      *,
      category:categories(*),
      images:recipe_images(*)
    `
    )
    .eq("category_id", category.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  return (
    <div>
      {/* Back Link */}
      <Link
        href="/dashboard/categories"
        className="inline-flex items-center text-warm-gray-500 hover:text-warm-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        All Categories
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{category.icon}</span>
          <h1 className="font-display text-3xl text-warm-gray-700">
            {category.name}
          </h1>
        </div>
        <p className="text-warm-gray-500">
          {recipes?.length || 0} recipe{recipes?.length !== 1 ? "s" : ""} in
          this category
        </p>
      </div>

      {/* Recipes */}
      {recipes && recipes.length > 0 ? (
        <RecipeGrid recipes={recipes} />
      ) : (
        <EmptyState
          title={`No ${category.name} recipes yet`}
          description="Start adding recipes to this category"
          actionLabel="Add Recipe"
          actionHref="/dashboard/recipes/new"
        />
      )}
    </div>
  );
}
