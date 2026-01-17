"use client";

import { useState, useMemo } from "react";
import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLanguage } from "@/contexts/LanguageContext";
import { TagFilter } from "@/components/dashboard/TagFilter";
import type { RecipeWithRelations, Tag } from "@/types/database.types";

interface DashboardContentProps {
  recipes: RecipeWithRelations[];
  allTags: Tag[];
}

export function DashboardContent({ recipes: initialRecipes, allTags }: DashboardContentProps) {
  const { locale, t } = useLanguage();
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  // Filter recipes based on selected tag
  const filteredRecipes = useMemo(() => {
    if (!selectedTagId) return initialRecipes;
    return initialRecipes.filter((recipe) =>
      recipe.tags?.some((tag) => tag.id === selectedTagId)
    );
  }, [initialRecipes, selectedTagId]);

  // Calculate tag counts based on ALL recipes (to show global availability)
  const tagsWithCounts = useMemo(() => {
    const counts = new Map<string, number>();

    initialRecipes.forEach((recipe) => {
      recipe.tags?.forEach((tag) => {
        counts.set(tag.id, (counts.get(tag.id) || 0) + 1);
      });
    });

    return allTags
      .map((tag) => ({
        ...tag,
        count: counts.get(tag.id) || 0,
      }))
      .filter((tag) => tag.count > 0) // Only show tags that are used
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [initialRecipes, allTags]);

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

      <TagFilter
        tags={tagsWithCounts}
        selectedTagId={selectedTagId}
        onSelectTag={setSelectedTagId}
      />

      {filteredRecipes && filteredRecipes.length > 0 ? (
        <RecipeGrid recipes={filteredRecipes} />
      ) : (
        <EmptyState
          icon="📖"
          title={selectedTagId ? t.search.noResults : t.recipes.noRecipes}
          description={selectedTagId ? t.search.noResultsDesc : t.recipes.noRecipesDesc}
          actionLabel={!selectedTagId ? t.nav.addRecipe : undefined}
          actionHref={!selectedTagId ? "/dashboard/recipes/new" : undefined}
        />
      )}
    </div>
  );
}
