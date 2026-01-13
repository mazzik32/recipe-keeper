import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditRecipeContent } from "@/components/pages/EditRecipeContent";

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
        steps:recipe_steps(*),
        images:recipe_images(*)
      `
      )
      .eq("id", id)
      .single(),
    supabase.from("categories").select("*").order("order_index"),
  ]);

  if (!recipe) {
    notFound();
  }

  return <EditRecipeContent recipe={recipe} categories={categories || []} />;
}
