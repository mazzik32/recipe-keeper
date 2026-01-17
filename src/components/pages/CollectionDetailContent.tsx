"use client";

import Link from "next/link";
import { ArrowLeft, Library } from "lucide-react";
import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLanguage } from "@/contexts/LanguageContext";
import { RemoveFromCollectionButton } from "@/components/collections/RemoveFromCollectionButton";
import type { RecipeWithRelations } from "@/types/database.types";

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
            <RemoveFromCollectionButton
              collectionId={collection.id}
              recipeId={recipe.id}
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
