"use client";

import { RecipeCard } from "./RecipeCard";
import type { RecipeWithRelations } from "@/types/database.types";

interface RecipeGridProps {
  recipes: RecipeWithRelations[];
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
}

export function RecipeGrid({ recipes, onToggleFavorite }: RecipeGridProps) {
  if (recipes.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
