// Unit conversion utilities for metric/imperial systems

export type MeasurementSystem = "metric" | "imperial";

interface UnitConversion {
  from: string;
  to: string;
  factor: number;
}

// Conversion factors (from -> to metric)
const toMetricConversions: UnitConversion[] = [
  // Volume
  { from: "tsp", to: "ml", factor: 5 },
  { from: "tbsp", to: "ml", factor: 15 },
  { from: "cup", to: "ml", factor: 240 },
  { from: "cups", to: "ml", factor: 240 },
  { from: "fl oz", to: "ml", factor: 30 },
  { from: "floz", to: "ml", factor: 30 },
  { from: "pint", to: "ml", factor: 473 },
  { from: "pt", to: "ml", factor: 473 },
  { from: "quart", to: "ml", factor: 946 },
  { from: "qt", to: "ml", factor: 946 },
  { from: "gallon", to: "l", factor: 3.785 },
  { from: "gal", to: "l", factor: 3.785 },
  // Weight
  { from: "oz", to: "g", factor: 28.35 },
  { from: "lb", to: "g", factor: 453.6 },
  { from: "lbs", to: "g", factor: 453.6 },
  { from: "pound", to: "g", factor: 453.6 },
  { from: "pounds", to: "g", factor: 453.6 },
  // Length
  { from: "inch", to: "cm", factor: 2.54 },
  { from: "in", to: "cm", factor: 2.54 },
  { from: "inches", to: "cm", factor: 2.54 },
];

// Conversion factors (from -> to imperial)
const toImperialConversions: UnitConversion[] = [
  // Volume
  { from: "ml", to: "fl oz", factor: 0.0338 },
  { from: "l", to: "cup", factor: 4.227 },
  // Weight
  { from: "g", to: "oz", factor: 0.0353 },
  { from: "kg", to: "lb", factor: 2.205 },
  // Length
  { from: "cm", to: "inch", factor: 0.3937 },
  { from: "m", to: "inch", factor: 39.37 },
];

// German unit aliases
const germanUnitAliases: Record<string, string> = {
  "el": "tbsp",
  "essl": "tbsp",
  "esslöffel": "tbsp",
  "tl": "tsp",
  "teelöffel": "tsp",
  "tasse": "cup",
  "tassen": "cups",
  "pfund": "lb",
  "zoll": "inch",
  "liter": "l",
  "gramm": "g",
  "kilogramm": "kg",
  "milliliter": "ml",
  "stück": "piece",
  "prise": "pinch",
  "spritzer": "dash",
  "zehe": "clove",
  "zehen": "cloves",
  "scheibe": "slice",
  "scheiben": "slices",
  "bund": "bunch",
  "dose": "can",
  "packung": "package",
};

// English unit aliases
const englishUnitAliases: Record<string, string> = {
  "teaspoon": "tsp",
  "teaspoons": "tsp",
  "tablespoon": "tbsp",
  "tablespoons": "tbsp",
  "ounce": "oz",
  "ounces": "oz",
  "pound": "lb",
  "pounds": "lb",
  "liter": "l",
  "liters": "l",
  "litre": "l",
  "litres": "l",
  "gram": "g",
  "grams": "g",
  "kilogram": "kg",
  "kilograms": "kg",
  "milliliter": "ml",
  "milliliters": "ml",
  "millilitre": "ml",
  "millilitres": "ml",
  "fluid ounce": "fl oz",
  "fluid ounces": "fl oz",
};

export function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase().trim();
  return germanUnitAliases[lower] || englishUnitAliases[lower] || lower;
}

export function convertUnit(
  value: number,
  fromUnit: string,
  toSystem: MeasurementSystem
): { value: number; unit: string } {
  const normalizedFrom = normalizeUnit(fromUnit);
  
  const conversions = toSystem === "metric" 
    ? toMetricConversions 
    : toImperialConversions;
  
  const conversion = conversions.find(
    (c) => c.from.toLowerCase() === normalizedFrom
  );
  
  if (conversion) {
    // Round to sensible precision
    const converted = value * conversion.factor;
    const rounded = converted < 10 
      ? Math.round(converted * 10) / 10 
      : Math.round(converted);
    return { value: rounded, unit: conversion.to };
  }
  
  // No conversion needed or unit not recognized
  return { value, unit: fromUnit };
}

// Check if a unit belongs to imperial system
export function isImperialUnit(unit: string): boolean {
  const normalized = normalizeUnit(unit);
  const imperialUnits = [
    "tsp", "tbsp", "cup", "cups", "fl oz", "floz", 
    "pint", "pt", "quart", "qt", "gallon", "gal",
    "oz", "lb", "lbs", "pound", "pounds",
    "inch", "in", "inches"
  ];
  return imperialUnits.includes(normalized);
}

// Check if a unit belongs to metric system
export function isMetricUnit(unit: string): boolean {
  const normalized = normalizeUnit(unit);
  const metricUnits = ["ml", "l", "g", "kg", "cm", "m"];
  return metricUnits.includes(normalized);
}

// Get display unit based on locale
export function getDisplayUnit(
  unit: string,
  locale: "en" | "de"
): string {
  const normalized = normalizeUnit(unit);
  
  if (locale === "de") {
    const deUnits: Record<string, string> = {
      "tsp": "TL",
      "tbsp": "EL",
      "cup": "Tasse",
      "cups": "Tassen",
      "lb": "Pfund",
      "inch": "Zoll",
      "piece": "Stück",
      "pieces": "Stück",
      "pinch": "Prise",
      "dash": "Spritzer",
      "clove": "Zehe",
      "cloves": "Zehen",
      "slice": "Scheibe",
      "slices": "Scheiben",
      "bunch": "Bund",
      "can": "Dose",
      "package": "Packung",
      "small": "klein",
      "medium": "mittel",
      "large": "groß",
    };
    return deUnits[normalized] || normalized;
  }
  
  return normalized;
}

// Convert all ingredients in a recipe to target measurement system
export function convertIngredients(
  ingredients: Array<{
    name: string;
    quantity?: number | null;
    unit?: string | null;
    notes?: string | null;
  }>,
  toSystem: MeasurementSystem
): Array<{
  name: string;
  quantity?: number | null;
  unit?: string | null;
  notes?: string | null;
}> {
  return ingredients.map((ing) => {
    if (!ing.quantity || !ing.unit) return ing;
    
    const normalized = normalizeUnit(ing.unit);
    const needsConversion = toSystem === "metric" 
      ? isImperialUnit(normalized)
      : isMetricUnit(normalized);
    
    if (!needsConversion) return ing;
    
    const { value, unit } = convertUnit(ing.quantity, ing.unit, toSystem);
    return {
      ...ing,
      quantity: value,
      unit,
    };
  });
}
