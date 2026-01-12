"use client";

import { useState } from "react";
import { Plus, X, Tag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TagWithCount {
  id: string;
  name: string;
  user_id: string;
  recipe_count: number;
}

interface TagsManagerProps {
  initialTags: TagWithCount[];
}

export function TagsManager({ initialTags }: TagsManagerProps) {
  const [tags, setTags] = useState<TagWithCount[]>(initialTags);
  const [newTagName, setNewTagName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTag, setDeleteTag] = useState<TagWithCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

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

    // Check for duplicate
    if (tags.some((t) => t.name.toLowerCase() === newTagName.toLowerCase())) {
      toast({
        title: "Tag exists",
        description: "A tag with this name already exists",
        variant: "destructive",
      });
      setIsCreating(false);
      return;
    }

    const { data, error } = await supabase
      .from("tags")
      .insert({ name: newTagName.trim(), user_id: user.id })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create tag",
        variant: "destructive",
      });
    } else if (data) {
      setTags([...tags, { ...data, recipe_count: 0 }]);
      setNewTagName("");
      toast({
        title: "Tag created",
        description: `"${data.name}" has been created`,
      });
    }

    setIsCreating(false);
  };

  const handleDeleteTag = async () => {
    if (!deleteTag) return;

    setIsDeleting(true);

    // First delete recipe_tags associations
    await supabase.from("recipe_tags").delete().eq("tag_id", deleteTag.id);

    // Then delete the tag
    const { error } = await supabase
      .from("tags")
      .delete()
      .eq("id", deleteTag.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete tag",
        variant: "destructive",
      });
    } else {
      setTags(tags.filter((t) => t.id !== deleteTag.id));
      toast({
        title: "Tag deleted",
        description: `"${deleteTag.name}" has been deleted`,
      });
    }

    setIsDeleting(false);
    setDeleteTag(null);
  };

  return (
    <>
      <Card className="border-warm-gray-100">
        <CardHeader>
          <CardTitle className="font-display text-xl text-warm-gray-700 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Your Tags ({tags.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create tag form */}
          <form onSubmit={handleCreateTag} className="flex gap-2">
            <Input
              placeholder="New tag name..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="border-warm-gray-200 max-w-xs"
            />
            <Button
              type="submit"
              disabled={isCreating || !newTagName.trim()}
              className="bg-peach-300 hover:bg-peach-400 text-warm-gray-700"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Tag
            </Button>
          </form>

          {/* Tags list */}
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="bg-peach-100 text-peach-700 px-3 py-1.5 text-sm gap-2"
                >
                  {tag.name}
                  <span className="text-peach-500">({tag.recipe_count})</span>
                  <button
                    onClick={() => setDeleteTag(tag)}
                    className="hover:bg-peach-200 rounded-full p-0.5 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-warm-gray-500 text-sm">
              No tags yet. Create your first tag above.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTag} onOpenChange={() => setDeleteTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTag?.name}&quot;?
              {deleteTag && deleteTag.recipe_count > 0 && (
                <span className="block mt-2 text-amber-600">
                  This tag is used by {deleteTag.recipe_count} recipe
                  {deleteTag.recipe_count !== 1 ? "s" : ""}.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTag(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTag}
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
