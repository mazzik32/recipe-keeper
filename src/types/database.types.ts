export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string | null;
          order_index: number;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon?: string | null;
          order_index?: number;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon?: string | null;
          order_index?: number;
        };
      };
      recipes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          servings: number | null;
          prep_time_minutes: number | null;
          cook_time_minutes: number | null;
          total_time_minutes: number | null;
          difficulty: "easy" | "medium" | "hard";
          category_id: string | null;
          source: string | null;
          source_type: "family" | "cookbook" | "website" | "other";
          notes: string | null;
          is_favorite: boolean;
          is_archived: boolean;
          original_image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          servings?: number | null;
          prep_time_minutes?: number | null;
          cook_time_minutes?: number | null;
          difficulty?: "easy" | "medium" | "hard";
          category_id?: string | null;
          source?: string | null;
          source_type?: "family" | "cookbook" | "website" | "other";
          notes?: string | null;
          is_favorite?: boolean;
          is_archived?: boolean;
          original_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          servings?: number | null;
          prep_time_minutes?: number | null;
          cook_time_minutes?: number | null;
          difficulty?: "easy" | "medium" | "hard";
          category_id?: string | null;
          source?: string | null;
          source_type?: "family" | "cookbook" | "website" | "other";
          notes?: string | null;
          is_favorite?: boolean;
          is_archived?: boolean;
          original_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      recipe_ingredients: {
        Row: {
          id: string;
          recipe_id: string;
          name: string;
          quantity: number | null;
          unit: string | null;
          notes: string | null;
          order_index: number;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          name: string;
          quantity?: number | null;
          unit?: string | null;
          notes?: string | null;
          order_index?: number;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          name?: string;
          quantity?: number | null;
          unit?: string | null;
          notes?: string | null;
          order_index?: number;
        };
      };
      recipe_steps: {
        Row: {
          id: string;
          recipe_id: string;
          step_number: number;
          instruction: string;
          image_url: string | null;
          timer_minutes: number | null;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          step_number: number;
          instruction: string;
          image_url?: string | null;
          timer_minutes?: number | null;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          step_number?: number;
          instruction?: string;
          image_url?: string | null;
          timer_minutes?: number | null;
        };
      };
      recipe_images: {
        Row: {
          id: string;
          recipe_id: string;
          image_url: string;
          is_primary: boolean;
          caption: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          image_url: string;
          is_primary?: boolean;
          caption?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          image_url?: string;
          is_primary?: boolean;
          caption?: string | null;
          created_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
        };
      };
      recipe_tags: {
        Row: {
          recipe_id: string;
          tag_id: string;
        };
        Insert: {
          recipe_id: string;
          tag_id: string;
        };
        Update: {
          recipe_id?: string;
          tag_id?: string;
        };
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      recipe_collections: {
        Row: {
          recipe_id: string;
          collection_id: string;
        };
        Insert: {
          recipe_id: string;
          collection_id: string;
        };
        Update: {
          recipe_id?: string;
          collection_id?: string;
        };
      };
    };
  };
};

export type Recipe = Database["public"]["Tables"]["recipes"]["Row"];
export type RecipeInsert = Database["public"]["Tables"]["recipes"]["Insert"];
export type RecipeUpdate = Database["public"]["Tables"]["recipes"]["Update"];

export type RecipeIngredient = Database["public"]["Tables"]["recipe_ingredients"]["Row"];
export type RecipeStep = Database["public"]["Tables"]["recipe_steps"]["Row"];
export type RecipeImage = Database["public"]["Tables"]["recipe_images"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];

export type RecipeWithRelations = Recipe & {
  category?: Category | null;
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
  images?: RecipeImage[];
};
