import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication manually
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { recipeIds, options } = await req.json();

    if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
      throw new Error("No recipes selected");
    }

    // Fetch recipes with all related data
    const { data: recipes, error } = await supabase
      .from("recipes")
      .select(
        `
        *,
        category:categories(*),
        ingredients:recipe_ingredients(*),
        steps:recipe_steps(*),
        images:recipe_images(*)
      `
      )
      .in("id", recipeIds)
      .eq("user_id", user.id)
      .order("title");

    if (error) throw error;

    if (!recipes || recipes.length === 0) {
      throw new Error("No recipes found");
    }

    // Generate HTML for PDF
    const html = generateRecipeBookHTML(recipes, options);

    // For now, we'll return the HTML content
    // In a production setup, you would use a service like Puppeteer, wkhtmltopdf, or a PDF API
    // to convert the HTML to PDF

    // Option 1: Return HTML that can be printed as PDF by the browser
    // Option 2: Use an external PDF generation service
    // Option 3: Use Deno's PDF libraries (limited options)

    // For this implementation, we'll return the HTML and let the client handle PDF conversion
    // The client can use window.print() or a library like html2pdf.js

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          html: html,
          recipeCount: recipes.length,
          message:
            "HTML generated successfully. Use browser print function to save as PDF.",
        },
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
          code: "PDF_GENERATION_FAILED",
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

interface Recipe {
  id: string;
  title: string;
  description?: string;
  servings?: number;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  difficulty?: string;
  source?: string;
  notes?: string;
  category?: { name: string; icon: string };
  ingredients?: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string;
    order_index: number;
  }>;
  steps?: Array<{
    step_number: number;
    instruction: string;
    timer_minutes?: number;
    image_url?: string;
  }>;
  images?: Array<{
    image_url: string;
    is_primary: boolean;
    caption?: string;
  }>;
}

interface PdfOptions {
  title?: string;
  dedication?: string;
}

