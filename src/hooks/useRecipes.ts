"use client";

import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useRecipes() {
  const { toast } = useToast();
  const supabase = createClient();

  const toggleFavorite = async (recipeId: string, isFavorite: boolean) => {
    const { error } = await supabase
      .from("recipes")
      .update({ is_favorite: isFavorite })
      .eq("id", recipeId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: isFavorite ? "Added to favorites" : "Removed from favorites",
      description: isFavorite
        ? "Recipe has been added to your favorites"
        : "Recipe has been removed from your favorites",
    });
    return true;
  };

  const deleteRecipe = async (recipeId: string) => {
    const { error } = await supabase
      .from("recipes")
      .update({ is_archived: true })
      .eq("id", recipeId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete recipe",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Recipe deleted",
      description: "The recipe has been moved to trash",
    });
    return true;
  };

  const duplicateRecipe = async (recipeId: string) => {
    // Fetch the original recipe with all relations
    const { data: original, error: fetchError } = await supabase
      .from("recipes")
      .select(`
        *,
        ingredients:recipe_ingredients(*),
        steps:recipe_steps(*)
      `)
      .eq("id", recipeId)
      .single();

    if (fetchError || !original) {
      toast({
        title: "Error",
        description: "Failed to fetch recipe for duplication",
        variant: "destructive",
      });
      return null;
    }

    // Create the duplicate recipe
    const { data: newRecipe, error: createError } = await supabase
      .from("recipes")
      .insert({
        user_id: original.user_id,
        title: `${original.title} (Copy)`,
        description: original.description,
        servings: original.servings,
        prep_time_minutes: original.prep_time_minutes,
        cook_time_minutes: original.cook_time_minutes,
        difficulty: original.difficulty,
        category_id: original.category_id,
        source: original.source,
        source_type: original.source_type,
        notes: original.notes,
        is_favorite: false,
        is_archived: false,
      })
      .select()
      .single();

    if (createError || !newRecipe) {
      toast({
        title: "Error",
        description: "Failed to duplicate recipe",
        variant: "destructive",
      });
      return null;
    }

    // Duplicate ingredients
    if (original.ingredients && original.ingredients.length > 0) {
      const ingredients = original.ingredients.map((ing: { name: string; quantity: number | null; unit: string | null; notes: string | null; order_index: number }) => ({
        recipe_id: newRecipe.id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        notes: ing.notes,
        order_index: ing.order_index,
      }));
      await supabase.from("recipe_ingredients").insert(ingredients);
    }

    // Duplicate steps
    if (original.steps && original.steps.length > 0) {
      const steps = original.steps.map((step: { step_number: number; instruction: string; image_url: string | null; timer_minutes: number | null }) => ({
        recipe_id: newRecipe.id,
        step_number: step.step_number,
        instruction: step.instruction,
        image_url: step.image_url,
        timer_minutes: step.timer_minutes,
      }));
      await supabase.from("recipe_steps").insert(steps);
    }

    toast({
      title: "Recipe duplicated",
      description: "A copy of the recipe has been created",
    });

    return newRecipe.id;
  };

  return {
    toggleFavorite,
    deleteRecipe,
    duplicateRecipe,
  };
}
