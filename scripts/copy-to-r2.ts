/**
 * COPY-ONLY Migration: Supabase Storage → Cloudflare R2
 * 
 * This script copies ALL images from Supabase Storage into Cloudflare R2
 * WITHOUT modifying any database URLs. The web app continues to serve
 * from Supabase as before. Once you've verified R2 works on mobile,
 * you can run a separate "switch" script to update the DB pointers.
 * 
 * Usage:
 *   npx tsx scripts/copy-to-r2.ts
 * 
 * Required env vars in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 *   R2_BUCKET_NAME (defaults to "recipe-keeper-assets")
 */

import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// ── Load .env.local ──────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const [key, ...value] = line.split("=");
    if (key && value.length) {
      process.env[key.trim()] = value.join("=").trim().replace(/^["']|["']$/g, "");
    }
  });
}

// ── Validate env ─────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET_NAME || "recipe-keeper-assets";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error("❌ Missing R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY in .env.local");
  process.exit(1);
}

// ── Clients ──────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const R2_ENDPOINT = process.env.R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ── Helpers ──────────────────────────────────────────────────────

/** Extract bucket name and file path from a Supabase Storage public URL */
function parseSupabaseUrl(url: string): { bucket: string; filePath: string } | null {
  // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(\?.*)?$/);
  if (!match) return null;
  return { bucket: match[1], filePath: match[2] };
}

/** Check if a key already exists in R2 (skip duplicates) */
async function existsInR2(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

// ── Main ─────────────────────────────────────────────────────────

interface TableConfig {
  name: string;
  column: string;
}

const TABLES: TableConfig[] = [
  { name: "recipes",       column: "original_image_url" },
  { name: "recipe_steps",  column: "image_url" },
  { name: "recipe_images", column: "image_url" },
];

async function copyToR2() {
  console.log("🚀 Starting COPY-ONLY migration (Supabase → R2)");
  console.log("   ⚠️  Database URLs will NOT be modified.\n");

  let totalCopied = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const table of TABLES) {
    console.log(`\n━━━ ${table.name}.${table.column} ━━━`);

    const { data: records, error } = await supabase
      .from(table.name)
      .select(`id, ${table.column}`)
      .not(table.column, "is", null);

    if (error) {
      console.error(`  ❌ Failed to query ${table.name}:`, error.message);
      continue;
    }

    if (!records || records.length === 0) {
      console.log("  (no records with images)");
      continue;
    }

    console.log(`  Found ${records.length} records`);

    for (const record of records) {
      const oldUrl: string = record[table.column];
      const parsed = parseSupabaseUrl(oldUrl);

      if (!parsed) {
        // Skip non-Supabase URLs (e.g. already on R2 or external)
        totalSkipped++;
        continue;
      }

      const { bucket, filePath } = parsed;

      // Include bucket name in R2 key to avoid cross-bucket collisions
      // and make the future DB switch a trivial domain-prefix replacement
      // e.g. "recipe-images/user123/scans/photo.jpg"
      const r2Key = `${bucket}/${filePath}`;

      // Skip if already copied
      if (await existsInR2(r2Key)) {
        console.log(`  ⏭  ${r2Key} (already in R2)`);
        totalSkipped++;
        continue;
      }

      // Download from Supabase
      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from(bucket)
        .download(filePath);

      if (downloadError || !fileBlob) {
        console.error(`  ❌ Download failed [${table.name}:${record.id}]: ${downloadError?.message}`);
        totalFailed++;
        continue;
      }

      // Upload to R2
      try {
        const arrayBuffer = await fileBlob.arrayBuffer();
        await s3.send(new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: r2Key,
          Body: new Uint8Array(arrayBuffer),
          ContentType: fileBlob.type || "image/jpeg",
        }));

        console.log(`  ✅ ${r2Key}`);
        totalCopied++;
      } catch (uploadErr: any) {
        console.error(`  ❌ Upload failed [${table.name}:${record.id}]: ${uploadErr.message}`);
        totalFailed++;
      }
    }
  }

  console.log("\n════════════════════════════════════");
  console.log(`  ✅ Copied:  ${totalCopied}`);
  console.log(`  ⏭  Skipped: ${totalSkipped}`);
  console.log(`  ❌ Failed:  ${totalFailed}`);
  console.log("════════════════════════════════════");
  console.log("\n🎉 Copy complete! Database URLs were NOT modified.");
  console.log("   Your web app continues to serve from Supabase as before.");
}

copyToR2().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
