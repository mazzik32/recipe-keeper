"use client";

import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLanguage } from "@/contexts/LanguageContext";
import type { RecipeWithRelations } from "@/types/database.types";

interface FavoritesContentProps {
  recipes: RecipeWithRelations[];
}

export function FavoritesContent({ recipes }: FavoritesContentProps) {
  const { locale, t } = useLanguage();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-gray-700 mb-2">
          {t.favorites.title}
        </h1>
        <p className="text-warm-gray-500">
          {locale === "de" 
            ? "Ihre Lieblingsrezepte, alle an einem Ort." 
            : "Your most loved recipes, all in one place."}
        </p>
      </div>

      {recipes && recipes.length > 0 ? (
        <RecipeGrid recipes={recipes} />
      ) : (
        <EmptyState
          icon="❤️"
          title={t.favorites.noFavorites}
          description={t.favorites.noFavoritesDesc}
          actionLabel={t.nav.myRecipes}
          actionHref="/dashboard"
        />
      )}
    </div>
  );
}
