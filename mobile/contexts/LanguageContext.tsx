import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- TRANSLATION DICTIONARIES ---

export const en = {
    common: {
        appName: "Recipe Keeper",
        loading: "Loading...",
        error: "Error",
        success: "Success",
        cancel: "Cancel",
        save: "Save",
        delete: "Delete",
        edit: "Edit",
        add: "Add",
        remove: "Remove",
        search: "Search",
        back: "Back",
        next: "Next",
        previous: "Previous",
        close: "Close",
        confirm: "Confirm",
        tryAgain: "Try Again",
        yes: "Yes",
        no: "No",
        or: "or",
        and: "and",
        optional: "optional",
        required: "required",
    },
    auth: {
        login: "Sign In",
        signup: "Sign Up",
        logout: "Sign Out",
    },
    nav: {
        home: "Home",
        search: "Search",
        add: "Add",
        favorites: "Favorites",
        settings: "Settings",
        preferences: "Preferences",
        appLanguage: "App Language",
        pushNotifications: "Push Notifications",
        darkMode: "Dark Mode",
        supportLegal: "Support & Legal",
        privacyPolicy: "Privacy Policy",
        termsOfService: "Terms of Service",
        signOut: "Sign Out",
        account: "Account",
        credits: "Credits",
        myRecipes: "My Recipes",
        allRecipes: "All Recipes",
    },
    recipes: {
        title: "Recipe",
        recipes: "Recipes",
        newRecipe: "New Recipe",
        recipeTitle: "Recipe Title",
        description: "Description",
        ingredients: "Ingredients",
        instructions: "Instructions",
        prepTime: "Prep Time",
        cookTime: "Cook Time",
        totalTime: "Total Time",
        servings: "Servings",
        difficulty: "Difficulty",
        category: "Category",
        notes: "Notes",
        from: "From",
        easy: "Easy",
        medium: "Medium",
        hard: "Hard",
        dashboardSubtitle: "Your collection of family recipes, all in one place.",
        noRecipes: "No recipes found. Start adding some!",
    },
    categories: {
        title: "Categories",
        allCategories: "All Categories",
        appetizers: "Appetizers",
        mainCourse: "Main Course",
        sideDishes: "Side Dishes",
        desserts: "Desserts",
        beverages: "Beverages",
        breakfast: "Breakfast",
        snacks: "Snacks",
        soupsSalads: "Soups & Salads",
    },
    search: {
        searchRecipes: "Search recipes...",
        byIngredientsOrTitle: "Search by title or ingredient...",
    },
    add: {
        addRecipeTitle: "Add New Recipe",
        scanRecipe: "Scan Recipe Image",
        chooseFromLibrary: "Choose from Library",
        takePhoto: "Take Photo",
        analyzing: "Analyzing Recipe...",
        addFromUrl: "Add from URL",
        enterUrl: "Enter Recipe URL",
        urlPlaceholder: "https://example.com/...",
        scrape: "Extract Recipe",
        reviewSave: "Review & Save",
        recipeTitle: "Recipe Title",
        selectCategory: "Select Category",
        difficulty: "Difficulty",
        saveRecipe: "Save Recipe",
        ingredientName: "Name",
        amount: "Qty",
        unit: "Unit",
        instruction: "Instruction",
    },
    errors: {
        notFound: "Page not found",
    }
};

export type Translations = typeof en;

