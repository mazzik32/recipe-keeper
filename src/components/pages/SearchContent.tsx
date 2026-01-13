"use client";

import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchFilters } from "@/components/recipes/SearchFilters";
import { useLanguage } from "@/contexts/LanguageContext";
import type { RecipeWithRelations, Category } from "@/types/database.types";

interface SearchContentProps {
  recipes: RecipeWithRelations[] | null;
  categories: Category[];
  currentParams: {
    q?: string;
    category?: string;
    difficulty?: string;
    sort?: string;
  };
}

export function SearchContent({ recipes, categories, currentParams }: SearchContentProps) {
  const { t } = useLanguage();
  const { q: query, category, difficulty, sort } = currentParams;
  const hasFilters = query || category || difficulty || sort;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-warm-gray-700 mb-2">
          {query ? t.search.title : t.search.browseRecipes}
        </h1>
        {query ? (
          <p className="text-warm-gray-500">
            {t.search.resultsFor.replace("{count}", String(recipes?.length || 0)).replace("{query}", query)}
          </p>
        ) : (
          <p className="text-warm-gray-500">
            {t.search.filterSort}
          </p>
        )}
      </div>

      <SearchFilters
        categories={categories}
        currentParams={currentParams}
      />

      {recipes && recipes.length > 0 ? (
        <RecipeGrid recipes={recipes} />
      ) : hasFilters ? (
        <EmptyState
          icon="🔍"
          title={t.search.noResults}
          description={t.search.noResultsDesc}
        />
      ) : (
        <EmptyState
          icon="🔍"
          title={t.search.startSearching}
          description={t.search.startSearchingDesc}
        />
      )}
    </div>
  );
}
