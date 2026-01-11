-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE source_type AS ENUM ('family', 'cookbook', 'website', 'other');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,
    order_index INTEGER DEFAULT 0
);

-- Recipes table
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Recipe ingredients table
CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity DECIMAL(10, 2),
    unit TEXT,
    notes TEXT,
    order_index INTEGER DEFAULT 0
);

-- Recipe steps table
CREATE TABLE recipe_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    instruction TEXT NOT NULL,
    image_url TEXT,
    timer_minutes INTEGER
);

-- Recipe images table
CREATE TABLE recipe_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Collections table
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Recipe collections junction table
CREATE TABLE recipe_collections (
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, collection_id)
);

-- Tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    UNIQUE (user_id, name)
);

-- Recipe tags junction table
CREATE TABLE recipe_tags (
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, tag_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_category_id ON recipes(category_id);
CREATE INDEX idx_recipes_is_favorite ON recipes(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_recipes_created_at ON recipes(user_id, created_at DESC);
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);
CREATE INDEX idx_recipe_images_recipe_id ON recipe_images(recipe_id);
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_tags_user_id ON tags(user_id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_recipes_updated_at
    BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
