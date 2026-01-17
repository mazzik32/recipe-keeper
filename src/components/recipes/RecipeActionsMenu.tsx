"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreVertical, Edit, Trash2, FolderMinus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface RecipeActionsMenuProps {
    recipeId: string;
    onRemoveFromCollection?: () => Promise<void>;
}

export function RecipeActionsMenu({
    recipeId,
    onRemoveFromCollection,
}: RecipeActionsMenuProps) {
    const { t } = useLanguage();
    const { toast } = useToast();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    // General delete recipe handler (archives it)
    const handleDeleteRecipe = async () => {
        if (!confirm(t.recipes.confirmDelete)) return;

        setIsDeleting(true);
        const supabase = createClient();

        try {
            const { error } = await supabase
                .from("recipes")
                .update({ is_archived: true })
                .eq("id", recipeId);

            if (error) throw error;

            toast({
                title: t.common.success,
                description: t.recipes.recipeDeletedDesc || "Recipe moved to trash",
            });

            router.refresh();
        } catch (error) {
            console.error("Error deleting recipe:", error);
            toast({
                title: t.common.error,
                description: t.errors.deleteFailed,
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-white text-warm-gray-700"
                    onClick={(e) => e.preventDefault()} // Prevent link navigation from card
                >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem asChild>
                    <Link href={`/dashboard/recipes/${recipeId}/edit`} className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" />
                        {t.recipes.editRecipe}
                    </Link>
                </DropdownMenuItem>

                {onRemoveFromCollection && (
                    <DropdownMenuItem
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFromCollection();
                        }}
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                    >
                        <FolderMinus className="mr-2 h-4 w-4" />
                        {t.collections.removeFromCollection || "Remove from Collection"}
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRecipe();
                    }}
                    disabled={isDeleting}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t.recipes.deleteRecipe}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
