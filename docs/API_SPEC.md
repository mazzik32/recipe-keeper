# API Specification

## Overview

Recipe Keeper uses Supabase Edge Functions for server-side logic and Cloudflare Workers for edge computing tasks. This document details all API endpoints.

---

## Supabase Edge Functions

Base URL: `https://<project-ref>.supabase.co/functions/v1`

All Edge Functions require authentication via Supabase JWT token in the `Authorization` header.

### 1. Analyze Recipe (AI Extraction)

Extracts recipe data from an uploaded image or PDF using OpenAI Vision API.

**Endpoint:** `POST /analyze-recipe`

**Headers:**
```
Authorization: Bearer <supabase-jwt>
Content-Type: application/json
```

**Request Body:**
```json
{
  "imageUrl": "https://storage.supabase.co/...",
  // OR
  "base64Image": "data:image/jpeg;base64,..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "title": "Mom's Apple Pie",
    "description": "Classic homemade apple pie with a flaky crust",
    "servings": 8,
    "prepTimeMinutes": 30,
    "cookTimeMinutes": 45,
    "difficulty": "medium",
    "ingredients": [
      {
        "name": "Granny Smith apples",
        "quantity": 6,
        "unit": "large",
        "notes": "peeled and sliced"
      },
      {
        "name": "sugar",
        "quantity": 0.75,
        "unit": "cup",
        "notes": null
      }
    ],
    "steps": [
      {
        "stepNumber": 1,
        "instruction": "Preheat oven to 375°F (190°C)."
      },
      {
        "stepNumber": 2,
        "instruction": "In a large bowl, combine sliced apples with sugar and cinnamon."
      }
    ],
    "suggestedCategory": "desserts",
    "confidence": 0.92
  }
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": {
    "code": "EXTRACTION_FAILED",
    "message": "Could not extract recipe from image. Please try a clearer photo."
  }
}
```

**Edge Function Implementation:**
```typescript
// supabase/functions/analyze-recipe/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import OpenAI from "https://esm.sh/openai@4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageUrl, base64Image } = await req.json()
    
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    })

    const imageContent = imageUrl 
      ? { type: "image_url", image_url: { url: imageUrl } }
      : { type: "image_url", image_url: { url: base64Image } }

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are a recipe extraction assistant. Extract recipe information from images and return structured JSON data. Include: title, description, servings, prepTimeMinutes, cookTimeMinutes, difficulty (easy/medium/hard), ingredients (array with name, quantity, unit, notes), steps (array with stepNumber, instruction), and suggestedCategory (appetizers/main-course/side-dishes/desserts/beverages/breakfast/snacks/soups-salads).`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the recipe from this image:" },
            imageContent
          ]
        }
      ],
      max_tokens: 2000
    })

    const extractedData = JSON.parse(response.choices[0].message.content)

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: { code: 'EXTRACTION_FAILED', message: error.message }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

### 2. Generate PDF Recipe Book

Generates a beautifully formatted PDF recipe book from selected recipes.

**Endpoint:** `POST /generate-pdf`

**Headers:**
```
Authorization: Bearer <supabase-jwt>
Content-Type: application/json
```

**Request Body:**
```json
{
  "recipeIds": ["uuid-1", "uuid-2", "uuid-3"],
  "options": {
    "title": "Family Recipes",
    "subtitle": "Collected with love",
    "dedication": "For my children, so these recipes live on forever.",
    "coverTemplate": "classic",
    "includeTableOfContents": true,
    "includeIndex": true,
    "recipesPerPage": 1,
    "includeNotes": true,
    "includeSource": true
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "pdfUrl": "https://storage.supabase.co/.../recipe-book-2024-01-15.pdf",
    "expiresAt": "2024-01-16T00:00:00Z",
    "pageCount": 25,
    "fileSize": 2456789
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "PDF_GENERATION_FAILED",
    "message": "Failed to generate PDF. Please try again."
  }
}
```

---

## Cloudflare Workers

### Image Optimizer

Optimizes and resizes images for web delivery.

**Base URL:** `https://images.recipe-keeper.workers.dev`

**Endpoint:** `GET /:imageId`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| w | number | original | Width in pixels |
| h | number | original | Height in pixels |
| q | number | 80 | Quality (1-100) |
| f | string | auto | Format (auto, webp, jpeg, png) |
| fit | string | cover | Fit mode (cover, contain, fill) |

**Example:**
```
GET /abc123.jpg?w=400&h=300&q=85&f=webp
```

**Response:** Optimized image binary with appropriate Content-Type header.

