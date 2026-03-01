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
        done: "Done",
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
        myCollection: "My Collection",
        familyRecipes: "Family Recipes",
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
        editRecipe: "Edit Recipe",
        deleteRecipe: "Delete Recipe",
        confirmDeleteTitle: "Delete Recipe?",
        confirmDeleteMessage: "Are you sure? This cannot be undone.",
        recipeDeleted: "Recipe deleted",
        updateRecipe: "Update Recipe",
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
        maxImages: "Max 5 images",
        addMore: "Add More",
        clearAll: "Clear All",
        maxReached: "Maximum of 5 images reached",
        images: "images",
        writeManually: "Write Manually",
    },
    errors: {
        notFound: "Page not found",
    },
    tags: {
        tags: "Tags",
        addTag: "+ Add Tag",
        newTagName: "New tag name...",
        noTags: "No tags yet. Create your first tag above.",
        yourTags: "Your Tags",
        tagUsedBy: "This tag is used by {count} recipe(s).",
        tagCreated: "Tag created",
        tagCreatedDesc: '"{name}" has been created',
        tagDeleted: "Tag deleted",
        tagDeletedDesc: '"{name}" has been deleted',
        tagExists: "A tag with this name already exists",
        manageTags: "Manage Tags",
    },
    loadingMessages: [
        "Chopping virtual onions...",
        "Arguing with the AI about salt...",
        "Teaching the robot to fold in the cheese...",
        "Translating Granny's handwriting...",
        "Baking the bytes...",
        "Sifting through the digital flour...",
        "Preheating the server oven...",
        "Finding the missing teaspoon...",
        "Kneading the data into shape...",
        "Whisking up something delicious...",
        "Simmering the code for extra flavor...",
        "Checking if the cake is a lie...",
        "Waiting for the dough to rise...",
        "Consulting the head chef algorithm...",
        "Tasting the pixel soup..."
    ],
    iap: {
        buyCredits: "Buy Credits",
        purchase: "Purchase {credits} Credits",
        confirmPurchase: "Are you sure you want to buy {credits} credits for {price}?",
    },
    onboarding: {
        welcome: "Welcome to Recipe Keeper",
        welcomeDesc: "Your personal digital cookbook. Let's get started!",
        scan: "AI Recipe Scanner",
        scanDesc: "Snap a photo of any recipe, and our AI will extract the ingredients and instructions for you.",
        credits: "Scan Credits",
        creditsDesc: "You get 5 free scans to start! You can always buy more credits later if you need them.",
        organize: "Search & Organize",
        organizeDesc: "Easily find your recipes with powerful search, tags, and custom collections.",
        offline: "Offline Storage",
        offlineDesc: "Enable offline storage in Settings to access all your recipes even without an internet connection.",
        getStarted: "Let's Start Cooking!",
        next: "Next",
    },
    settings: {
        offlineStorage: "Offline Recipe Storage",
        offlineStorageDesc: "Download all recipes for offline viewing",
        removeDownloads: "Remove Downloads",
        removeDownloadsDesc: "Clear all offline cached recipe details",
        confirmRemoveDownloadsTitle: "Remove Downloads",
        confirmRemoveDownloadsDesc: "Are you sure you want to remove all offline recipe data? (Your recipes remain safely in the cloud).",
        downloadsRemoved: "Downloads Removed",
        deleteAccount: "Delete Account",
        deleteAccountConfirmTitle: "Delete Account?",
        deleteAccountConfirmDesc: "Are you sure you want to delete your account? This action is irreversible and will remove all your data.",
    },
    pdf: {},
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
        done: "Fertig",
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
        myCollection: "Meine Sammlung",
        familyRecipes: "Familienrezepte",
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
        editRecipe: "Rezept bearbeiten",
        deleteRecipe: "Rezept löschen",
        confirmDeleteTitle: "Rezept löschen?",
        confirmDeleteMessage: "Bist du sicher? Dies kann nicht rückgängig gemacht werden.",
        recipeDeleted: "Rezept gelöscht",
        updateRecipe: "Rezept aktualisieren",
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
        maxImages: "Max. 5 Bilder",
        addMore: "Weitere hinzufügen",
        clearAll: "Alle löschen",
        maxReached: "Maximum von 5 Bildern erreicht",
        images: "Bilder",
        writeManually: "Manuell eingeben",
    },
    errors: {
        notFound: "Seite nicht gefunden",
    },
    tags: {
        tags: "Tags",
        addTag: "+ Tag hinzufügen",
        newTagName: "Neuer Tag-Name...",
        noTags: "Noch keine Tags. Erstelle oben deinen ersten Tag.",
        yourTags: "Deine Tags",
        tagUsedBy: "Dieser Tag wird von {count} Rezept(en) verwendet.",
        tagCreated: "Tag erstellt",
        tagCreatedDesc: '"{name}" wurde erstellt',
        tagDeleted: "Tag gelöscht",
        tagDeletedDesc: '"{name}" wurde gelöscht',
        tagExists: "Ein Tag mit diesem Namen existiert bereits",
        manageTags: "Tags verwalten",
    },
    loadingMessages: [
        "Schneide virtuelle Zwiebeln...",
        "Diskutiere mit der KI über Salz...",
        "Bringe dem Roboter das Unterheben bei...",
        "Entzifere Omas Handschrift...",
        "Backe die Bytes...",
        "Siebe das digitale Mehl...",
        "Heize den Server-Ofen vor...",
        "Suche den fehlenden Teelöffel...",
        "Knete die Daten in Form...",
        "Schlage etwas Leckeres auf...",
        "Lasse den Code für mehr Geschmack köcheln...",
        "Prüfe, ob der Kuchen eine Lüge ist...",
        "Warte darauf, dass der Teig aufgeht...",
        "Konsultiere den Chefkoch-Algorithmus...",
        "Probiere die Pixel-Suppe..."
    ],
    iap: {
        buyCredits: "Guthaben kaufen",
        purchase: "{credits} Guthaben kaufen",
        confirmPurchase: "Möchtest du wirklich {credits} Guthaben für {price} kaufen?",
    },
    onboarding: {
        welcome: "Willkommen bei Recipe Keeper",
        welcomeDesc: "Dein persönliches digitales Kochbuch. Lass uns loslegen!",
        scan: "KI-Rezept-Scanner",
        scanDesc: "Mache ein Foto von einem Rezept, und unsere KI extrahiert die Zutaten und Anleitungen für dich.",
        credits: "Scan-Guthaben",
        creditsDesc: "Du erhältst 5 kostenlose Scans zum Start! Du kannst später jederzeit weiteres Guthaben kaufen.",
        organize: "Suchen & Organisieren",
        organizeDesc: "Finde deine Rezepte ganz einfach mit der leistungsstarken Suche, Tags und eigenen Sammlungen.",
        offline: "Offline-Speicher",
        offlineDesc: "Aktiviere den Offline-Speicher in den Einstellungen, um auch ohne Internetverbindung auf alle deine Rezepte zuzugreifen.",
        getStarted: "Lass uns kochen!",
        next: "Weiter",
    },
    settings: {
        offlineStorage: "Offline-Rezeptspeicher",
        offlineStorageDesc: "Alle Rezepte für die Offline-Nutzung herunterladen",
        removeDownloads: "Downloads entfernen",
        removeDownloadsDesc: "Alle offline zwischengespeicherten Rezeptdetails löschen",
        confirmRemoveDownloadsTitle: "Downloads entfernen",
        confirmRemoveDownloadsDesc: "Bist du sicher, dass du alle Offline-Rezeptdaten löschen möchtest? (Deine Rezepte bleiben sicher in der Cloud).",
        downloadsRemoved: "Downloads entfernt",
        deleteAccount: "Konto löschen",
        deleteAccountConfirmTitle: "Konto löschen?",
        deleteAccountConfirmDesc: "Bist du sicher, dass du dein Konto löschen möchtest? Diese Aktion ist unwiderruflich und alle deine Daten werden gelöscht.",
    },
    pdf: {},
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
