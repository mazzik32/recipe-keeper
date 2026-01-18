# Database Schema

## Overview

Recipe Keeper uses Supabase (PostgreSQL) with Row Level Security (RLS) enabled on all tables. This document details the complete database schema.

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌──────────────────┐
│   profiles  │       │  categories │       │   collections    │
├─────────────┤       ├─────────────┤       ├──────────────────┤
│ id (PK,FK)  │       │ id (PK)     │       │ id (PK)          │
│ display_name│       │ name        │       │ user_id (FK)     │
│ avatar_url  │       │ slug        │       │ name             │
│ created_at  │       │ icon        │       │ description      │
│ updated_at  │       │ order_index │       │ created_at       │
└──────┬──────┘       └──────┬──────┘       └────────┬─────────┘
       │                     │                       │
       │                     │                       │
       │    ┌────────────────┴───────────────┐      │
       │    │            recipes             │      │
       │    ├────────────────────────────────┤      │
       └────┤ id (PK)                        │      │
            │ user_id (FK) ──────────────────┘      │
            │ title                                  │
            │ description                            │
            │ servings                               │
            │ prep_time_minutes                      │
            │ cook_time_minutes                      │
            │ difficulty                             │
            │ category_id (FK) ─────────────────────┘
            │ source                                 
            │ source_type                            
            │ notes                                  
            │ is_favorite                            
            │ is_archived                            
            │ original_image_url                     
            │ created_at                             
            │ updated_at                             
            └───────────┬───────────────────────────┐
                        │                           │
        ┌───────────────┼───────────────┐          │
        │               │               │          │
        ▼               ▼               ▼          │
┌───────────────┐ ┌───────────────┐ ┌──────────────┐ │
│recipe_ingredients│ │ recipe_steps │ │recipe_images │ │
├───────────────┤ ├───────────────┤ ├──────────────┤ │
│ id (PK)       │ │ id (PK)       │ │ id (PK)      │ │
│ recipe_id(FK) │ │ recipe_id(FK) │ │ recipe_id(FK)│ │
│ name          │ │ step_number   │ │ image_url    │ │
│ quantity      │ │ instruction   │ │ is_primary   │ │
│ unit          │ │ image_url     │ │ caption      │ │
│ notes         │ │ timer_minutes │ │ created_at   │ │
│ order_index   │ └───────────────┘ └──────────────┘ │
└───────────────┘                                    │
                                                     │
        ┌────────────────────────────────────────────┘
        │
        ▼
┌───────────────────┐     ┌─────────────┐
│recipe_collections │     │    tags     │
├───────────────────┤     ├─────────────┤
│ recipe_id (FK)    │     │ id (PK)     │
│ collection_id(FK) │     │ user_id(FK) │
└───────────────────┘     │ name        │
                          └──────┬──────┘
                                 │
                          ┌──────┴──────┐
                          │ recipe_tags │
                          ├─────────────┤
                          │recipe_id(FK)│
                          │ tag_id (FK) │
                          └─────────────┘
```

## Tables

### profiles

User profile information (extends Supabase Auth).

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    credits INTEGER DEFAULT 0 NOT NULL
);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, credits)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name', 5);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, FK to auth.users | User ID |
| display_name | TEXT | | User's display name |
| avatar_url | TEXT | | Profile picture URL |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |
| credits | INTEGER | NOT NULL, DEFAULT 0 | User credits (5 free on signup) |

---

### categories

Predefined recipe categories (seeded data).

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,
    order_index INTEGER DEFAULT 0
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Category ID |
| name | TEXT | NOT NULL | Display name |
| slug | TEXT | UNIQUE, NOT NULL | URL-friendly identifier |
| icon | TEXT | | Emoji or icon name |
| order_index | INTEGER | DEFAULT 0 | Sort order |

**Seed Data:**
```sql
INSERT INTO categories (name, slug, icon, order_index) VALUES
    ('Appetizers', 'appetizers', '🥗', 1),
    ('Main Course', 'main-course', '🍽️', 2),
    ('Side Dishes', 'side-dishes', '🥔', 3),
    ('Desserts', 'desserts', '🍰', 4),
    ('Beverages', 'beverages', '🥤', 5),
    ('Breakfast', 'breakfast', '🍳', 6),
    ('Snacks', 'snacks', '🍿', 7),
    ('Soups & Salads', 'soups-salads', '🥣', 8);
