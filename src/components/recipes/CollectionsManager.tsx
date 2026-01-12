"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Library, Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CollectionWithCount {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
  recipe_count: number;
}

interface CollectionsManagerProps {
  initialCollections: CollectionWithCount[];
}

export function CollectionsManager({
  initialCollections,
}: CollectionsManagerProps) {
  const [collections, setCollections] =
    useState<CollectionWithCount[]>(initialCollections);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deleteCollection, setDeleteCollection] =
    useState<CollectionWithCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsCreating(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive",
      });
      setIsCreating(false);
      return;
    }

    const { data, error } = await supabase
      .from("collections")
      .insert({
        name: newName.trim(),
        description: newDescription.trim() || null,
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
    } else if (data) {
      setCollections([{ ...data, recipe_count: 0 }, ...collections]);
      setNewName("");
      setNewDescription("");
      setIsCreateOpen(false);
      toast({
        title: "Collection created",
        description: `"${data.name}" has been created`,
      });
    }

    setIsCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteCollection) return;

    setIsDeleting(true);

    // First delete recipe_collections associations
    await supabase
      .from("recipe_collections")
      .delete()
      .eq("collection_id", deleteCollection.id);

    // Then delete the collection
    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", deleteCollection.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete collection",
        variant: "destructive",
      });
    } else {
      setCollections(collections.filter((c) => c.id !== deleteCollection.id));
      toast({
        title: "Collection deleted",
        description: `"${deleteCollection.name}" has been deleted`,
      });
    }

    setIsDeleting(false);
    setDeleteCollection(null);
  };

  return (
    <>
      {/* Create button */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button className="bg-peach-300 hover:bg-peach-400 text-warm-gray-700 mb-6">
            <Plus className="w-4 h-4 mr-2" />
            New Collection
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
            <DialogDescription>
              Create a new collection to organize your recipes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Holiday Favorites"
                className="border-warm-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="A brief description of this collection..."
                className="border-warm-gray-200"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || !newName.trim()}
                className="bg-peach-300 hover:bg-peach-400 text-warm-gray-700"
              >
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Collections grid */}
      {collections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <Card
              key={collection.id}
              className="border-warm-gray-100 hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <Link
                    href={`/dashboard/collections/${collection.id}`}
                    className="flex items-center gap-2 hover:text-peach-600"
                  >
                    <Library className="w-5 h-5 text-peach-500" />
                    <h3 className="font-display text-lg text-warm-gray-700">
                      {collection.name}
                    </h3>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setDeleteCollection(collection)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {collection.description && (
                  <p className="text-warm-gray-500 text-sm mb-3 line-clamp-2">
                    {collection.description}
                  </p>
                )}
                <p className="text-sm text-peach-600">
                  {collection.recipe_count} recipe
                  {collection.recipe_count !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-warm-gray-100">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Library className="w-12 h-12 text-warm-gray-300 mb-4" />
            <h3 className="font-display text-lg text-warm-gray-700 mb-2">
              No collections yet
            </h3>
            <p className="text-warm-gray-500 text-sm mb-4">
              Create your first collection to organize your recipes.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteCollection}
        onOpenChange={() => setDeleteCollection(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Collection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteCollection?.name}
              &quot;?
              {deleteCollection && deleteCollection.recipe_count > 0 && (
                <span className="block mt-2">
                  The {deleteCollection.recipe_count} recipe
                  {deleteCollection.recipe_count !== 1 ? "s" : ""} in this
                  collection will not be deleted.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCollection(null)}>
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
