import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

interface RecipeExtractionResult {
  title: string;
  description?: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
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
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const { imageUrl, base64Image } = await req.json();

    if (!imageUrl && !base64Image) {
      throw new Error("Either imageUrl or base64Image is required");
    }

    const imageContent = imageUrl
      ? { type: "image_url", image_url: { url: imageUrl, detail: "high" } }
      : { type: "image_url", image_url: { url: base64Image, detail: "high" } };

    const systemPrompt = `You are a recipe extraction assistant. Your task is to analyze images of recipes (handwritten, printed, or from cookbooks) and extract the recipe information into a structured JSON format.

Extract the following information:
- title: The recipe name
- description: A brief description (if available)
- servings: Number of servings (if mentioned)
- prepTimeMinutes: Preparation time in minutes (if mentioned)
- cookTimeMinutes: Cooking time in minutes (if mentioned)
- difficulty: One of "easy", "medium", or "hard" based on complexity
- ingredients: Array of objects with name, quantity (as number), unit, and notes
- steps: Array of objects with stepNumber and instruction
- suggestedCategory: One of "appetizers", "main-course", "side-dishes", "desserts", "beverages", "breakfast", "snacks", "soups-salads"

Important guidelines:
- Convert all quantities to numbers (e.g., "1/2" becomes 0.5)
- Standardize units (e.g., "tablespoon" to "tbsp", "teaspoon" to "tsp")
- If text is handwritten and unclear, make reasonable interpretations
- Number steps sequentially starting from 1
- Return ONLY valid JSON, no additional text`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please extract the recipe from this image and return it as JSON:",
              },
              imageContent,
            ],
          },
        ],
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI API error");
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const extractedRecipe: RecipeExtractionResult = JSON.parse(content);

    return new Response(
      JSON.stringify({
        success: true,
        data: extractedRecipe,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "EXTRACTION_FAILED",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
