"use client";

import Link from "next/link";
import { Plus, Camera, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface AddRecipeButtonProps {
    className?: string;
    onSelect?: () => void;
}

export function AddRecipeButton({ className, onSelect }: AddRecipeButtonProps) {
    const { t, locale } = useLanguage();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    className={cn(
                        "w-full flex items-center justify-start gap-3 px-4 py-6 rounded-xl bg-peach-300 hover:bg-peach-400 text-warm-gray-700 font-medium transition-colors mb-4",
                        className
                    )}
                >
                    <Plus className="w-5 h-5" />
                    <span>{t.nav.addRecipe}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuItem asChild>
                    <Link
                        href="/dashboard/recipes/new"
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={onSelect}
                    >
                        <PenTool className="w-4 h-4" />
                        <span>{locale === "de" ? "Manuell erstellen" : "Create manually"}</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        href="/dashboard/scan"
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={onSelect}
                    >
                        <Camera className="w-4 h-4" />
                        <span>{t.nav.scanRecipe}</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