function generateRecipeBookHTML(
  recipes: Recipe[],
  options: PdfOptions
): string {
  const title = options?.title || "Family Recipes";
  const dedication = options?.dedication || "";

  const recipesHTML = recipes
    .map((recipe, index) => {
      const ingredients =
        recipe.ingredients
          ?.sort((a, b) => a.order_index - b.order_index)
          .map(
            (ing) => `
        <li>
          ${ing.quantity ? `<strong>${ing.quantity} ${ing.unit || ""}</strong>` : ""}
          ${ing.name}
          ${ing.notes ? `<span class="note">(${ing.notes})</span>` : ""}
        </li>
      `
          )
          .join("") || "";

      const steps =
        recipe.steps
          ?.sort((a, b) => a.step_number - b.step_number)
          .map(
            (step) => `
        <li>
          <div class="step-content">
            <span class="step-number">${step.step_number}</span>
            <div class="step-text">
              <p>${step.instruction}</p>
              ${step.timer_minutes ? `<span class="timer">⏱️ ${step.timer_minutes} min</span>` : ""}
            </div>
          </div>
          ${step.image_url ? `<img src="${step.image_url}" class="step-image" alt="Step ${step.step_number}">` : ""}
        </li>
      `
          )
          .join("") || "";

      const primaryImage = recipe.images?.find((img) => img.is_primary);
      const secondaryImages = recipe.images?.filter((img) => !img.is_primary) || [];

      return `
      <div class="recipe-page ${index > 0 ? "page-break" : ""}">
        ${primaryImage || secondaryImages.length > 0 ? `
          <div class="recipe-images">
            ${primaryImage ? `
              <div class="primary-image">
                <img src="${primaryImage.image_url}" alt="${recipe.title}">
              </div>
            ` : ""}
            ${secondaryImages.length > 0 ? `
              <div class="secondary-images">
                ${secondaryImages.map(img => `
                  <img src="${img.image_url}" alt="${recipe.title}" class="secondary-image">
                `).join("")}
              </div>
            ` : ""}
          </div>
        ` : ""}
        
        <div class="recipe-header">
          ${recipe.category ? `<span class="category">${recipe.category.icon} ${recipe.category.name}</span>` : ""}
          <h2>${recipe.title}</h2>
          ${recipe.source ? `<p class="source">From ${recipe.source}</p>` : ""}
        </div>

        ${recipe.description ? `<p class="description">${recipe.description}</p>` : ""}

        <div class="meta">
          ${recipe.prep_time_minutes ? `<span>🕐 Prep: ${recipe.prep_time_minutes} min</span>` : ""}
          ${recipe.cook_time_minutes ? `<span>🍳 Cook: ${recipe.cook_time_minutes} min</span>` : ""}
          ${recipe.servings ? `<span>👥 Serves: ${recipe.servings}</span>` : ""}
          ${recipe.difficulty ? `<span class="difficulty-${recipe.difficulty}">📊 ${recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}</span>` : ""}
        </div>

        <div class="content">
          <div class="ingredients">
            <h3>🥗 Ingredients</h3>
            <ul>${ingredients}</ul>
          </div>

          <div class="instructions">
            <h3>📝 Instructions</h3>
            <ol>${steps}</ol>
          </div>
        </div>

        ${recipe.notes ? `<div class="notes"><h3>💭 Notes & Memories</h3><p>${recipe.notes}</p></div>` : ""}
      </div>
    `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Inter:wght@400;500&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', sans-serif;
      color: #3D3532;
      background: #FFF8F0;
      line-height: 1.6;
    }

    .page-break {
      page-break-before: always;
    }

    /* Cover Page */
    .cover {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(135deg, #FFCBA4 0%, #FFE0D0 100%);
      padding: 40px;
    }

    .cover h1 {
      font-family: 'Playfair Display', serif;
      font-size: 48px;
      color: #3D3532;
      margin-bottom: 20px;
    }

    .cover .dedication {
      font-style: italic;
      color: #6B5B54;
      max-width: 400px;
      margin-top: 40px;
    }

    /* Recipe Pages */
    .recipe-page {
      padding: 40px;
      min-height: 100vh;
    }

    .recipe-images {
      margin-bottom: 24px;
    }

    .primary-image img {
      width: 100%;
      max-height: 350px;
      object-fit: cover;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .secondary-images {
      display: flex;
      gap: 12px;
      margin-top: 12px;
    }

    .secondary-image {
      flex: 1;
      max-height: 150px;
      object-fit: cover;
      border-radius: 12px;
    }

    .recipe-header {
      margin-bottom: 20px;
    }

    .recipe-header h2 {
      font-family: 'Playfair Display', serif;
      font-size: 32px;
      color: #3D3532;
      margin: 8px 0;
    }

    .category {
      display: inline-block;
      background: #FFEDE5;
      color: #CC7052;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
    }

    .source {
      color: #E5896B;
      font-weight: 500;
    }

    .description {
      color: #6B5B54;
      font-size: 16px;
      margin-bottom: 20px;
    }

    .meta {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      margin-bottom: 24px;
      padding: 16px;
      background: #FFEDE5;
      border-radius: 12px;
    }

    .meta span {
      color: #6B5B54;
      font-size: 14px;
    }

    .content {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 32px;
    }

    @media (max-width: 768px) {
      .content {
        grid-template-columns: 1fr;
      }
    }

    .ingredients {
      background: #FFFCFA;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #E8E2DC;
    }

    .ingredients h3, .instructions h3, .notes h3 {
      font-family: 'Playfair Display', serif;
      font-size: 20px;
      color: #3D3532;
      margin-bottom: 16px;
    }

    .ingredients ul {
      list-style: none;
    }

    .ingredients li {
      padding: 8px 0;
      border-bottom: 1px solid #E8E2DC;
    }

    .ingredients li:last-child {
      border-bottom: none;
    }

    .ingredients .note {
      color: #A99E94;
      font-size: 14px;
    }

    .instructions ol {
      list-style: none;
      counter-reset: step;
    }

    .instructions li {
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid #E8E2DC;
    }

    .instructions li:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .step-content {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .step-text {
      flex: 1;
    }

    .step-number {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #FFCBA4 0%, #FFB88A 100%);
      color: #3D3532;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      box-shadow: 0 2px 8px rgba(255, 203, 164, 0.4);
    }

    .step-image {
      width: 100%;
      max-width: 400px;
      max-height: 250px;
      object-fit: cover;
      border-radius: 12px;
      margin-top: 16px;
      margin-left: 52px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }

    .timer {
      display: inline-block;
      background: #FFF5F2;
      color: #E5896B;
      font-size: 13px;
      padding: 4px 10px;
      border-radius: 20px;
      margin-top: 8px;
    }

    .notes {
      margin-top: 24px;
      padding: 20px;
      background: #FFF5F2;
      border-radius: 12px;
      border-left: 4px solid #FFCBA4;
    }

    .notes p {
      font-style: italic;
      color: #6B5B54;
    }

    /* Table of Contents */
    .toc {
      padding: 40px;
      min-height: 100vh;
    }

    .toc h2 {
      font-family: 'Playfair Display', serif;
      font-size: 32px;
      color: #3D3532;
      margin-bottom: 32px;
      text-align: center;
    }

    .toc ul {
      list-style: none;
      max-width: 500px;
      margin: 0 auto;
    }

    .toc li {
      padding: 12px 0;
      border-bottom: 1px dotted #D4CCC4;
      display: flex;
      justify-content: space-between;
    }

    .toc li span:first-child {
      color: #3D3532;
    }

    .toc li span:last-child {
      color: #A99E94;
    }

    @media print {
      body {
        background: white;
      }
      .recipe-page {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover">
    <h1>${title}</h1>
    <p>A Collection of ${recipes.length} Family Recipes</p>
    ${dedication ? `<p class="dedication">"${dedication}"</p>` : ""}
  </div>

  <!-- Table of Contents -->
  <div class="toc page-break">
    <h2>Table of Contents</h2>
    <ul>
      ${recipes.map((r, i) => `<li><span>${r.title}</span><span>${i + 1}</span></li>`).join("")}
    </ul>
  </div>

  <!-- Recipes -->
  ${recipesHTML}
</body>
</html>
  `;
}
