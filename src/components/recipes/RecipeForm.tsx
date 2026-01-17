"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/recipes/ImageUpload";
import { RecipeTagsInput } from "@/components/recipes/RecipeTagsInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { recipeSchema, type RecipeFormData } from "@/lib/validations/recipe";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Category, RecipeWithRelations } from "@/types/database.types";

interface ScannedData {
  title: string;
  description?: string | null;
  servings?: number | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  total_time_minutes?: number | null;
  difficulty?: "easy" | "medium" | "hard";
  category_id?: string | null;
  source?: string | null;
  source_type?: "family" | "cookbook" | "website" | "other";
  notes?: string | null;
  original_image_url?: string | null;
  ingredients: Array<{
    name: string;
    quantity?: number | null;
    unit?: string | null;
    notes?: string | null;
  }>;
  steps: Array<{
    instruction: string;
    image_url?: string | null;
    timer_minutes?: number | null;
  }>;
}

interface RecipeFormProps {
  categories: Category[];
  recipe?: RecipeWithRelations;
  scannedData?: ScannedData;
}

export function RecipeForm({ categories, recipe, scannedData }: RecipeFormProps) {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [primaryImage, setPrimaryImage] = useState<string | null>(
    recipe?.images?.find((img) => img.is_primary)?.image_url || null
  );
  const [secondaryImage, setSecondaryImage] = useState<string | null>(
    recipe?.images?.find((img) => !img.is_primary)?.image_url || null
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const supabase = createClient();

  // Load initial tags for existing recipe
  useState(() => {
    if (recipe) {
      // We need to fetch tags for this recipe because they might not be in the recipe object if not joined
      supabase
        .from("recipe_tags")
        .select("tag_id")
        .eq("recipe_id", recipe.id)
        .then(({ data }) => {
          if (data) setSelectedTags(data.map(rt => rt.tag_id));
        });
    }
  });

  const defaultValues: RecipeFormData = recipe
    ? {
      title: recipe.title,
      description: recipe.description,
      servings: recipe.servings,
      prep_time_minutes: recipe.prep_time_minutes,
      cook_time_minutes: recipe.cook_time_minutes,
      total_time_minutes: recipe.total_time_minutes,
      difficulty: recipe.difficulty,
      category_id: recipe.category_id,
      source: recipe.source,
      source_type: recipe.source_type,
      notes: recipe.notes,
      ingredients:
        recipe.ingredients?.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          notes: i.notes,
        })) || [],
      steps:
        recipe.steps?.map((s) => ({
          id: s.id,
          instruction: s.instruction,
          image_url: s.image_url,
          timer_minutes: s.timer_minutes,
        })) || [],
    }
    : scannedData
      ? {
        title: scannedData.title,
        description: scannedData.description || "",
        servings: scannedData.servings || null,
        prep_time_minutes: scannedData.prep_time_minutes || null,
        cook_time_minutes: scannedData.cook_time_minutes || null,
        total_time_minutes: scannedData.total_time_minutes || null,
        difficulty: scannedData.difficulty || "medium",
        category_id: scannedData.category_id || null,
        source: scannedData.source || "",
        source_type: scannedData.source_type || "family",
        notes: scannedData.notes || "",
        ingredients: scannedData.ingredients.map((i) => ({
          name: i.name,
          quantity: i.quantity || null,
          unit: i.unit || "",
          notes: i.notes || "",
        })),
        steps: scannedData.steps.map((s) => ({
          instruction: s.instruction,
          image_url: s.image_url || null,
          timer_minutes: s.timer_minutes || null,
        })),
      }
      : {
        title: "",
        description: "",
        servings: null,
        prep_time_minutes: null,
        cook_time_minutes: null,
        total_time_minutes: null,
        difficulty: "medium",
        category_id: null,
        source: "",
        source_type: "family",
        notes: "",
        ingredients: [{ name: "", quantity: null, unit: "", notes: "" }],
        steps: [{ instruction: "", image_url: null, timer_minutes: null }],
      };

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecipeFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(recipeSchema) as any,
    defaultValues,
  });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({
    control,
    name: "ingredients",
  });

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({
    control,
    name: "steps",
  });

  async function onSubmit(data: RecipeFormData) {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError(t.auth.sessionExpired);
      setIsLoading(false);
      return;
    }

    try {
      if (recipe) {
        const { error: recipeError } = await supabase
          .from("recipes")
          .update({
            title: data.title,
            description: data.description,
            servings: data.servings,
            prep_time_minutes: data.prep_time_minutes,
            cook_time_minutes: data.cook_time_minutes,
            total_time_minutes: data.total_time_minutes,
            difficulty: data.difficulty,
            category_id: data.category_id,
            source: data.source,
            source_type: data.source_type,
            notes: data.notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", recipe.id);

        if (recipeError) throw recipeError;

        await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipe.id);
        await supabase.from("recipe_steps").delete().eq("recipe_id", recipe.id);

        const { error: ingredientsError } = await supabase
          .from("recipe_ingredients")
          .insert(
            data.ingredients.map((ing, index) => ({
              recipe_id: recipe.id,
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              notes: ing.notes,
              order_index: index,
            }))
          );

        if (ingredientsError) throw ingredientsError;

        const { error: stepsError } = await supabase.from("recipe_steps").insert(
          data.steps.map((step, index) => ({
            recipe_id: recipe.id,
            step_number: index + 1,
            instruction: step.instruction,
            image_url: step.image_url,
            timer_minutes: step.timer_minutes,
          }))
        );

        if (stepsError) throw stepsError;

        await supabase.from("recipe_images").delete().eq("recipe_id", recipe.id);
        const imagesToInsert = [];
        if (primaryImage) {
          imagesToInsert.push({
            recipe_id: recipe.id,
            image_url: primaryImage,
            is_primary: true,
          });
        }
        if (secondaryImage) {
          imagesToInsert.push({
            recipe_id: recipe.id,
            image_url: secondaryImage,
            is_primary: false,
          });
        }
        if (imagesToInsert.length > 0) {
          await supabase.from("recipe_images").insert(imagesToInsert);
        }

        // Handle Tags
        await supabase.from("recipe_tags").delete().eq("recipe_id", recipe.id);
        if (selectedTags.length > 0) {
          const { error: tagsError } = await supabase.from("recipe_tags").insert(
            selectedTags.map(tagId => ({
              recipe_id: recipe.id,
              tag_id: tagId
            }))
          );
          if (tagsError) throw tagsError;
        }

        router.push(`/dashboard/recipes/${recipe.id}`);
      } else {
        const { data: newRecipe, error: recipeError } = await supabase
          .from("recipes")
          .insert({
            user_id: user.id,
            title: data.title,
            description: data.description,
            servings: data.servings,
            prep_time_minutes: data.prep_time_minutes,
            cook_time_minutes: data.cook_time_minutes,
            total_time_minutes: data.total_time_minutes,
            difficulty: data.difficulty,
            category_id: data.category_id,
            source: data.source,
            source_type: data.source_type,
            notes: data.notes,
          })
          .select()
          .single();

        if (recipeError) throw recipeError;

        const { error: ingredientsError } = await supabase
          .from("recipe_ingredients")
          .insert(
            data.ingredients.map((ing, index) => ({
              recipe_id: newRecipe.id,
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              notes: ing.notes,
              order_index: index,
            }))
          );

        if (ingredientsError) throw ingredientsError;

        const { error: stepsError } = await supabase.from("recipe_steps").insert(
          data.steps.map((step, index) => ({
            recipe_id: newRecipe.id,
            step_number: index + 1,
            instruction: step.instruction,
            image_url: step.image_url,
            timer_minutes: step.timer_minutes,
          }))
        );

        if (stepsError) throw stepsError;

        const imagesToInsert = [];
        if (primaryImage) {
          imagesToInsert.push({
            recipe_id: newRecipe.id,
            image_url: primaryImage,
            is_primary: true,
          });
        }
        if (secondaryImage) {
          imagesToInsert.push({
            recipe_id: newRecipe.id,
            image_url: secondaryImage,
            is_primary: false,
          });
        }
        if (imagesToInsert.length > 0) {
          await supabase.from("recipe_images").insert(imagesToInsert);
        }

        // Handle Tags
        if (selectedTags.length > 0) {
          const { error: tagsError } = await supabase.from("recipe_tags").insert(
            selectedTags.map(tagId => ({
              recipe_id: newRecipe.id,
              tag_id: tagId
            }))
          );
          if (tagsError) throw tagsError;
        }

        router.push(`/dashboard/recipes/${newRecipe.id}`);
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.saveFailed);
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card className="border-warm-gray-100">
        <CardHeader>
          <CardTitle className="font-display text-xl text-warm-gray-700">
            {locale === "de" ? "Grundinformationen" : "Basic Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t.recipes.recipeTitle} *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder={t.recipes.titlePlaceholder}
              className="border-warm-gray-200"
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t.recipes.description}</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder={t.recipes.descriptionPlaceholder}
              className="border-warm-gray-200 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="servings">{t.recipes.servings}</Label>
              <Input
                id="servings"
                type="number"
                {...register("servings")}
                placeholder="4"
                className="border-warm-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prep_time_minutes">{t.recipes.activePrepTime} ({t.recipes.minutes})</Label>
              <Input
                id="prep_time_minutes"
                type="number"
                {...register("prep_time_minutes")}
                placeholder="15"
                className="border-warm-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cook_time_minutes">{t.recipes.cookTime} ({t.recipes.minutes})</Label>
              <Input
                id="cook_time_minutes"
                type="number"
                {...register("cook_time_minutes")}
                placeholder="30"
                className="border-warm-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_time_minutes">{t.recipes.totalTime} ({t.recipes.minutes})</Label>
              <Input
                id="total_time_minutes"
                type="number"
                {...register("total_time_minutes")}
                placeholder="45"
                className="border-warm-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">{t.recipes.difficulty}</Label>
              <Select
                value={watch("difficulty")}
                onValueChange={(value) =>
                  setValue("difficulty", value as "easy" | "medium" | "hard")
                }
              >
                <SelectTrigger className="border-warm-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">{t.recipes.easy}</SelectItem>
                  <SelectItem value="medium">{t.recipes.medium}</SelectItem>
                  <SelectItem value="hard">{t.recipes.hard}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category_id">{t.recipes.category}</Label>
              <Select
                value={watch("category_id") || ""}
                onValueChange={(value) =>
                  setValue("category_id", value || null)
                }
              >
                <SelectTrigger className="border-warm-gray-200">
                  <SelectValue placeholder={locale === "de" ? "Kategorie auswählen" : "Select a category"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">{t.recipes.source} ({t.recipes.sourceHelper})</Label>
              <Input
                id="source"
                {...register("source")}
                placeholder={t.recipes.sourcePlaceholder}
                className="border-warm-gray-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t.nav.tags}</Label>
            <RecipeTagsInput value={selectedTags} onChange={setSelectedTags} />
          </div>
        </CardContent>
      </Card>

      {/* Ingredients */}
      <Card className="border-warm-gray-100">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-xl text-warm-gray-700">
            {t.recipes.ingredients}
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendIngredient({ name: "", quantity: null, unit: "", notes: "" })
            }
            className="border-peach-300 text-peach-700 hover:bg-peach-50"
          >
            <Plus className="w-4 h-4 mr-1" />
            {t.common.add}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {ingredientFields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <GripVertical className="w-5 h-5 text-warm-gray-300 mt-2.5 cursor-grab" />
              <div className="flex-1 grid grid-cols-12 gap-2">
                <Input
                  {...register(`ingredients.${index}.quantity`)}
                  placeholder={t.recipes.quantity}
                  type="number"
                  step="0.01"
                  className="col-span-2 border-warm-gray-200"
                />
                <Input
                  {...register(`ingredients.${index}.unit`)}
                  placeholder={t.recipes.unit}
                  className="col-span-2 border-warm-gray-200"
                />
                <Input
                  {...register(`ingredients.${index}.name`)}
                  placeholder={t.recipes.ingredientName + " *"}
                  className="col-span-5 border-warm-gray-200"
                />
                <Input
                  {...register(`ingredients.${index}.notes`)}
                  placeholder={t.recipes.ingredientNotes}
                  className="col-span-3 border-warm-gray-200"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeIngredient(index)}
                disabled={ingredientFields.length === 1}
                className="text-warm-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {errors.ingredients && (
            <p className="text-sm text-red-500">
              {errors.ingredients.message || (locale === "de" ? "Bitte Zutatenfehler beheben" : "Please fix ingredient errors")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Steps */}
      <Card className="border-warm-gray-100">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-xl text-warm-gray-700">
            {t.recipes.instructions}
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendStep({ instruction: "", image_url: null, timer_minutes: null })
            }
            className="border-peach-300 text-peach-700 hover:bg-peach-50"
          >
            <Plus className="w-4 h-4 mr-1" />
            {t.recipes.addStep}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {stepFields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-peach-200 text-warm-gray-700 font-bold flex items-center justify-center mt-1">
                {index + 1}
              </div>
              <div className="flex-1 space-y-3">
                <Textarea
                  {...register(`steps.${index}.instruction`)}
                  placeholder={t.recipes.stepPlaceholder}
                  className="border-warm-gray-200 min-h-[80px]"
                />
                <div className="flex gap-4 items-start">
                  <div className="space-y-1">
                    <Label className="text-xs text-warm-gray-500">{t.recipes.timer}</Label>
                    <Input
                      {...register(`steps.${index}.timer_minutes`)}
                      placeholder={t.recipes.minutes}
                      type="number"
                      className="w-24 border-warm-gray-200"
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs text-warm-gray-500">{t.recipes.stepPhoto} ({t.common.optional})</Label>
                    <ImageUpload
                      value={watch(`steps.${index}.image_url`)}
                      onChange={(url) => setValue(`steps.${index}.image_url`, url)}
                      bucket="step-images"
                      folder={`step-${index}`}
                      aspectRatio="video"
                      className="max-w-xs"
                    />
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeStep(index)}
                disabled={stepFields.length === 1}
                className="text-warm-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {errors.steps && (
            <p className="text-sm text-red-500">
              {errors.steps.message || (locale === "de" ? "Bitte Schrittfehler beheben" : "Please fix step errors")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="border-warm-gray-100">
        <CardHeader>
          <CardTitle className="font-display text-xl text-warm-gray-700">
            {t.recipes.notes}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register("notes")}
            placeholder={t.recipes.notesPlaceholder}
            className="border-warm-gray-200 min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Photos */}
      <Card className="border-warm-gray-100">
        <CardHeader>
          <CardTitle className="font-display text-xl text-warm-gray-700">
            {t.recipes.recipePhotos}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-warm-gray-500 mb-4">
            {t.recipes.photosDescription}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.recipes.primaryPhoto}</Label>
              <ImageUpload
                value={primaryImage}
                onChange={setPrimaryImage}
                bucket="recipe-images"
                folder="primary"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.recipes.additionalPhoto} ({t.common.optional})</Label>
              <ImageUpload
                value={secondaryImage}
                onChange={setSecondaryImage}
                bucket="recipe-images"
                folder="secondary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="border-warm-gray-300"
        >
          {t.common.cancel}
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-peach-300 hover:bg-peach-400 text-warm-gray-700"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {recipe ? t.recipes.updateRecipe : t.recipes.saveRecipe}
        </Button>
      </div>
    </form>
  );
}
