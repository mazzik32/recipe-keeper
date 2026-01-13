"use client";

import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLanguage } from "@/contexts/LanguageContext";
import type { RecipeWithRelations } from "@/types/database.types";

interface DashboardContentProps {
  recipes: RecipeWithRelations[];
}

export function DashboardContent({ recipes }: DashboardContentProps) {
  const { locale, t } = useLanguage();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-gray-700 mb-2">
          {t.nav.myRecipes}
        </h1>
        <p className="text-warm-gray-500">
          {locale === "de" 
            ? "Ihre Rezeptsammlung, alles an einem Ort." 
            : "Your collection of family recipes, all in one place."}
        </p>
      </div>

      {recipes && recipes.length > 0 ? (
        <RecipeGrid recipes={recipes} />
      ) : (
        <EmptyState
          icon="📖"
          title={t.recipes.noRecipes}
          description={t.recipes.noRecipesDesc}
          actionLabel={t.nav.addRecipe}
          actionHref="/dashboard/recipes/new"
        />
      )}
    </div>
  );
}
