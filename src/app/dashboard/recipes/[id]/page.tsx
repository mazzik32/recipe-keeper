import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RecipeDetailContent } from "@/components/pages/RecipeDetailContent";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: recipe } = await supabase
    .from("recipes")
    .select(
      `
      *,
      category:categories(*),
      ingredients:recipe_ingredients(*),
      steps:recipe_steps(*),
      images:recipe_images(*)
    `
    )
    .eq("id", id)
    .single();

  if (!recipe) {
    notFound();
  }

  return <RecipeDetailContent recipe={recipe} />;
}
