"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RecipeCard } from "./RecipeCard";
import { useRecipes } from "@/hooks/useRecipes";
import type { RecipeWithRelations } from "@/types/database.types";

interface RecipeGridProps {
  recipes: RecipeWithRelations[];
  renderAction?: (recipe: RecipeWithRelations) => React.ReactNode;
}

export function RecipeGrid({ recipes: initialRecipes, renderAction }: RecipeGridProps) {
  const router = useRouter();
  const { toggleFavorite } = useRecipes();
  const [recipes, setRecipes] = useState(initialRecipes);

  useEffect(() => {
    setRecipes(initialRecipes);
  }, [initialRecipes]);

  if (recipes.length === 0) {
    return null;
  }

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    // Optimistic update
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_favorite: isFavorite } : r))
    );

    const success = await toggleFavorite(id, isFavorite);
    if (!success) {
      // Revert on failure
      setRecipes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_favorite: !isFavorite } : r))
      );
    }
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onToggleFavorite={handleToggleFavorite}
          actions={renderAction?.(recipe)}
        />
      ))}
    </div>
  );
}
