"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Category } from "@/types/database.types";

interface SearchFiltersProps {
  categories: Category[];
  currentParams: {
    q?: string;
    category?: string;
    difficulty?: string;
    sort?: string;
  };
}

export function SearchFilters({ categories, currentParams }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/search?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push("/dashboard/search");
  };

  const activeFiltersCount = [
    currentParams.category,
    currentParams.difficulty,
    currentParams.sort,
  ].filter(Boolean).length;

  const getCategoryName = (id: string) => {
    return categories.find((c) => c.id === id)?.name || id;
  };

  const getDifficultyLabel = (diff: string) => {
    switch (diff) {
      case "easy": return t.recipes.easy;
      case "medium": return t.recipes.medium;
      case "hard": return t.recipes.hard;
      default: return diff;
    }
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Filter dropdowns */}
      <div className="flex flex-wrap gap-3">
        {/* Category filter */}
        <Select
          value={currentParams.category || "all"}
          onValueChange={(value) =>
            updateFilter("category", value === "all" ? null : value)
          }
        >
          <SelectTrigger className="w-[160px] border-warm-gray-200">
            <SelectValue placeholder={t.nav.categories} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.search.allCategories}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Difficulty filter */}
        <Select
          value={currentParams.difficulty || "all"}
          onValueChange={(value) =>
            updateFilter("difficulty", value === "all" ? null : value)
          }
        >
          <SelectTrigger className="w-[140px] border-warm-gray-200">
            <SelectValue placeholder={t.recipes.difficulty} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.search.allLevels}</SelectItem>
            <SelectItem value="easy">{t.recipes.easy}</SelectItem>
            <SelectItem value="medium">{t.recipes.medium}</SelectItem>
            <SelectItem value="hard">{t.recipes.hard}</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort options */}
        <Select
          value={currentParams.sort || "newest"} // default is newest
          onValueChange={(value) => updateFilter("sort", value === "newest" ? null : value)}
        >
          <SelectTrigger className="w-[160px] border-warm-gray-200">
            <SelectValue placeholder={t.search.sortBy} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t.search.newestFirst}</SelectItem>
            <SelectItem value="oldest">{t.search.oldestFirst}</SelectItem>
            <SelectItem value="title">{t.search.alphabetical}</SelectItem>
            <SelectItem value="prep_time">{t.search.byPrepTime}</SelectItem>
            <SelectItem value="cook_time">{t.search.byCookTime}</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear all button */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            onClick={clearAllFilters}
            className="text-warm-gray-500 hover:text-warm-gray-700"
          >
            {t.search.clearAll}
          </Button>
        )}
      </div>

      {/* Active filters badges */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {currentParams.category && (
            <Badge
              variant="secondary"
              className="bg-peach-100 text-peach-700 gap-1"
            >
              {getCategoryName(currentParams.category)}
              <button
                onClick={() => updateFilter("category", null)}
                className="hover:bg-peach-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {currentParams.difficulty && (
            <Badge
              variant="secondary"
              className="bg-peach-100 text-peach-700 gap-1"
            >
              {getDifficultyLabel(currentParams.difficulty)}
              <button
                onClick={() => updateFilter("difficulty", null)}
                className="hover:bg-peach-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
