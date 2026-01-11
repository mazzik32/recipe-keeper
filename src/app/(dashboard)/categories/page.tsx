import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("order_index");

  // Get recipe count per category
  const { data: recipeCounts } = await supabase
    .from("recipes")
    .select("category_id")
    .eq("user_id", user!.id)
    .eq("is_archived", false);

  const countMap: Record<string, number> = {};
  recipeCounts?.forEach((r) => {
    if (r.category_id) {
      countMap[r.category_id] = (countMap[r.category_id] || 0) + 1;
    }
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-gray-700 mb-2">
          Categories
        </h1>
        <p className="text-warm-gray-500">Browse recipes by category.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories?.map((category) => (
          <Link key={category.id} href={`/dashboard/categories/${category.slug}`}>
            <Card className="border-warm-gray-100 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="font-display text-lg text-warm-gray-700 mb-1">
                  {category.name}
                </h3>
                <p className="text-sm text-warm-gray-400">
                  {countMap[category.id] || 0} recipes
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
