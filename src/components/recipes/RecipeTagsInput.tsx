"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { Tag } from "@/types/database.types";
import { useToast } from "@/hooks/use-toast";

interface RecipeTagsInputProps {
    value: string[];
    onChange: (value: string[]) => void;
}

export function RecipeTagsInput({ value, onChange }: RecipeTagsInputProps) {
    const { t } = useLanguage();
    const { toast } = useToast();
    const supabase = createClient();
    const [open, setOpen] = React.useState(false);
    const [tags, setTags] = React.useState<Tag[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");
    const [creating, setCreating] = React.useState(false);

    // Fetch tags on mount
    React.useEffect(() => {
        async function fetchTags() {
            setLoading(true);
            const { data, error } = await supabase
                .from("tags")
                .select("*")
                .order("name");

            if (!error && data) {
                setTags(data);
            }
            setLoading(false);
        }

        fetchTags();
    }, [supabase]);

    const handleSelect = (tagName: string) => {
        // Find tag ID if it exists
        const tag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());

        // For now, we store IDs in the form, so we need the ID.
        // However, if the user selects a new tag that doesn't exist yet, we might need to handle creation.
        // BUT, best practice for this component is: create immediately if new, then select.

        if (tag) {
            if (value.includes(tag.id)) {
                onChange(value.filter((id) => id !== tag.id));
            } else {
                onChange([...value, tag.id]);
            }
        }
        setOpen(false);
    };

    const createTag = async () => {
        if (!inputValue.trim()) return;

        setCreating(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast({
                title: t.common.error,
                description: t.auth.sessionExpired,
                variant: "destructive"
            });
            setCreating(false);
            return;
        }

        // Check if exists locally to avoid duplicate calls
        const existing = tags.find(t => t.name.toLowerCase() === inputValue.toLowerCase());
        if (existing) {
            handleSelect(existing.name);
            setCreating(false);
            return;
        }

        const { data, error } = await supabase
            .from("tags")
            .insert({ name: inputValue.trim(), user_id: user.id })
            .select()
            .single();

        if (error) {
            console.error(error);
            toast({
                title: t.common.error,
                description: t.errors.saveFailed,
                variant: "destructive"
            });
        } else if (data) {
            setTags(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
            onChange([...value, data.id]);
            setInputValue("");
            setOpen(false);
            toast({
                title: t.tags.tagCreated,
                description: t.tags.tagCreatedDesc.replace("{name}", data.name),
            });
        }
        setCreating(false);
    };

    const selectedTags = tags.filter(t => value.includes(t.id));

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="bg-peach-100 text-peach-700 hover:bg-peach-200">
                        {tag.name}
                        <button
                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSelect(tag.name);
                                }
                            }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            onClick={() => handleSelect(tag.name)}
                        >
                            <X className="h-3 w-3 text-peach-500 hover:text-peach-700" />
                            <span className="sr-only">Remove {tag.name}</span>
                        </button>
                    </Badge>
                ))}
            </div>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {t.tags.addTag}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                    <Command>
                        <CommandInput
                            placeholder={t.tags.newTagName}
                            onValueChange={setInputValue}
                        />
                        <CommandList>
                            <CommandEmpty>
                                <div className="p-2 flex flex-col items-center justify-center gap-2">
                                    <span className="text-sm text-muted-foreground">{t.tags.noTags}</span>
                                    {inputValue && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="w-full"
                                            onClick={createTag}
                                            disabled={creating}
                                        >
                                            {creating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                                            {t.common.add} "{inputValue}"
                                        </Button>
                                    )}
                                </div>
                            </CommandEmpty>
                            <CommandGroup heading={t.tags.yourTags}>
                                {tags.map((tag) => (
                                    <CommandItem
                                        key={tag.id}
                                        value={tag.name}
                                        onSelect={() => handleSelect(tag.name)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value.includes(tag.id) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {tag.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
