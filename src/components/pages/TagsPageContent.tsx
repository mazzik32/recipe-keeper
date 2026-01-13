"use client";

import { TagsManager } from "@/components/recipes/TagsManager";
import { useLanguage } from "@/contexts/LanguageContext";

interface TagWithCount {
  id: string;
  name: string;
  user_id: string;
  recipe_count: number;
}

interface TagsPageContentProps {
  initialTags: TagWithCount[];
}

export function TagsPageContent({ initialTags }: TagsPageContentProps) {
  const { t } = useLanguage();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-gray-700 mb-2">{t.tags.title}</h1>
        <p className="text-warm-gray-500">
          {t.tags.description}
        </p>
      </div>

      <TagsManager initialTags={initialTags} />
    </div>
  );
}
