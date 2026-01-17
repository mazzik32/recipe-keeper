"use client";

import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  user_id: string;
}

export function useCollections() {
  const { toast } = useToast();
  const supabase = createClient();

  const getCollections = async () => {
    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch collections",
        variant: "destructive",
      });
      return [];
    }

    return data as Collection[];
  };

  const createCollection = async (name: string, description?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("collections")
      .insert({
        name,
        description,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create collection",
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: "Collection created",
      description: `Collection "${name}" has been created`,
    });

    return data;
  };

  const addToCollection = async (recipeId: string, collectionId: string) => {
    // Check if valid UUIDs
    if (!recipeId || !collectionId) return false;

    // Check if already in collection
    const { data: existing } = await supabase
      .from("recipe_collections")
      .select("*")
      .eq("recipe_id", recipeId)
      .eq("collection_id", collectionId)
      .single();

    if (existing) {
      toast({
        title: "Already in collection",
        description: "This recipe is already in the selected collection",
      });
      return true;
    }

    const { error } = await supabase
      .from("recipe_collections")
      .insert({
        recipe_id: recipeId,
        collection_id: collectionId,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add recipe to collection",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Added to collection",
      description: "Recipe has been added to the collection",
    });
    return true;
  };

  return {
    getCollections,
    createCollection,
    addToCollection,
  };
}
