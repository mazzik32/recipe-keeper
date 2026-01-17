"use client";

import Link from "next/link";
import { ArrowLeft, Library } from "lucide-react";
import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLanguage } from "@/contexts/LanguageContext";
import { RecipeActionsMenu } from "@/components/recipes/RecipeActionsMenu";
import type { RecipeWithRelations } from "@/types/database.types";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface Collection {
  id: string;
  name: string;
  description: string | null;
}

interface CollectionDetailContentProps {
  collection: Collection;
  recipes: RecipeWithRelations[];
}

export function CollectionDetailContent({ collection, recipes }: CollectionDetailContentProps) {
  const { locale, t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();

  const handleRemoveFromCollection = async (recipeId: string) => {
    if (!confirm(t.collections.confirmRemoveRecipe)) {
      return;
    }

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("recipe_collections")
        .delete()
        .eq("collection_id", collection.id)
        .eq("recipe_id", recipeId);

      if (error) throw error;

      toast({
        title: t.common.success,
        description: t.collections.recipeRemoved || "Recipe removed from collection",
      });

      router.refresh();
    } catch (error) {
      console.error("Error removing recipe from collection:", error);
      toast({
        title: t.common.error,
        description: t.errors.deleteFailed,
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      {/* Back Link */}
      <Link
        href="/dashboard/collections"
        className="inline-flex items-center text-warm-gray-500 hover:text-warm-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t.collections.allCollections}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Library className="w-8 h-8 text-peach-500" />
          <h1 className="font-display text-3xl text-warm-gray-700">
            {collection.name}
          </h1>
        </div>
        {collection.description && (
          <p className="text-warm-gray-500 mb-2">{collection.description}</p>
        )}
        <p className="text-sm text-peach-600">
          {recipes?.length || 0} {locale === "de" ? "Rezept" : "recipe"}{recipes?.length !== 1 ? (locale === "de" ? "e" : "s") : ""}
        </p>
      </div>

      {/* Recipes */}
      {recipes && recipes.length > 0 ? (
        <RecipeGrid
          recipes={recipes}
          renderAction={(recipe) => (
            <RecipeActionsMenu
              recipeId={recipe.id}
              onRemoveFromCollection={() => handleRemoveFromCollection(recipe.id)}
            />
          )}
        />
      ) : (
        <EmptyState
          title={t.collections.noRecipesInCollection}
          description={t.collections.addRecipesHint}
          actionLabel={t.collections.browseRecipes}
          actionHref="/dashboard"
        />
      )}
    </div>
  );
}
