"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  type Locale,
  type Translations,
  defaultLocale,
  getTranslations,
  interpolate,
} from "@/lib/i18n";
import { type MeasurementSystem } from "@/lib/i18n/units";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  measurementSystem: MeasurementSystem;
  setMeasurementSystem: (system: MeasurementSystem) => void;
  t: Translations;
  // Helper for interpolation: ti("key.path", { count: 5 })
  ti: (key: string, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const LOCALE_STORAGE_KEY = "recipe-keeper-locale";
const MEASUREMENT_STORAGE_KEY = "recipe-keeper-measurement";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [measurementSystem, setMeasurementSystemState] =
    useState<MeasurementSystem>("metric");
  const [mounted, setMounted] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
    const savedMeasurement = localStorage.getItem(
      MEASUREMENT_STORAGE_KEY
    ) as MeasurementSystem;

    if (savedLocale && (savedLocale === "en" || savedLocale === "de")) {
      setLocaleState(savedLocale);
    } else {
      // Detect browser language
      const browserLang = navigator.language.split("-")[0];
      if (browserLang === "de") {
        setLocaleState("de");
      }
    }

    if (
      savedMeasurement &&
      (savedMeasurement === "metric" || savedMeasurement === "imperial")
    ) {
      setMeasurementSystemState(savedMeasurement);
    }

    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  }, []);

  const setMeasurementSystem = useCallback((system: MeasurementSystem) => {
    setMeasurementSystemState(system);
    localStorage.setItem(MEASUREMENT_STORAGE_KEY, system);
  }, []);

  const t = getTranslations(locale);

  // Helper function for interpolation
  const ti = useCallback(
    (key: string, variables?: Record<string, string | number>): string => {
      // Navigate nested keys like "scan.analyzeImages"
      const keys = key.split(".");
      let value: unknown = t;
      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          return key; // Key not found, return the key itself
        }
      }

      if (typeof value !== "string") return key;
      if (!variables) return value;

      return interpolate(value, variables);
    },
    [t]
  );

  // Prevent hydration mismatch by rendering null until mounted
  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        measurementSystem,
        setMeasurementSystem,
        t,
        ti,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

// Shorthand hook just for translations
export function useTranslation() {
  const { t, ti, locale } = useLanguage();
  return { t, ti, locale };
}
