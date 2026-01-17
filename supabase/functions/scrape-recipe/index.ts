import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import * as cheerio from "npm:cheerio@1.0.0-rc.12";

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
};

function extractOutputText(result: any): string | null {
  const message = result?.output?.find((o: any) => o?.type === "message" && o?.role === "assistant");
  const textItem = message?.content?.find((c: any) => c?.type === "output_text" && typeof c?.text === "string");
  return textItem?.text ?? null;
}

// Clean HTML to reduce token count
function cleanHtml(html: string): string {
  const $ = cheerio.load(html);
  
  // Remove scripts, styles, iframes, comments, svg, noscript
  $("script").remove();
  $("style").remove();
  $("iframe").remove();
  $("noscript").remove();
  $("svg").remove();
  $("link").remove();
  $("meta").remove();
  
  // Get text content or simplified HTML structure
  // For better recipe extraction, keeping structure tags like li, h1-h6, p, div might be useful
  // but let's try to just get the body text with some structure or use a simplified approach
  // Let's try to extract readable text with structure preservation
  
  // Collapse whitespace
  return $("body").prop("innerText") || $("body").text();
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token", details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const { url, targetLanguage = "en" } = await req.json();

    if (!url) {
      throw new Error("URL is required");
    }

    // Validate target language
    const validLanguages: TargetLanguage[] = ["en", "de"];
    const lang: TargetLanguage = validLanguages.includes(targetLanguage) ? targetLanguage : "en";
    const targetLangName = lang === "de" ? "German" : "English";

    // Rate limiting or simple check? Let's check if the URL is reachable first.
    let html = "";
    try {
      const response = await fetch(url, {
        headers: {
            "User-Agent": "RecipeKeeper/1.0 (Contact: support@recipekeeper.com)"
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      }
      html = await response.text();
    } catch (err) {
      throw new Error(`Could not fetch the URL: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Clean HTML
    // We'll limit the character count passed to OpenAI to avoid token limits
    // Typically 100k chars is a safe upper bound for modern models context, but let's be conservative
    const cleanedText = cleanHtml(html).substring(0, 50000); 

    const unitStandardization = lang === "de" 
      ? `- Standardize units to metric: use "g" for grams, "kg" for kilograms, "ml" for milliliters, "L" for liters
- For common cooking units: use "EL" for tablespoon, "TL" for teaspoon, "Tasse" for cup
- Keep "Stück", "Prise", "Bund", "Zehe" for appropriate ingredients`
      : `- Standardize units: use "tbsp" for tablespoon, "tsp" for teaspoon, "cup" for cups
- For weight: prefer "oz" and "lb" for imperial, or "g" and "kg" for metric
- For volume: prefer "fl oz", "cup", "pint" or "ml", "L"`;

    const systemPrompt = `You are a recipe extraction and translation assistant. Your task is to extract recipe information from the provided text (scraped from a webpage) into a structured JSON format.

IMPORTANT: The output MUST be in ${targetLangName}. If the recipe is in a different language, translate ALL text content (title, description, ingredients, steps, notes) to ${targetLangName}.

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
- Number steps sequentially starting from 1
- ALWAYS translate to ${targetLangName} if the source is in another language
- Set wasTranslated to true if any translation was performed
- Return ONLY valid JSON, no additional text`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // Using gpt-4o as it is good for text analysis and currently available
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Extract the recipe from this webpage content:\n\n${cleanedText}`,
          },
        ],
        response_format: { type: "json_object" },
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
    const content = result.choices[0]?.message?.content;

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
