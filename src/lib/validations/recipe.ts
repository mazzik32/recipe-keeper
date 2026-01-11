import { z } from "zod";

const optionalNumber = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
  z.number().positive().nullable()
);

export const ingredientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Ingredient name is required"),
  quantity: optionalNumber,
  unit: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const stepSchema = z.object({
  id: z.string().optional(),
  instruction: z.string().min(1, "Instruction is required"),
  image_url: z.string().optional().nullable(),
  timer_minutes: optionalNumber,
});

export const recipeSchema = z.object({
  title: z.string().min(1, "Recipe title is required"),
  description: z.string().optional().nullable(),
  servings: optionalNumber,
  prep_time_minutes: optionalNumber,
  cook_time_minutes: optionalNumber,
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  category_id: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  source_type: z.enum(["family", "cookbook", "website", "other"]).default("family"),
  notes: z.string().optional().nullable(),
  ingredients: z.array(ingredientSchema).min(1, "At least one ingredient is required"),
  steps: z.array(stepSchema).min(1, "At least one step is required"),
});

export type RecipeFormData = z.infer<typeof recipeSchema>;
export type IngredientFormData = z.infer<typeof ingredientSchema>;
export type StepFormData = z.infer<typeof stepSchema>;
