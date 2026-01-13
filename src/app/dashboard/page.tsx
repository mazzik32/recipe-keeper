import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/pages/DashboardContent";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: recipes } = await supabase
    .from("recipes")
    .select(
      `
      *,
      category:categories(*),
      images:recipe_images(*)
    `
    )
    .eq("user_id", user!.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  return <DashboardContent recipes={recipes || []} />;
}