**Worker Implementation:**
```typescript
// cloudflare/workers/image-optimizer/src/index.ts
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const imageId = url.pathname.slice(1);
    
    const params = {
      width: parseInt(url.searchParams.get('w') || '0') || undefined,
      height: parseInt(url.searchParams.get('h') || '0') || undefined,
      quality: parseInt(url.searchParams.get('q') || '80'),
      format: url.searchParams.get('f') || 'auto',
      fit: url.searchParams.get('fit') || 'cover',
    };

    // Fetch original from Supabase Storage
    const originalUrl = `${env.SUPABASE_URL}/storage/v1/object/public/recipe-images/${imageId}`;
    
    // Use Cloudflare Image Resizing
    const imageRequest = new Request(originalUrl, {
      headers: request.headers,
    });

    return fetch(imageRequest, {
      cf: {
        image: {
          width: params.width,
          height: params.height,
          quality: params.quality,
          format: params.format === 'auto' ? 'auto' : params.format,
          fit: params.fit,
        },
      },
    });
  },
};
```

---

## Supabase Client API

The frontend uses the Supabase JavaScript client for direct database operations. These are not traditional REST endpoints but typed queries.

### Authentication

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  options: {
    data: { display_name: 'John Doe' }
  }
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword'
})

// Sign out
await supabase.auth.signOut()

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```

### Recipes CRUD

```typescript
// List recipes
const { data, error } = await supabase
  .from('recipes')
  .select(`
    *,
    category:categories(name, slug),
    images:recipe_images(*)
  `)
  .eq('is_archived', false)
  .order('created_at', { ascending: false })

// Get single recipe with all relations
const { data, error } = await supabase
  .from('recipes')
  .select(`
    *,
    category:categories(name, slug, icon),
    ingredients:recipe_ingredients(*),
    steps:recipe_steps(*),
    images:recipe_images(*)
  `)
  .eq('id', recipeId)
  .single()

// Create recipe
const { data, error } = await supabase
  .from('recipes')
  .insert({
    title: 'New Recipe',
    description: 'Description',
    servings: 4,
    prep_time_minutes: 15,
    cook_time_minutes: 30,
    difficulty: 'easy',
    category_id: categoryId,
    source: 'Mom',
    source_type: 'family'
  })
  .select()
  .single()

// Update recipe
const { data, error } = await supabase
  .from('recipes')
  .update({ title: 'Updated Title' })
  .eq('id', recipeId)
  .select()
  .single()

// Delete recipe (soft delete)
const { error } = await supabase
  .from('recipes')
  .update({ is_archived: true })
  .eq('id', recipeId)

// Toggle favorite
const { error } = await supabase
  .from('recipes')
  .update({ is_favorite: !currentValue })
  .eq('id', recipeId)
```

### Ingredients

```typescript
// Add ingredients (batch)
const { error } = await supabase
  .from('recipe_ingredients')
  .insert(ingredients.map((ing, index) => ({
    recipe_id: recipeId,
    name: ing.name,
    quantity: ing.quantity,
    unit: ing.unit,
    notes: ing.notes,
    order_index: index
  })))

// Update ingredients (delete and re-insert)
await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId)
await supabase.from('recipe_ingredients').insert(newIngredients)
```

### Steps

```typescript
// Add steps (batch)
const { error } = await supabase
  .from('recipe_steps')
  .insert(steps.map((step, index) => ({
    recipe_id: recipeId,
    step_number: index + 1,
    instruction: step.instruction,
    image_url: step.imageUrl,
    timer_minutes: step.timerMinutes
  })))
```

### Image Upload

```typescript
// Upload image to storage
const fileName = `${userId}/${recipeId}/${Date.now()}.jpg`
const { data, error } = await supabase.storage
  .from('recipe-images')
  .upload(fileName, file, {
    contentType: 'image/jpeg',
    upsert: false
  })

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('recipe-images')
  .getPublicUrl(fileName)

// Save to recipe_images table
await supabase
  .from('recipe_images')
  .insert({
    recipe_id: recipeId,
    image_url: publicUrl,
    is_primary: true
  })
```

### Search

```typescript
// Full-text search
const { data, error } = await supabase
  .from('recipes')
  .select('*')
  .textSearch('title', searchQuery, {
    type: 'websearch',
    config: 'english'
  })

// Filter by category
const { data, error } = await supabase
  .from('recipes')
  .select(`*, category:categories(*)`)
  .eq('category.slug', 'desserts')
```

### Categories

```typescript
// Get all categories
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .order('order_index')
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTH_REQUIRED | 401 | Authentication required |
| FORBIDDEN | 403 | User doesn't have permission |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| EXTRACTION_FAILED | 500 | AI recipe extraction failed |
| PDF_GENERATION_FAILED | 500 | PDF generation failed |
| UPLOAD_FAILED | 500 | File upload failed |
| RATE_LIMITED | 429 | Too many requests |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| analyze-recipe | 10 requests/minute |
| generate-pdf | 5 requests/minute |
| Image uploads | 30 requests/minute |
| Database queries | 100 requests/minute |

---

## Webhooks (Future)

Reserved endpoints for future integrations:

- `POST /api/webhooks/stripe` - Payment webhooks (premium features)
- `POST /api/webhooks/email` - Email notification callbacks
