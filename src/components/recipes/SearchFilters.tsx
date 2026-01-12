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

  return (
    <div className="mb-6 space-y-4">
      {/* Filter dropdowns */}
      <div className="flex flex-wrap gap-3">
        {/* Category filter */}
        <Select
          value={currentParams.category || ""}
          onValueChange={(value) =>
            updateFilter("category", value || null)
          }
        >
          <SelectTrigger className="w-[160px] border-warm-gray-200">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Difficulty filter */}
        <Select
          value={currentParams.difficulty || ""}
          onValueChange={(value) =>
            updateFilter("difficulty", value || null)
          }
        >
          <SelectTrigger className="w-[140px] border-warm-gray-200">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Levels</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort options */}
        <Select
          value={currentParams.sort || ""}
          onValueChange={(value) => updateFilter("sort", value || null)}
        >
          <SelectTrigger className="w-[160px] border-warm-gray-200">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="title">Alphabetical</SelectItem>
            <SelectItem value="prep_time">Prep Time</SelectItem>
            <SelectItem value="cook_time">Cook Time</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear all button */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            onClick={clearAllFilters}
            className="text-warm-gray-500 hover:text-warm-gray-700"
          >
            Clear all
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
              className="bg-peach-100 text-peach-700 gap-1 capitalize"
            >
              {currentParams.difficulty}
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