```

---

### recipes

Main recipe table.

```sql
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE source_type AS ENUM ('family', 'cookbook', 'website', 'other');

CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    servings INTEGER,
    prep_time_minutes INTEGER,
    cook_time_minutes INTEGER,
    difficulty difficulty_level DEFAULT 'medium',
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    source TEXT,
    source_type source_type DEFAULT 'family',
    notes TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    original_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for common queries
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_category_id ON recipes(category_id);
CREATE INDEX idx_recipes_is_favorite ON recipes(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_recipes_created_at ON recipes(user_id, created_at DESC);

-- Full-text search index
CREATE INDEX idx_recipes_search ON recipes 
    USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Recipe ID |
| user_id | UUID | FK, NOT NULL | Owner user ID |
| title | TEXT | NOT NULL | Recipe title |
| description | TEXT | | Brief description |
| servings | INTEGER | | Number of servings |
| prep_time_minutes | INTEGER | | Preparation time |
| cook_time_minutes | INTEGER | | Cooking time |
| difficulty | ENUM | DEFAULT 'medium' | easy, medium, hard |
| category_id | UUID | FK | Category reference |
| source | TEXT | | Recipe origin (e.g., "Mom") |
| source_type | ENUM | DEFAULT 'family' | family, cookbook, website, other |
| notes | TEXT | | Personal notes/memories |
| is_favorite | BOOLEAN | DEFAULT FALSE | Marked as favorite |
| is_archived | BOOLEAN | DEFAULT FALSE | Soft archived |
| original_image_url | TEXT | | Scanned original image |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update timestamp |

---

### recipe_ingredients

Ingredients for each recipe.

```sql
CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity DECIMAL(10, 2),
    unit TEXT,
    notes TEXT,
    order_index INTEGER DEFAULT 0
);

CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Ingredient ID |
| recipe_id | UUID | FK, NOT NULL | Parent recipe |
| name | TEXT | NOT NULL | Ingredient name |
| quantity | DECIMAL(10,2) | | Amount (e.g., 2.5) |
| unit | TEXT | | Unit (e.g., "cups", "tbsp") |
| notes | TEXT | | Extra notes (e.g., "finely chopped") |
| order_index | INTEGER | DEFAULT 0 | Display order |

---

### recipe_steps

Step-by-step instructions.

```sql
CREATE TABLE recipe_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    instruction TEXT NOT NULL,
    image_url TEXT,
    timer_minutes INTEGER
);

CREATE INDEX idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Step ID |
| recipe_id | UUID | FK, NOT NULL | Parent recipe |
| step_number | INTEGER | NOT NULL | Step order (1, 2, 3...) |
| instruction | TEXT | NOT NULL | Step instruction text |
| image_url | TEXT | | Optional step image |
| timer_minutes | INTEGER | | Optional timer for step |

---

### recipe_images

Finished dish photos (1-2 per recipe).

```sql
CREATE TABLE recipe_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_recipe_images_recipe_id ON recipe_images(recipe_id);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Image ID |
| recipe_id | UUID | FK, NOT NULL | Parent recipe |
| image_url | TEXT | NOT NULL | Storage URL |
| is_primary | BOOLEAN | DEFAULT FALSE | Main display image |
| caption | TEXT | | Image caption |
| created_at | TIMESTAMPTZ | NOT NULL | Upload timestamp |

---

### collections

User-created recipe collections.

```sql
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_collections_user_id ON collections(user_id);
```

---

### recipe_collections

Many-to-many: recipes in collections.

```sql
CREATE TABLE recipe_collections (
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, collection_id)
);
```

---

### tags

User-defined tags.

```sql
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    UNIQUE (user_id, name)
);

