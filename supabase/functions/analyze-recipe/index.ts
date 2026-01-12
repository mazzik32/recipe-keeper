import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

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

function extractOutputText(result: any): string | null {
  // Responses API returns an `output` array with message objects and `content` items.
  const message = result?.output?.find((o: any) => o?.type === "message" && o?.role === "assistant");
  const textItem = message?.content?.find((c: any) => c?.type === "output_text" && typeof c?.text === "string");
  return textItem?.text ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const { imageUrl, base64Image } = await req.json();

    if (!imageUrl && !base64Image) {
      throw new Error("Either imageUrl or base64Image is required");
    }

    // Responses API image item format: { type: "input_image", image_url: "...", detail: "high" }
    const imageItem = imageUrl
      ? { type: "input_image", image_url: imageUrl, detail: "high" }
      : { type: "input_image", image_url: base64Image, detail: "high" };

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

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        // "gpt-5.2-chat-latest" = GPT-5.2 snapshot used in ChatGPT
        model: "gpt-5.2-chat-latest",
        instructions: systemPrompt,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: "Please extract the recipe from this image and return it as JSON:" },
              imageItem,
            ],
          },
        ],
        // JSON mode in Responses API:
        text: { format: { type: "json_object" } },
        max_output_tokens: 4000,
      }),
    });

    if (!response.ok) {
      let msg = "OpenAI API error";
      try {
        const err = await response.json();
        msg = err?.error?.message || err?.message || msg;
      } catch {
        // ignore parse errors
      }
      throw new Error(msg);
    }

    const result = await response.json();
    const content = extractOutputText(result);

    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const extractedRecipe: RecipeExtractionResult = JSON.parse(content);

    return new Response(
      JSON.stringify({ success: true, data: extractedRecipe }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
