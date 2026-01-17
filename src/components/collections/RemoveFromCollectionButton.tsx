"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface RemoveFromCollectionButtonProps {
    collectionId: string;
    recipeId: string;
}

export function RemoveFromCollectionButton({
    collectionId,
    recipeId,
}: RemoveFromCollectionButtonProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useLanguage();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleRemove = async () => {
        if (!confirm(t.collections.confirmRemoveRecipe)) {
            return;
        }

        setIsDeleting(true);
        const supabase = createClient();

        try {
            const { error } = await supabase
                .from("recipe_collections")
                .delete()
                .eq("collection_id", collectionId)
                .eq("recipe_id", recipeId);

            if (error) throw error;

            toast({
                title: t.common.success,
                description: t.collections.recipeRemoved || "Recipe removed from collection",
            });

            router.refresh();
        } catch (error) {
            console.error("Error removing recipe from collection:", error);
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
        <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8 rounded-full shadow-sm hover:bg-destructive/90"
            onClick={handleRemove}
            disabled={isDeleting}
            title={t.collections.removeRecipe}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    );
}
