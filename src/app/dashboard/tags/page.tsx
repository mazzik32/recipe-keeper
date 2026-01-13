import { createClient } from "@/lib/supabase/server";
import { TagsManager } from "@/components/recipes/TagsManager";
import { TagsPageContent } from "@/components/pages/TagsPageContent";

export default async function TagsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tags } = await supabase
    .from("tags")
    .select(
      `
      *,
      recipe_tags(count)
    `
    )
    .eq("user_id", user?.id)
    .order("name");

  const tagsWithCount =
    tags?.map((tag) => ({
      ...tag,
      recipe_count: (tag.recipe_tags as { count: number }[])?.[0]?.count || 0,
    })) || [];

  return <TagsPageContent initialTags={tagsWithCount} />;
}
