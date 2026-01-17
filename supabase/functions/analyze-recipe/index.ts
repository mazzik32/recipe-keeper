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
  detectedLanguage?: string;
  wasTranslated?: boolean;
}

type TargetLanguage = "en" | "de";

const languageNames: Record<string, string> = {
  en: "English",
  de: "German",
  fr: "French",
  it: "Italian",
  es: "Spanish",
  pt: "Portuguese",
  nl: "Dutch",
  pl: "Polish",
  ru: "Russian",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  ar: "Arabic",
  tr: "Turkish",
  vi: "Vietnamese",
  th: "Thai",
  el: "Greek",
  cs: "Czech",
  hu: "Hungarian",
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian",
  fi: "Finnish",
};

function extractOutputText(result: any): string | null {
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
        JSON.stringify({ 
          success: false,
          error: { message: "Missing or invalid authorization header" } 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token", details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const body = await req.json();
    
    // Support both single imageUrl and multiple imageUrls
    const { imageUrl, imageUrls, base64Image, targetLanguage = "en" } = body;
    
    // Validate target language
    const validLanguages: TargetLanguage[] = ["en", "de"];
    const lang: TargetLanguage = validLanguages.includes(targetLanguage) ? targetLanguage : "en";
    
    // Build array of image URLs
    let urls: string[] = [];
    if (imageUrls && Array.isArray(imageUrls)) {
      urls = imageUrls;
    } else if (imageUrl) {
      urls = [imageUrl];
    } else if (base64Image) {
      urls = [base64Image];
    }

    if (urls.length === 0) {
      throw new Error("At least one image is required (imageUrl, imageUrls, or base64Image)");
    }

    // Limit to 5 images
    if (urls.length > 5) {
      urls = urls.slice(0, 5);
    }

    // Build image items for the API
    const imageItems = urls.map((url) => ({
      type: "input_image",
      image_url: url,
      detail: "high",
    }));

    const targetLangName = lang === "de" ? "German" : "English";
    
    // Unit standardization based on target language
    const unitStandardization = lang === "de" 
      ? `- Standardize units to metric: use "g" for grams, "kg" for kilograms, "ml" for milliliters, "L" for liters
- For common cooking units: use "EL" for tablespoon, "TL" for teaspoon, "Tasse" for cup
- Keep "Stück", "Prise", "Bund", "Zehe" for appropriate ingredients`
      : `- Standardize units: use "tbsp" for tablespoon, "tsp" for teaspoon, "cup" for cups
- For weight: prefer "oz" and "lb" for imperial, or "g" and "kg" for metric
- For volume: prefer "fl oz", "cup", "pint" or "ml", "L"`;

    const systemPrompt = `You are a recipe extraction and translation assistant. Your task is to analyze images of recipes (handwritten, printed, or from cookbooks) and extract the recipe information into a structured JSON format.

IMPORTANT: The output MUST be in ${targetLangName}. If the recipe is in a different language, translate ALL text content (title, description, ingredients, steps, notes) to ${targetLangName}.

${urls.length > 1 ? `You are receiving ${urls.length} images that together form a complete recipe. The recipe may span multiple pages or images. Combine all the information from all images into a single, complete recipe.` : ""}

Extract the following information:
- title: The recipe name (translated to ${targetLangName})
- description: A brief description (translated to ${targetLangName}, if available)
- servings: Number of servings (if mentioned)
- prepTimeMinutes: Active preparation time in minutes (doing something actively)
- cookTimeMinutes: Cooking time in minutes (if mentioned)
- totalTimeMinutes: Total time in minutes (including resting, rising, baking, etc.)
- difficulty: One of "easy", "medium", or "hard" based on complexity
- ingredients: Array of objects with name (translated), quantity (as number), unit (standardized), and notes (translated)
- steps: Array of objects with stepNumber and instruction (translated to ${targetLangName})
- suggestedCategory: One of "appetizers", "main-course", "side-dishes", "desserts", "beverages", "breakfast", "snacks", "soups-salads"
- detectedLanguage: The ISO 639-1 language code of the original recipe (e.g., "en", "de", "it", "fr", "es")
- wasTranslated: Boolean indicating if translation was performed

Unit standardization for ${targetLangName}:
${unitStandardization}

Important guidelines:
- Convert all quantities to numbers (e.g., "1/2" becomes 0.5, "1 1/2" becomes 1.5)
- If text is handwritten and unclear, make reasonable interpretations
- Number steps sequentially starting from 1
- If information spans multiple images, merge them intelligently (don't duplicate ingredients or steps)
- ALWAYS translate to ${targetLangName} if the source is in another language
- Set wasTranslated to true if any translation was performed
- Return ONLY valid JSON, no additional text`;

    // Build content array with text prompt followed by all images
    const contentItems: any[] = [
      { 
        type: "input_text", 
        text: urls.length > 1 
          ? `Please extract the recipe from these ${urls.length} images, translate everything to ${targetLangName} if needed, and return it as JSON:`
          : `Please extract the recipe from this image, translate everything to ${targetLangName} if needed, and return it as JSON:`
      },
      ...imageItems,
    ];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5.2-chat-latest",
        instructions: systemPrompt,
        input: [
          {
            role: "user",
            content: contentItems,
          },
        ],
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
    
    // Add human-readable source language name
    const detectedLangName = extractedRecipe.detectedLanguage 
      ? languageNames[extractedRecipe.detectedLanguage] || extractedRecipe.detectedLanguage
      : null;

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedRecipe,
        imagesProcessed: urls.length,
        targetLanguage: lang,
        detectedLanguage: extractedRecipe.detectedLanguage,
        detectedLanguageName: detectedLangName,
        wasTranslated: extractedRecipe.wasTranslated || false,
      }),
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