CREATE INDEX idx_tags_user_id ON tags(user_id);
```

---

### recipe_tags

Many-to-many: tags on recipes.

```sql
CREATE TABLE recipe_tags (
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, tag_id)
);
```

---

## Row Level Security (RLS) Policies

All tables have RLS enabled with policies ensuring users can only access their own data.

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;

-- Categories are public (read-only for all)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone" ON categories
    FOR SELECT USING (true);

-- Profiles: users can view and update own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Recipes: full CRUD for own recipes
CREATE POLICY "Users can view own recipes" ON recipes
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own recipes" ON recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recipes" ON recipes
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recipes" ON recipes
    FOR DELETE USING (auth.uid() = user_id);

-- Recipe ingredients: access through recipe ownership
CREATE POLICY "Users can manage own recipe ingredients" ON recipe_ingredients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_ingredients.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

-- Recipe steps: access through recipe ownership
CREATE POLICY "Users can manage own recipe steps" ON recipe_steps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_steps.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

-- Recipe images: access through recipe ownership
CREATE POLICY "Users can manage own recipe images" ON recipe_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_images.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

-- Collections: full CRUD for own collections
CREATE POLICY "Users can manage own collections" ON collections
    FOR ALL USING (auth.uid() = user_id);

-- Recipe collections: access through recipe/collection ownership
CREATE POLICY "Users can manage own recipe collections" ON recipe_collections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_collections.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

-- Tags: full CRUD for own tags
CREATE POLICY "Users can manage own tags" ON tags
    FOR ALL USING (auth.uid() = user_id);

-- Recipe tags: access through recipe ownership
CREATE POLICY "Users can manage own recipe tags" ON recipe_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_tags.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );
```

---

## Storage Buckets

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('recipe-images', 'recipe-images', true),
    ('step-images', 'step-images', true),
    ('original-scans', 'original-scans', true),
    ('avatars', 'avatars', true);

-- Storage policies
CREATE POLICY "Users can upload own images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id IN ('recipe-images', 'step-images', 'original-scans') 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Images are publicly accessible" ON storage.objects
    FOR SELECT USING (
        bucket_id IN ('recipe-images', 'step-images', 'original-scans', 'avatars')
    );

CREATE POLICY "Users can delete own images" ON storage.objects
    FOR DELETE USING (
        bucket_id IN ('recipe-images', 'step-images', 'original-scans') 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
```

---

## Common Queries

### Get all recipes for a user with category
```sql
SELECT 
    r.*,
    c.name as category_name,
    c.slug as category_slug
FROM recipes r
LEFT JOIN categories c ON r.category_id = c.id
WHERE r.user_id = $1 AND r.is_archived = false
ORDER BY r.created_at DESC;
```

### Get full recipe with ingredients and steps
```sql
SELECT 
    r.*,
    c.name as category_name,
    json_agg(DISTINCT ri.*) as ingredients,
    json_agg(DISTINCT rs.* ORDER BY rs.step_number) as steps,
    json_agg(DISTINCT rim.*) as images
FROM recipes r
LEFT JOIN categories c ON r.category_id = c.id
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
LEFT JOIN recipe_steps rs ON r.id = rs.recipe_id
LEFT JOIN recipe_images rim ON r.id = rim.recipe_id
WHERE r.id = $1
GROUP BY r.id, c.name;
```

### Search recipes
```sql
SELECT *
FROM recipes
WHERE user_id = $1
AND to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')) 
    @@ plainto_tsquery('english', $2)
ORDER BY ts_rank(
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')),
    plainto_tsquery('english', $2)
) DESC;
```

### Get recipes by category
```sql
SELECT r.*
FROM recipes r
JOIN categories c ON r.category_id = c.id
WHERE r.user_id = $1 AND c.slug = $2 AND r.is_archived = false
ORDER BY r.created_at DESC;
```
