import { createClient } from "@/lib/supabase/server";
import { TagsManager } from "@/components/recipes/TagsManager";

export default async function TagsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user's tags with recipe count
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

  // Transform data to include count
  const tagsWithCount =
    tags?.map((tag) => ({
      ...tag,
      recipe_count: (tag.recipe_tags as { count: number }[])?.[0]?.count || 0,
    })) || [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-gray-700 mb-2">Tags</h1>
        <p className="text-warm-gray-500">
          Organize your recipes with custom tags.
        </p>
      </div>

      <TagsManager initialTags={tagsWithCount} />
    </div>
  );
}
