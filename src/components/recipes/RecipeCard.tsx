"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, Users, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateCategoryName } from "@/lib/i18n";
import type { RecipeWithRelations } from "@/types/database.types";

interface RecipeCardProps {
  recipe: RecipeWithRelations;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  actions?: React.ReactNode;
}

export function RecipeCard({ recipe, onToggleFavorite, actions }: RecipeCardProps) {
  const { locale, t } = useLanguage();
  const totalTime =
    (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
  const primaryImage = recipe.images?.find((img) => img.is_primary);

  return (
    <Link href={`/dashboard/recipes/${recipe.id}`} className="block overflow-hidden">
      <Card className="group overflow-hidden border-warm-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-1 active:scale-[0.98]">
        {/* Image */}
        <div className="aspect-[4/3] bg-peach-100 relative overflow-hidden">
          {primaryImage ? (
            <Image
              src={primaryImage.image_url}
              alt={recipe.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">🍽️</span>
            </div>
          )}

          {/* Custom Actions Menu - Pushed to top right, favorite moves to left */}
          {actions && (
            <div className="absolute top-3 right-3 z-10" onClick={(e) => e.preventDefault()}>
              {actions}
            </div>
          )}

          {/* Favorite Button - If actions exist, move closer or to the left?
              Let's put Favorite on the left if actions exist, or just left of actions?
              Actually, let's put Favorite top-left if Actions are top-right.
          */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite(recipe.id, !recipe.is_favorite);
              }}
              className={cn(
                "absolute w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition-colors touch-target active:scale-95",
                actions ? "top-3 left-3" : "top-3 right-3"
              )}
            >
              <Heart
                className={cn(
                  "w-5 h-5 transition-colors",
                  recipe.is_favorite
                    ? "fill-coral-400 text-coral-400"
                    : "text-warm-gray-400"
                )}
              />
            </button>
          )}


          {/* Category Badge */}
          {recipe.category && (
            <Badge
              variant="secondary"
              className="absolute bottom-3 left-3 bg-white/90 backdrop-blur text-warm-gray-700"
            >
              {recipe.category.icon} {translateCategoryName(recipe.category.name, t)}
            </Badge>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-4 md:p-5 min-w-0">
          <h3 className="font-display text-lg md:text-xl text-warm-gray-700 mb-2 line-clamp-1 group-hover:text-peach-600 transition-colors">
            {recipe.title}
          </h3>

          {recipe.description && (
            <p className="text-warm-gray-400 text-sm mb-3 line-clamp-2">
              {recipe.description}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-warm-gray-400 text-sm">
            {totalTime > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {totalTime} min
              </span>
            )}
            {recipe.servings && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {recipe.servings}
              </span>
            )}
          </div>

          {/* Source */}
          {recipe.source && (
            <p className="mt-3 text-xs text-peach-600 font-medium">
              {locale === "de" ? "Von" : "From"} {recipe.source}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