export const de: Translations = {
    common: {
        appName: "Rezeptsammlung",
        loading: "Laden...",
        error: "Fehler",
        success: "Erfolgreich",
        cancel: "Abbrechen",
        save: "Speichern",
        delete: "Löschen",
        edit: "Bearbeiten",
        add: "Hinzufügen",
        remove: "Entfernen",
        search: "Suchen",
        back: "Zurück",
        next: "Weiter",
        previous: "Zurück",
        close: "Schließen",
        confirm: "Bestätigen",
        tryAgain: "Erneut versuchen",
        yes: "Ja",
        no: "Nein",
        or: "oder",
        and: "und",
        optional: "optional",
        required: "erforderlich",
    },
    auth: {
        login: "Anmelden",
        signup: "Registrieren",
        logout: "Abmelden",
    },
    nav: {
        home: "Start",
        search: "Suchen",
        add: "Hinzufügen",
        favorites: "Favoriten",
        settings: "Einstellungen",
        preferences: "Einstellungen",
        appLanguage: "App-Sprache",
        pushNotifications: "Push-Benachrichtigungen",
        darkMode: "Dunkelmodus",
        supportLegal: "Support & Rechtliches",
        privacyPolicy: "Datenschutzerklärung",
        termsOfService: "Nutzungsbedingungen",
        signOut: "Abmelden",
        account: "Konto",
        credits: "Guthaben",
        myRecipes: "Meine Rezepte",
        allRecipes: "Alle Rezepte",
    },
    recipes: {
        title: "Rezept",
        recipes: "Rezepte",
        newRecipe: "Neues Rezept",
        recipeTitle: "Rezeptname",
        description: "Beschreibung",
        ingredients: "Zutaten",
        instructions: "Zubereitung",
        prepTime: "Vorbereitungszeit",
        cookTime: "Kochzeit",
        totalTime: "Gesamtzeit",
        servings: "Portionen",
        difficulty: "Schwierigkeit",
        category: "Kategorie",
        notes: "Notizen",
        from: "Von",
        easy: "Einfach",
        medium: "Mittel",
        hard: "Schwer",
        dashboardSubtitle: "Deine Sammlung von Familienrezepten, alle an einem Ort.",
        noRecipes: "Keine Rezepte gefunden. Fange an, welche hinzuzufügen!",
    },
    categories: {
        title: "Kategorien",
        allCategories: "Alle Kategorien",
        appetizers: "Vorspeisen",
        mainCourse: "Hauptgerichte",
        sideDishes: "Beilagen",
        desserts: "Desserts",
        beverages: "Getränke",
        breakfast: "Frühstück",
        snacks: "Snacks",
        soupsSalads: "Suppen & Salate",
    },
    search: {
        searchRecipes: "Rezepte suchen...",
        byIngredientsOrTitle: "Nach Titel oder Zutat suchen...",
    },
    add: {
        addRecipeTitle: "Neues Rezept hinzufügen",
        scanRecipe: "Rezeptbild scannen",
        chooseFromLibrary: "Aus Mediathek wählen",
        takePhoto: "Foto aufnehmen",
        analyzing: "Rezept wird analysiert...",
        addFromUrl: "Über URL hinzufügen",
        enterUrl: "Rezept-URL eingeben",
        urlPlaceholder: "https://beispiel.de...",
        scrape: "Rezept extrahieren",
        reviewSave: "Überprüfen & Speichern",
        recipeTitle: "Rezeptname",
        selectCategory: "Kategorie auswählen",
        difficulty: "Schwierigkeit",
        saveRecipe: "Rezept speichern",
        ingredientName: "Name",
        amount: "Menge",
        unit: "Einheit",
        instruction: "Anweisung",
    },
    errors: {
        notFound: "Seite nicht gefunden",
    }
};

// --- CONTEXT SETUP ---

export type Locale = "en" | "de";

type MeasurementSystem = "metric" | "imperial";

interface LanguageContextType {
    locale: Locale;
    setLanguage: (locale: Locale) => void;
    t: Translations;
    ti: (key: string, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = "recipe-keeper-locale-mobile";

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("en");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        async function loadPreferences() {
            try {
                const savedLocale = await AsyncStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
                if (savedLocale && (savedLocale === "en" || savedLocale === "de")) {
                    setLocaleState(savedLocale);
                }
            } catch (e) {
                console.warn('Failed to load locale preference', e);
            } finally {
                setMounted(true);
            }
        }
        loadPreferences();
    }, []);

    const setLanguage = useCallback(async (newLocale: Locale) => {
        setLocaleState(newLocale);
        try {
            await AsyncStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
        } catch (e) {
            console.warn('Failed to save locale preference', e);
        }
    }, []);

    const t = locale === 'de' ? de : en;

    // Helper function for deep interpolation
    const ti = useCallback(
        (key: string, variables?: Record<string, string | number>): string => {
            const keys = key.split(".");
            let value: any = t;
            for (const k of keys) {
                if (value && typeof value === "object" && k in value) {
                    value = value[k];
                } else {
                    return key;
                }
            }

            if (typeof value !== "string") return key;
            if (!variables) return value;

            return value.replace(/\{(\w+)\}/g, (_, k) => {
                return variables[k]?.toString() || `{${k}}`;
            });
        },
        [t]
    );

    if (!mounted) {
        return null;
    }

    return (
        <LanguageContext.Provider value={{ locale, setLanguage, t, ti }}>
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
