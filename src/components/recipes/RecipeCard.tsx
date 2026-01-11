"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, Users, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RecipeWithRelations } from "@/types/database.types";

interface RecipeCardProps {
  recipe: RecipeWithRelations;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
}

export function RecipeCard({ recipe, onToggleFavorite }: RecipeCardProps) {
  const totalTime =
    (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
  const primaryImage = recipe.images?.find((img) => img.is_primary);

  return (
    <Link href={`/dashboard/recipes/${recipe.id}`}>
      <Card className="group overflow-hidden border-warm-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
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

          {/* Favorite Button */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite(recipe.id, !recipe.is_favorite);
              }}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition-colors"
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
              {recipe.category.icon} {recipe.category.name}
            </Badge>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-5">
          <h3 className="font-display text-xl text-warm-gray-700 mb-2 line-clamp-1 group-hover:text-peach-600 transition-colors">
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
              From {recipe.source}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
