"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Copy, Trash2, MoreHorizontal, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRecipes } from "@/hooks/useRecipes";
import { useCollections, type Collection } from "@/hooks/useCollections";
import { cn } from "@/lib/utils";

interface RecipeActionsProps {
  recipeId: string;
  isFavorite: boolean;
}

export function RecipeActions({ recipeId, isFavorite }: RecipeActionsProps) {
  const router = useRouter();
  const { toggleFavorite, deleteRecipe, duplicateRecipe } = useRecipes();
  const { getCollections, addToCollection } = useCollections();

  const [favorite, setFavorite] = useState(isFavorite);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Collections state
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);

  useEffect(() => {
    if (showCollectionDialog) {
      const fetchCollections = async () => {
        setIsLoadingCollections(true);
        const data = await getCollections();
        setCollections(data);
        setIsLoadingCollections(false);
      };
      fetchCollections();
    }
  }, [showCollectionDialog]);

  const handleToggleFavorite = async () => {
    const newValue = !favorite;
    setFavorite(newValue);
    const success = await toggleFavorite(recipeId, newValue);
    if (!success) {
      setFavorite(!newValue);
    }
  };

  const handleDuplicate = async () => {
    const newId = await duplicateRecipe(recipeId);
    if (newId) {
      router.push(`/dashboard/recipes/${newId}`);
    }
  };

  const handleAddToCollection = async (collectionId: string) => {
    await addToCollection(recipeId, collectionId);
    setShowCollectionDialog(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteRecipe(recipeId);
    if (success) {
      router.push("/dashboard");
      router.refresh();
    }
    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleToggleFavorite}
          className="border-peach-300 hover:bg-peach-50"
        >
          <Heart
            className={cn(
              "w-4 h-4",
              favorite ? "fill-coral-400 text-coral-400" : "text-warm-gray-500"
            )}
          />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="border-peach-300 hover:bg-peach-50"
            >
              <MoreHorizontal className="w-4 h-4 text-warm-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowCollectionDialog(true)}>
              <ListPlus className="w-4 h-4 mr-2" />
              Add to Collection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate Recipe
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Recipe
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recipe</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this recipe? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Collection Dialog */}
      <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Collection</DialogTitle>
            <DialogDescription>
              Choose a collection to add this recipe to.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoadingCollections ? (
              <div className="flex justify-center p-4">
                <div className="animate-pulse text-warm-gray-400">Loading collections...</div>
              </div>
            ) : collections.length === 0 ? (
              <p className="text-center text-warm-gray-500 py-4">
                No collections found. Create a collection first.
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {collections.map((collection) => (
                  <Button
                    key={collection.id}
                    variant="ghost"
                    className="w-full justify-start text-left font-normal"
                    onClick={() => handleAddToCollection(collection.id)}
                  >
                    <ListPlus className="w-4 h-4 mr-2 text-peach-500" />
                    <span className="truncate">{collection.name}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCollectionDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
