"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import type { Category } from "@/types/database.types";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ScannedRecipeData {
  title: string;
  description?: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  totalTimeMinutes?: number;
  difficulty?: "easy" | "medium" | "hard";
  ingredients: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string;
  }>;
  steps: Array<{
    stepNumber: number;
    instruction: string;
  }>;
  suggestedCategory?: string;
  originalImageUrl?: string;
}

interface NewRecipeFormWrapperProps {
  categories: Category[];
}

export function NewRecipeFormWrapper({ categories }: NewRecipeFormWrapperProps) {
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const fromScan = searchParams.get("from") === "scan";
  const [scannedData, setScannedData] = useState<ScannedRecipeData | null>(null);
  const [isLoading, setIsLoading] = useState(fromScan);

  useEffect(() => {
    if (fromScan) {
      try {
        const stored = sessionStorage.getItem("scannedRecipe");
        if (stored) {
          const parsed = JSON.parse(stored) as ScannedRecipeData;
          setScannedData(parsed);
          sessionStorage.removeItem("scannedRecipe");
        }
      } catch (e) {
        console.error("Failed to parse scanned recipe data:", e);
      }
      setIsLoading(false);
    }
  }, [fromScan]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-warm-gray-400">
          {locale === "de" ? "Gescanntes Rezept wird geladen..." : "Loading scanned recipe..."}
        </div>
      </div>
    );
  }

  const findCategoryId = (suggestedCategory?: string): string | null => {
    if (!suggestedCategory) return null;
    const category = categories.find(
      (c) => c.slug === suggestedCategory || c.name.toLowerCase() === suggestedCategory.toLowerCase()
    );
    return category?.id || null;
  };

  const initialData = scannedData
    ? {
      title: scannedData.title,
      description: scannedData.description || null,
      servings: scannedData.servings || null,
      prep_time_minutes: scannedData.prepTimeMinutes || null,
      cook_time_minutes: scannedData.cookTimeMinutes || null,
      total_time_minutes: scannedData.totalTimeMinutes || null,
      difficulty: scannedData.difficulty || "medium",
      category_id: findCategoryId(scannedData.suggestedCategory),
      source: null,
      source_type: "family" as const,
      notes: null,
      original_image_url: scannedData.originalImageUrl || null,
      ingredients: scannedData.ingredients.map((ing) => ({
        name: ing.name,
        quantity: ing.quantity || null,
        unit: ing.unit || null,
        notes: ing.notes || null,
      })),
      steps: scannedData.steps.map((step) => ({
        instruction: step.instruction,
        image_url: null,
        timer_minutes: null,
      })),
    }
    : undefined;

  return (
    <>
      {scannedData && (
        <Card className="border-peach-200 bg-peach-50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-peach-700">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">
                {locale === "de"
                  ? "Rezept aus Scan importiert! Überprüfen und bearbeiten Sie die Details unten."
                  : "Recipe imported from scan! Review and edit the details below."}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
      <RecipeForm categories={categories} scannedData={initialData} />
    </>
  );
}
