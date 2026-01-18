
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database.types";
import { SupabaseClient } from "@supabase/supabase-js";

type Tables = Database["public"]["Tables"];
type Profile = Tables["profiles"]["Row"];
type Recipe = Tables["recipes"]["Row"];
type RecipeIngredient = Tables["recipe_ingredients"]["Row"];
type RecipeStep = Tables["recipe_steps"]["Row"];
type RecipeImage = Tables["recipe_images"]["Row"];
type Collection = Tables["collections"]["Row"];
type RecipeCollection = Tables["recipe_collections"]["Row"];
type Tag = Tables["tags"]["Row"];
type RecipeTag = Tables["recipe_tags"]["Row"];

interface BackupData {
  version: number;
  date: string;
  profile: Profile;
  recipes: Recipe[];
  recipe_ingredients: RecipeIngredient[];
  recipe_steps: RecipeStep[];
  recipe_images: RecipeImage[];
  collections: Collection[];
  recipe_collections: RecipeCollection[];
  tags: Tag[];
  recipe_tags: RecipeTag[];
}

export class ExportImportService {
  private supabase: SupabaseClient<any, "public", any>;
  private onProgress: (message: string, progress: number) => void;

  constructor(onProgress: (message: string, progress: number) => void) {
    this.supabase = createClient();
    this.onProgress = onProgress;
  }

  // --- EXPORT ---

