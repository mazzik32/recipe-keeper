import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CategoryDetailContent } from "@/components/pages/CategoryDetailContent";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!category) {
    notFound();
  }

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

  return <CategoryDetailContent category={category} recipes={recipes || []} />;
}
