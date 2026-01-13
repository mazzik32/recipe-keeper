"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateCategoryName } from "@/lib/i18n";
import type { Category } from "@/types/database.types";

interface CategoriesContentProps {
  categories: Category[];
  countMap: Record<string, number>;
}

export function CategoriesContent({ categories, countMap }: CategoriesContentProps) {
  const { locale, t } = useLanguage();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-gray-700 mb-2">
          {t.categories.title}
        </h1>
        <p className="text-warm-gray-500">
          {locale === "de" ? "Rezepte nach Kategorie durchsuchen." : "Browse recipes by category."}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories?.map((category) => (
          <Link key={category.id} href={`/dashboard/categories/${category.slug}`}>
            <Card className="border-warm-gray-100 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="font-display text-lg text-warm-gray-700 mb-1">
                  {translateCategoryName(category.name, t)}
                </h3>
                <p className="text-sm text-warm-gray-400">
                  {countMap[category.id] || 0} {locale === "de" ? "Rezepte" : "recipes"}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
