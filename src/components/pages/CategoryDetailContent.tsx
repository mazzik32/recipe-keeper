"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateCategoryName } from "@/lib/i18n";
import type { Category, RecipeWithRelations } from "@/types/database.types";

interface CategoryDetailContentProps {
  category: Category;
  recipes: RecipeWithRelations[];
}

export function CategoryDetailContent({ category, recipes }: CategoryDetailContentProps) {
  const { locale, t } = useLanguage();
  const translatedName = translateCategoryName(category.name, t);

  return (
    <div>
      {/* Back Link */}
      <Link
        href="/dashboard/categories"
        className="inline-flex items-center text-warm-gray-500 hover:text-warm-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t.categories.allCategories}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{category.icon}</span>
          <h1 className="font-display text-3xl text-warm-gray-700">
            {translatedName}
          </h1>
        </div>
        <p className="text-warm-gray-500">
          {recipes?.length || 0} {locale === "de" ? "Rezept" : "recipe"}{recipes?.length !== 1 ? (locale === "de" ? "e" : "s") : ""}{" "}
          {locale === "de" ? "in dieser Kategorie" : "in this category"}
        </p>
      </div>

      {/* Recipes */}
      {recipes && recipes.length > 0 ? (
        <RecipeGrid recipes={recipes} />
      ) : (
        <EmptyState
          title={locale === "de" ? `Noch keine ${translatedName} Rezepte` : `No ${translatedName} recipes yet`}
          description={locale === "de" ? "Fügen Sie Rezepte zu dieser Kategorie hinzu" : "Start adding recipes to this category"}
          actionLabel={t.nav.addRecipe}
          actionHref="/dashboard/recipes/new"
        />
      )}
    </div>
  );
}
