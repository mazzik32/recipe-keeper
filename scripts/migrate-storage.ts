
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const [key, ...value] = line.split("=");
    if (key && value) {
      process.env[key.trim()] = value.join("=").trim().replace(/^["']|["']$/g, "");
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ORIGINAL_BUCKET = "original-scans";
const TARGET_BUCKET = "recipe-images";

async function migrate() {
  console.log("Starting migration from", ORIGINAL_BUCKET, "to", TARGET_BUCKET);

  // 1. Migrate `recipes` table (original_image_url)
  console.log("\n--- Migrating recipes (original_image_url) ---");
  const { data: recipes, error: recipesError } = await supabase
    .from("recipes")
    .select("id, original_image_url")
    .not("original_image_url", "is", null)
    .ilike("original_image_url", `%/${ORIGINAL_BUCKET}/%`);

  if (recipesError) {
    console.error("Error fetching recipes:", recipesError);
  } else {
    console.log(`Found ${recipes.length} recipes to migrate.`);
    for (const recipe of recipes) {
      await processRecord("recipes", recipe.id, "original_image_url", recipe.original_image_url);
    }
  }

  // 2. Migrate `recipe_steps` table (image_url)
  console.log("\n--- Migrating recipe_steps (image_url) ---");
  const { data: steps, error: stepsError } = await supabase
    .from("recipe_steps")
    .select("id, image_url")
    .not("image_url", "is", null)
    .ilike("image_url", `%/${ORIGINAL_BUCKET}/%`);

  if (stepsError) {
    console.error("Error fetching recipe_steps:", stepsError);
  } else {
    console.log(`Found ${steps.length} steps to migrate.`);
    for (const step of steps) {
      await processRecord("recipe_steps", step.id, "image_url", step.image_url);
    }
  }

  // 3. Migrate `recipe_images` table (image_url)
  console.log("\n--- Migrating recipe_images (image_url) ---");
  const { data: images, error: imagesError } = await supabase
    .from("recipe_images")
    .select("id, image_url")
    .not("image_url", "is", null)
    .ilike("image_url", `%/${ORIGINAL_BUCKET}/%`);

  if (imagesError) {
    console.error("Error fetching recipe_images:", imagesError);
  } else {
    console.log(`Found ${images.length} images to migrate.`);
    for (const img of images) {
      await processRecord("recipe_images", img.id, "image_url", img.image_url);
    }
  }

  console.log("\nMigration complete.");
}

async function processRecord(table: string, id: string, column: string, oldUrl: string) {
  try {
    // Extract file path from URL
    // URL format: .../storage/v1/object/public/original-scans/user_id/scans/filename
    const urlParts = oldUrl.split(`/${ORIGINAL_BUCKET}/`);
    if (urlParts.length !== 2) {
      console.warn(`[${table}:${id}] Could not parse URL: ${oldUrl}`);
      return;
    }
    const path = urlParts[1]; // e.g., "user_id/scans/filename"

    console.log(`[${table}:${id}] Migrating ${path}...`);

    // Download from original bucket
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(ORIGINAL_BUCKET)
      .download(path);

    if (downloadError) {
      console.error(`[${table}:${id}] Download failed:`, downloadError.message);
      return;
    }

    // Upload to new bucket (keep same path structure or simplify?)
    // Let's keep "user_id/scans/filename" structure but in 'recipe-images' bucket
    // Note: 'recipe-images' usually expects "user_id/..." so it should work if policies allow.
    // Using service role key bypasses policies anyway.

    // Check if it already exists to avoid duplication?
    // Service role overwrite is true by default usually? No, let's explicitly overwrite if needed or checking first.
    // Actually, simple upload. If it exists, Supabase might error or overwrite depending on options.
    // upsert: true
    const { error: uploadError } = await supabase.storage
      .from(TARGET_BUCKET)
      .upload(path, fileData, { upsert: true, contentType: fileData.type });

    if (uploadError) {
      console.error(`[${table}:${id}] Upload failed:`, uploadError.message);
      return;
    }

    // Get new Public URL
    const { data: { publicUrl: newUrl } } = supabase.storage
      .from(TARGET_BUCKET)
      .getPublicUrl(path);

    // Update DB
    const { error: updateError } = await supabase
      .from(table)
      .update({ [column]: newUrl })
      .eq("id", id);

    if (updateError) {
      console.error(`[${table}:${id}] DB Update failed:`, updateError.message);
    } else {
      console.log(`[${table}:${id}] Success! New URL: ${newUrl}`);
    }

  } catch (err) {
    console.error(`[${table}:${id}] Unexpected error:`, err);
  }
}

migrate();
