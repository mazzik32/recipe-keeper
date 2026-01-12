import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RecipeForm } from "@/components/recipes/RecipeForm";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: recipe }, { data: categories }] = await Promise.all([
    supabase
      .from("recipes")
      .select(
        `
        *,
        category:categories(*),
        ingredients:recipe_ingredients(*),
        steps:recipe_steps(*)
      `
      )
      .eq("id", id)
      .single(),
    supabase.from("categories").select("*").order("order_index"),
  ]);

  if (!recipe) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/dashboard/recipes/${id}`}
        className="inline-flex items-center text-warm-gray-500 hover:text-warm-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to recipe
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-gray-700 mb-2">
          Edit Recipe
        </h1>
        <p className="text-warm-gray-500">Update your recipe details.</p>
      </div>

      <RecipeForm categories={categories || []} recipe={recipe} />
    </div>
  );
}
