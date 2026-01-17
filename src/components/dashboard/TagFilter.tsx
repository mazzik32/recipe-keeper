"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface TagWithCount {
    id: string;
    name: string;
    count: number;
}

interface TagFilterProps {
    tags: TagWithCount[];
    selectedTagId: string | null;
    onSelectTag: (tagId: string | null) => void;
}

export function TagFilter({ tags, selectedTagId, onSelectTag }: TagFilterProps) {
    if (tags.length === 0) return null;

    return (
        <div className="mb-6">
            <ScrollArea className="w-full whitespace-nowrap pb-4">
                <div className="flex w-max space-x-2 p-1">
                    <Badge
                        variant={selectedTagId === null ? "default" : "outline"}
                        className={cn(
                            "cursor-pointer hover:bg-peach-200 hover:text-warm-gray-800 transition-colors px-4 py-1.5 text-sm font-medium rounded-full",
                            selectedTagId === null
                                ? "bg-peach-500 hover:bg-peach-600 text-white border-transparent"
                                : "border-warm-gray-200 text-warm-gray-600 bg-white"
                        )}
                        onClick={() => onSelectTag(null)}
                    >
                        All Recipes
                    </Badge>
                    {tags.map((tag) => (
                        <Badge
                            key={tag.id}
                            variant={selectedTagId === tag.id ? "default" : "outline"}
                            className={cn(
                                "cursor-pointer hover:bg-peach-200 hover:text-warm-gray-800 transition-colors px-4 py-1.5 text-sm font-medium rounded-full flex items-center gap-2",
                                selectedTagId === tag.id
                                    ? "bg-peach-500 hover:bg-peach-600 text-white border-transparent"
                                    : "border-warm-gray-200 text-warm-gray-600 bg-white"
                            )}
                            onClick={() =>
                                onSelectTag(selectedTagId === tag.id ? null : tag.id)
                            }
                        >
                            {tag.name}
                            <span
                                className={cn(
                                    "ml-1 text-xs rounded-full px-1.5 py-0.5",
                                    selectedTagId === tag.id
                                        ? "bg-white/20 text-white"
                                        : "bg-warm-gray-100 text-warm-gray-500"
                                )}
                            >
                                {tag.count}
                            </span>
                        </Badge>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
