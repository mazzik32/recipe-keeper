"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Copy, Trash2, MoreHorizontal } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface RecipeActionsProps {
  recipeId: string;
  isFavorite: boolean;
}

export function RecipeActions({ recipeId, isFavorite }: RecipeActionsProps) {
  const router = useRouter();
  const { toggleFavorite, deleteRecipe, duplicateRecipe } = useRecipes();
  const [favorite, setFavorite] = useState(isFavorite);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
    </>
  );
}
