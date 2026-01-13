"use client";

import { CollectionsManager } from "@/components/recipes/CollectionsManager";
import { useLanguage } from "@/contexts/LanguageContext";

interface CollectionWithCount {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
  recipe_count: number;
}

interface CollectionsPageContentProps {
  initialCollections: CollectionWithCount[];
}

export function CollectionsPageContent({ initialCollections }: CollectionsPageContentProps) {
  const { t } = useLanguage();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-gray-700 mb-2">
          {t.collections.title}
        </h1>
        <p className="text-warm-gray-500">
          {t.collections.description}
        </p>
      </div>

      <CollectionsManager initialCollections={initialCollections} />
    </div>
  );
}
