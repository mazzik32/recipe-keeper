import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NewRecipeFormWrapper } from "./NewRecipeFormWrapper";

export default async function NewRecipePage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("order_index");

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-warm-gray-500 hover:text-warm-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to recipes
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-gray-700 mb-2">
          Add New Recipe
        </h1>
        <p className="text-warm-gray-500">
          Create a new recipe to add to your collection.
        </p>
      </div>

      <NewRecipeFormWrapper categories={categories || []} />
    </div>
  );
}