  async exportUserData() {
    try {
      this.onProgress("Fetching user data...", 10);
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const backupData = await this.gatherUserData(user.id);
      
      this.onProgress("Processing images...", 30);
      const zip = new JSZip();
      
      // Add JSON data
      zip.file("backup.json", JSON.stringify(backupData, null, 2));
      
      // Process and add images
      const imagesFolder = zip.folder("images");
      if (imagesFolder) {
        await this.processImagesForExport(backupData, imagesFolder);
      }

      this.onProgress("Generating backup file...", 90);
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `recipe-keeper-backup-${new Date().toISOString().split('T')[0]}.zip`);
      
      this.onProgress("Export complete!", 100);
    } catch (error) {
      console.error("Export failed:", error);
      throw error;
    }
  }

  private async gatherUserData(userId: string): Promise<BackupData> {
    const { data: profile } = await this.supabase.from("profiles").select("*").eq("id", userId).single();
    if (!profile) throw new Error("Profile not found");

    const { data: recipes } = await this.supabase.from("recipes").select("*").eq("user_id", userId);
    const { data: collections } = await this.supabase.from("collections").select("*").eq("user_id", userId);
    const { data: tags } = await this.supabase.from("tags").select("*").eq("user_id", userId);

    // Fetch related data for recipes
    const recipeIds = recipes?.map(r => r.id) || [];
    
    let ingredients: RecipeIngredient[] = [];
    let steps: RecipeStep[] = [];
    let images: RecipeImage[] = [];
    let recipeCollections: RecipeCollection[] = [];
    let recipeTags: RecipeTag[] = [];

    if (recipeIds.length > 0) {
      const { data: ing } = await this.supabase.from("recipe_ingredients").select("*").in("recipe_id", recipeIds);
      if (ing) ingredients = ing;

      const { data: stp } = await this.supabase.from("recipe_steps").select("*").in("recipe_id", recipeIds);
      if (stp) steps = stp;

      const { data: img } = await this.supabase.from("recipe_images").select("*").in("recipe_id", recipeIds);
      if (img) images = img;

      const { data: rc } = await this.supabase.from("recipe_collections").select("*").in("recipe_id", recipeIds);
      if (rc) recipeCollections = rc;

      const { data: rt } = await this.supabase.from("recipe_tags").select("*").in("recipe_id", recipeIds);
      if (rt) recipeTags = rt;
    }

    return {
      version: 1,
      date: new Date().toISOString(),
      profile,
      recipes: recipes || [],
      recipe_ingredients: ingredients,
      recipe_steps: steps,
      recipe_images: images,
      collections: collections || [],
      recipe_collections: recipeCollections,
      tags: tags || [],
      recipe_tags: recipeTags,
    };
  }

  private async processImagesForExport(data: BackupData, folder: JSZip) {
    const imageUrls = this.extractImageUrls(data);
    const total = imageUrls.length;
    let processed = 0;

    for (const url of imageUrls) {
        if (!url) continue;
        try {
            // Check if it's a Supabase storage URL (we only backup our own images)
            // Or just try to fetch everything? Let's try to fetch everything but handle CORS safely.
            // Actually, for Supabase images, we can download from the public URL.
            
            const response = await fetch(url);
            if (!response.ok) continue;
            
            const blob = await response.blob();
            const filename = this.getFilenameFromUrl(url);
            
            // Store in ZIP: images/filename.ext
            folder.file(filename, blob);

            processed++;
            this.onProgress(`Backing up images (${processed}/${total})...`, 30 + Math.round((processed / total) * 60));
        } catch (e) {
            console.warn(`Failed to backup image: ${url}`, e);
        }
    }
  }

  private extractImageUrls(data: BackupData): string[] {
    const urls = new Set<string>();
    
    if (data.profile.avatar_url) urls.add(data.profile.avatar_url);
    
    data.recipes.forEach(r => {
        if (r.original_image_url) urls.add(r.original_image_url);
    });

    data.recipe_steps.forEach(s => {
        if (s.image_url) urls.add(s.image_url);
    });

    data.recipe_images.forEach(i => {
        if (i.image_url) urls.add(i.image_url);
    });

    return Array.from(urls);
  }

  private getFilenameFromUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        return pathParts[pathParts.length - 1];
    } catch {
        return `image-${Date.now()}.jpg`; // Fallback
    }
  }

  // --- IMPORT ---

  async importUserData(file: File) {
    try {
      this.onProgress("Reading backup file...", 5);
      const zip = await JSZip.loadAsync(file);
      
      const configFile = zip.file("backup.json");
      if (!configFile) throw new Error("Invalid backup file: missing backup.json");

      const content = await configFile.async("string");
      const data: BackupData = JSON.parse(content);

      if (data.version !== 1) {
          throw new Error(`Unsupported backup version: ${data.version}`);
      }

      this.onProgress("Uploading images...", 15);
      // Map old URLs to new URLs (filename -> new Supabase URL)
      const urlMap = await this.uploadImagesFromZip(zip, data);

      this.onProgress("Restoring data...", 60);
      await this.restoreData(data, urlMap);

      this.onProgress("Import complete!", 100);
    } catch (error) {
      console.error("Import failed:", error);
      throw error;
    }
  }

  private async uploadImagesFromZip(zip: JSZip, data: BackupData): Promise<Map<string, string>> {
     const urlMap = new Map<string, string>();
     const imagesFolder = zip.folder("images");
     if (!imagesFolder) return urlMap;

     const files: {name: string, obj: JSZip.JSZipObject}[] = [];
     imagesFolder.forEach((relativePath, file) => {
         files.push({name: relativePath, obj: file});
     });

     const total = files.length;
     let processed = 0;
     const { data: { user } } = await this.supabase.auth.getUser();
     if (!user) throw new Error("No user");

     for (const {name, obj} of files) {
         const blob = await obj.async("blob");
         const uniqueName = `${user.id}/${Date.now()}_${name}`;
         
         // Determine bucket based on usage (simplified: put everything in recipe-images for now, 
         // or we need to know where it belongs. 
         // PROPOSAL: Put everything in 'recipe-images' as it's the catch-all. 
         // 'step-images' and 'original-scans' are also valid but hard to distinguish just from filename.
         // Let's check where the image was used in the backup data to decide bucket? 
         // Too complex. 'recipe-images' is fine for all generally, provided policies allow it.
         
         // But wait, policies are strict! 
         // recipe-images, step-images, original-scans policies:
         // bucket_id IN ('recipe-images', 'step-images', 'original-scans') AND auth.uid()::text = (storage.foldername(name))[1]
         // So we can use any of them. Let's use 'recipe-images' for everything for simplicity, 
         // OR we could check if it looks like a step image?
         // Let's just use 'recipe-images' for simplicity.

         const { data: uploadData, error } = await this.supabase.storage
            .from("recipe-images") 
            .upload(uniqueName, blob);

         if (error) {
             console.warn(`Failed to upload ${name}`, error);
             continue;
         }

        const { data: { publicUrl } } = this.supabase.storage
            .from("recipe-images")
            .getPublicUrl(uniqueName);
        
        // We map the ORIGINAL filename (or URL suffix) to the new Public URL
        // In export we stored files as filenames. 
        // We need to match legacy URLs to these filenames.
        // The export logic saved them as `inputUrl` -> `filename` in zip.
        // The import logic needs to handle replacement.
        // Actually, we need to know what the original URL was to replace it in the JSON objects.
        // BUT we only stored the filename in the ZIP.
        // ISSUE: data.recipes[0].image_url is the FULL URL.
        // The filename in ZIP is derived from that URL.
        // So we can re-derive the filename from the URL in the JSON data, and match it to the uploaded file.
        
        urlMap.set(name, publicUrl); // name is the filename in the zip

         processed++;
         this.onProgress(`Restoring images (${processed}/${total})...`, 15 + Math.round((processed / total) * 45));
     }
     
     return urlMap;
  }

  private async restoreData(data: BackupData, urlMap: Map<string, string>) {
     // 1. Tags (Find existing or Create)
     // 2. Collections (Create new)
     // 3. Recipes (Create new) -> Ingredients, Steps, Images
     // 4. RecipeTags, RecipeCollections (Link new IDs)
     
     const { data: { user } } = await this.supabase.auth.getUser();
     if (!user) throw new Error("User needed");
     const userId = user.id;

     // --- ID MAPPINGS (Old ID -> New ID) ---
     const tagMap = new Map<string, string>();
     const collectionMap = new Map<string, string>();
     const recipeMap = new Map<string, string>();

     // --- 1. TAGS ---
     for (const tag of data.tags) {
        // Check if exists
        const { data: existing } = await this.supabase.from("tags")
            .select("id")
            .eq("user_id", userId)
            .eq("name", tag.name)
            .single();

        if (existing) {
            tagMap.set(tag.id, existing.id);
        } else {
            const { data: newTag, error } = await this.supabase.from("tags")
                .insert({ user_id: userId, name: tag.name })
                .select("id")
                .single();
            if (newTag) tagMap.set(tag.id, newTag.id);
            else console.error("Tag insert error", error);
        }
     }

     // --- 2. COLLECTIONS ---
     for (const col of data.collections) {
         const { data: newCol } = await this.supabase.from("collections")
            .insert({
                user_id: userId,
                name: col.name,
                description: col.description
            })
            .select("id")
            .single();
         if (newCol) collectionMap.set(col.id, newCol.id);
     }

     // --- 3. RECIPES ---
     const totalRecipes = data.recipes.length;
     let processedRec = 0;

     for (const recipe of data.recipes) {
         // Replace Image URL
         let originalImg = recipe.original_image_url;
         if (originalImg) {
             const filename = this.getFilenameFromUrl(originalImg);
             if (urlMap.has(filename)) originalImg = urlMap.get(filename)!;
         }

         const recipeInsert: Database["public"]["Tables"]["recipes"]["Insert"] = {
             user_id: userId,
             title: recipe.title,
             description: recipe.description,
             servings: recipe.servings,
             prep_time_minutes: recipe.prep_time_minutes,
             cook_time_minutes: recipe.cook_time_minutes,
             difficulty: recipe.difficulty,
             category_id: recipe.category_id,
             source: recipe.source,
             source_type: recipe.source_type,
             notes: recipe.notes,
             is_favorite: recipe.is_favorite,
             is_archived: recipe.is_archived,
             original_image_url: originalImg
         };

         const { data: newRecipe } = await this.supabase.from("recipes")
            .insert(recipeInsert)
            .select("id")
            .single();
         
         if (newRecipe) {
             const newRecipeId = newRecipe.id;
             recipeMap.set(recipe.id, newRecipeId);

             // INGREDIENTS
             const ingredients: Database["public"]["Tables"]["recipe_ingredients"]["Insert"][] = data.recipe_ingredients
                .filter(ri => ri.recipe_id === recipe.id)
                .map(ri => ({
                    recipe_id: newRecipeId,
                    name: ri.name,
                    quantity: ri.quantity,
                    unit: ri.unit,
                    notes: ri.notes,
                    order_index: ri.order_index
                }));
             if (ingredients.length) await this.supabase.from("recipe_ingredients").insert(ingredients);

             // STEPS
             const steps: Database["public"]["Tables"]["recipe_steps"]["Insert"][] = data.recipe_steps
                .filter(rs => rs.recipe_id === recipe.id)
                .map(rs => {
                    let stepImg = rs.image_url;
                    if (stepImg) {
                        const fname = this.getFilenameFromUrl(stepImg);
                        if (urlMap.has(fname)) stepImg = urlMap.get(fname)!;
                    }
                    return {
                        recipe_id: newRecipeId,
                        step_number: rs.step_number,
                        instruction: rs.instruction,
                        image_url: stepImg,
                        timer_minutes: rs.timer_minutes
                    };
                });
             if (steps.length) await this.supabase.from("recipe_steps").insert(steps);

             // IMAGES
             const images: Database["public"]["Tables"]["recipe_images"]["Insert"][] = data.recipe_images
                .filter(ri => ri.recipe_id === recipe.id)
                .map(ri => {
                    let imgUrl = ri.image_url;
                    if (imgUrl) {
                        const fname = this.getFilenameFromUrl(imgUrl);
                        if (urlMap.has(fname)) imgUrl = urlMap.get(fname)!;
                    }
                    return {
                        recipe_id: newRecipeId,
                        image_url: imgUrl!, // asserted non-null by filter below
                        is_primary: ri.is_primary,
                        caption: ri.caption
                    };
                })
                .filter(ri => ri.image_url !== null); 

             if (images.length) await this.supabase.from("recipe_images").insert(images);
         }

         processedRec++;
         this.onProgress(`Restoring recipes (${processedRec}/${totalRecipes})...`, 60 + Math.round((processedRec / totalRecipes) * 30));
     }

     // --- 4. RELATIONS (Recipe <-> Collection, Recipe <-> Tags) ---
     
     // Recipe Collections
     const rcToInsert: Database["public"]["Tables"]["recipe_collections"]["Insert"][] = data.recipe_collections
        .filter(rc => recipeMap.has(rc.recipe_id) && collectionMap.has(rc.collection_id))
        .map(rc => ({
            recipe_id: recipeMap.get(rc.recipe_id)!,
            collection_id: collectionMap.get(rc.collection_id)!
        }));
     if (rcToInsert.length) await this.supabase.from("recipe_collections").insert(rcToInsert);

     // Recipe Tags
     const rtToInsert: Database["public"]["Tables"]["recipe_tags"]["Insert"][] = data.recipe_tags
        .filter(rt => recipeMap.has(rt.recipe_id) && tagMap.has(rt.tag_id))
        .map(rt => ({
            recipe_id: recipeMap.get(rt.recipe_id)!,
            tag_id: tagMap.get(rt.tag_id)!
        }));
     if (rtToInsert.length) await this.supabase.from("recipe_tags").insert(rtToInsert);

     // Restoring Profile (Credits?)
     // Maybe we shouldn't overwrite profile data, just recipes. 
     // The requirement was "content of an account". 
     // Overwriting display_name is fine, but credits management is sensitive.
     // Let's SKIP profile restore to be safe, or just restore safe fields like display_name if they want?
     // Decision: Do NOT overwrite profile core data (auth, credits) automatically. 
     // But maybe restore display_name if it's different?
     // Let's stick to content (recipes/collections).
  }
}
