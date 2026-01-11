-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;

-- Categories are public (read-only for all authenticated users)
CREATE POLICY "Categories are viewable by authenticated users" ON categories
    FOR SELECT TO authenticated USING (true);

-- Profiles: users can view and update own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Recipes: full CRUD for own recipes
CREATE POLICY "Users can view own recipes" ON recipes
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recipes" ON recipes
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes" ON recipes
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes" ON recipes
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Recipe ingredients: access through recipe ownership
CREATE POLICY "Users can view own recipe ingredients" ON recipe_ingredients
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_ingredients.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own recipe ingredients" ON recipe_ingredients
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_ingredients.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own recipe ingredients" ON recipe_ingredients
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_ingredients.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own recipe ingredients" ON recipe_ingredients
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_ingredients.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

-- Recipe steps: access through recipe ownership
CREATE POLICY "Users can view own recipe steps" ON recipe_steps
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_steps.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own recipe steps" ON recipe_steps
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_steps.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own recipe steps" ON recipe_steps
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_steps.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own recipe steps" ON recipe_steps
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_steps.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

-- Recipe images: access through recipe ownership
CREATE POLICY "Users can view own recipe images" ON recipe_images
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_images.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own recipe images" ON recipe_images
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_images.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own recipe images" ON recipe_images
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_images.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own recipe images" ON recipe_images
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_images.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

-- Collections: full CRUD for own collections
CREATE POLICY "Users can view own collections" ON collections
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own collections" ON collections
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON collections
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON collections
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Recipe collections: access through recipe/collection ownership
CREATE POLICY "Users can view own recipe collections" ON recipe_collections
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_collections.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own recipe collections" ON recipe_collections
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_collections.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own recipe collections" ON recipe_collections
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_collections.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

-- Tags: full CRUD for own tags
CREATE POLICY "Users can view own tags" ON tags
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tags" ON tags
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags" ON tags
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags" ON tags
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Recipe tags: access through recipe ownership
CREATE POLICY "Users can view own recipe tags" ON recipe_tags
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_tags.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own recipe tags" ON recipe_tags
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_tags.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own recipe tags" ON recipe_tags
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM recipes 
            WHERE recipes.id = recipe_tags.recipe_id 
            AND recipes.user_id = auth.uid()
        )
    );
