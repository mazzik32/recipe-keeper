"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Category, RecipeWithRelations } from "@/types/database.types";

interface EditRecipeContentProps {
  recipe: RecipeWithRelations;
  categories: Category[];
}

export function EditRecipeContent({ recipe, categories }: EditRecipeContentProps) {
  const { locale, t } = useLanguage();

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/dashboard/recipes/${recipe.id}`}
        className="inline-flex items-center text-warm-gray-500 hover:text-warm-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {locale === "de" ? "Zurück zum Rezept" : "Back to recipe"}
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-gray-700 mb-2">
          {t.recipes.editRecipe}
        </h1>
        <p className="text-warm-gray-500">
          {locale === "de" ? "Aktualisieren Sie Ihre Rezeptdetails." : "Update your recipe details."}
        </p>
      </div>

      <RecipeForm categories={categories} recipe={recipe} />
    </div>
  );
}
