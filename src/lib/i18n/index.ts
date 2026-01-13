import { en, type Translations } from "./translations/en";
import { de } from "./translations/de";

export type Locale = "en" | "de";

export const locales: Locale[] = ["en", "de"];

export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
};

export const defaultLocale: Locale = "en";

const translations: Record<Locale, Translations> = {
  en,
  de,
};

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations[defaultLocale];
}

// Helper to interpolate variables in translation strings
// e.g., t("scan.analyzeImages", { count: 3 }) -> "Analyze 3 Image(s)"
export function interpolate(
  template: string,
  variables: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return variables[key]?.toString() || `{${key}}`;
  });
}

// Category name mapping from database slugs/names to translation keys
const categoryKeyMap: Record<string, keyof Translations["categories"]> = {
  "appetizers": "appetizers",
  "main-course": "mainCourse",
  "main course": "mainCourse",
  "side-dishes": "sideDishes",
  "side dishes": "sideDishes",
  "desserts": "desserts",
  "beverages": "beverages",
  "breakfast": "breakfast",
  "snacks": "snacks",
  "soups-salads": "soupsSalads",
  "soups & salads": "soupsSalads",
};

// Helper to translate category names
export function translateCategoryName(
  categoryName: string,
  t: Translations
): string {
  const key = categoryKeyMap[categoryName.toLowerCase()];
  if (key && key in t.categories) {
    const value = t.categories[key as keyof typeof t.categories];
    if (typeof value === "string") {
      return value;
    }
  }
  return categoryName; // Return original if no translation found
}

export type { Translations };
