"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RecipeActions } from "@/components/recipes/RecipeActions";
import {
  Clock,
  Users,
  ChefHat,
  Edit,
  ArrowLeft,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateCategoryName } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { RecipeWithRelations, RecipeImage, RecipeStep, RecipeIngredient, Tag } from "@/types/database.types";

interface RecipeDetailContentProps {
  recipe: RecipeWithRelations;
}

export function RecipeDetailContent({ recipe }: RecipeDetailContentProps) {
  const { locale, t } = useLanguage();

  const primaryImage = (recipe.images as RecipeImage[] | undefined)?.find((img: RecipeImage) => img.is_primary);
  const sortedSteps = (recipe.steps as RecipeStep[] | undefined)?.sort((a: RecipeStep, b: RecipeStep) => a.step_number - b.step_number) || [];
  const sortedIngredients = (recipe.ingredients as RecipeIngredient[] | undefined)?.sort((a: RecipeIngredient, b: RecipeIngredient) => a.order_index - b.order_index) || [];

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return t.recipes.easy;
      case "medium": return t.recipes.medium;
      case "hard": return t.recipes.hard;
      default: return difficulty;
    }
  };

  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("recipe_tags")
      .select("tags(*)")
      .eq("recipe_id", recipe.id)
      .then(({ data }) => {
        if (data) {
          // @ts-ignore - Supabase types are a bit tricky with joins
          setTags(data.map(item => item.tags).flat());
        }
      });
  }, [recipe.id]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        href="/dashboard"
        className="no-print inline-flex items-center text-warm-gray-500 hover:text-warm-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t.recipes.backToRecipes}
      </Link>

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {recipe.category && (
              <Badge variant="secondary" className="bg-peach-100 text-peach-700">
                {recipe.category.icon} {translateCategoryName(recipe.category.name, t)}
              </Badge>
            )}
            {tags.map(tag => (
              <Badge key={tag.id} variant="secondary" className="bg-peach-100 text-peach-700">
                {tag.name}
              </Badge>
            ))}
          </div>
          <h1 className="font-display text-4xl text-warm-gray-700 mb-2">
            {recipe.title}
          </h1>
          {recipe.source && (
            <p className="text-peach-600 font-medium">{t.recipes.from} {recipe.source}</p>
          )}
        </div>
        <div className="no-print flex items-center gap-2">
          <RecipeActions recipeId={recipe.id} isFavorite={recipe.is_favorite} />
          <Button asChild variant="outline" className="border-peach-300 text-peach-700 hover:bg-peach-50">
            <Link href={`/dashboard/recipes/${recipe.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              {t.common.edit}
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero Image */}
      {primaryImage && (
        <div className="aspect-video relative rounded-2xl overflow-hidden mb-8">
          <Image
            src={primaryImage.image_url}
            alt={recipe.title}
            fill
            className="object-contain"
          />
        </div>
      )}

      {/* Meta Info */}
      <div className="flex flex-wrap gap-6 mb-8">
        {recipe.prep_time_minutes && (
          <div className="flex items-center gap-2 text-warm-gray-600">
            <Clock className="w-5 h-5 text-peach-500" />
            <span>
              <strong>{t.recipes.activePrepTime}:</strong> {recipe.prep_time_minutes} {t.recipes.minutes}
            </span>
          </div>
        )}
        {recipe.cook_time_minutes && (
          <div className="flex items-center gap-2 text-warm-gray-600">
            <Clock className="w-5 h-5 text-peach-500" />
            <span>
              <strong>{t.recipes.cook}:</strong> {recipe.cook_time_minutes} {t.recipes.minutes}
            </span>
          </div>
        )}
        {recipe.total_time_minutes && (
          <div className="flex items-center gap-2 text-warm-gray-600">
            <Clock className="w-5 h-5 text-peach-500" />
            <span>
              <strong>{t.recipes.total}:</strong> {recipe.total_time_minutes} {t.recipes.minutes}
            </span>
          </div>
        )}
        {recipe.servings && (
          <div className="flex items-center gap-2 text-warm-gray-600">
            <Users className="w-5 h-5 text-peach-500" />
            <span>
              <strong>{t.recipes.serves}:</strong> {recipe.servings}
            </span>
          </div>
        )}
        {recipe.difficulty && (
          <div className="flex items-center gap-2 text-warm-gray-600">
            <ChefHat className="w-5 h-5 text-peach-500" />
            <span>
              <strong>{t.recipes.difficulty}:</strong> {getDifficultyLabel(recipe.difficulty)}
            </span>
          </div>
        )}
      </div>

      {/* Description */}
      {recipe.description && (
        <p className="text-warm-gray-600 text-lg mb-8">{recipe.description}</p>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Ingredients */}
        <Card className="page-break-avoid md:col-span-1 border-warm-gray-100 h-fit">
          <CardContent className="p-6">
            <h2 className="font-display text-xl text-warm-gray-700 mb-4">
              {t.recipes.ingredients}
            </h2>
            <ul className="space-y-3">
              {sortedIngredients.map((ingredient) => (
                <li
                  key={ingredient.id}
                  className="flex items-start gap-2 text-warm-gray-600"
                >
                  <span className="w-2 h-2 rounded-full bg-peach-300 mt-2 flex-shrink-0" />
                  <span>
                    {ingredient.quantity && (
                      <strong>
                        {ingredient.quantity} {ingredient.unit}{" "}
                      </strong>
                    )}
                    {ingredient.name}
                    {ingredient.notes && (
                      <span className="text-warm-gray-400">
                        {" "}
                        ({ingredient.notes})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="page-break-avoid md:col-span-2">
          <h2 className="font-display text-xl text-warm-gray-700 mb-4">
            {t.recipes.instructions}
          </h2>
          <ol className="space-y-6">
            {sortedSteps.map((step) => (
              <li key={step.id} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-peach-300 text-warm-gray-700 font-bold flex items-center justify-center">
                  {step.step_number}
                </div>
                <div className="flex-1">
                  <p className="text-warm-gray-600">{step.instruction}</p>
                  {step.timer_minutes && (
                    <p className="text-sm text-peach-600 mt-1">
                      ⏱️ {t.recipes.timer}: {step.timer_minutes} {locale === "de" ? "Minuten" : "minutes"}
                    </p>
                  )}
                  {step.image_url && (
                    <div className="mt-3 aspect-video relative rounded-lg overflow-hidden max-w-sm">
                      <Image
                        src={step.image_url}
                        alt={`${t.recipes.step} ${step.step_number}`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Notes */}
      {recipe.notes && (
        <Card className="mt-8 border-warm-gray-100 bg-peach-50">
          <CardContent className="p-6">
            <h2 className="font-display text-xl text-warm-gray-700 mb-2">
              {t.recipes.notes}
            </h2>
            <p className="text-warm-gray-600 italic">{recipe.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
