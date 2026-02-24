/**
 * IAP product → credit mapping.
 * Product IDs here MUST match those registered in
 * App Store Connect (consumables) and Google Play Console.
 */
export const IAP_PRODUCTS: Record<string, { credits: number }> = {
  'org.recipekeeper.credits.20':  { credits: 20 },
  'org.recipekeeper.credits.50':  { credits: 50 },
  'org.recipekeeper.credits.200': { credits: 200 },
  'org.recipekeeper.credits.400': { credits: 400 },
} as const;

export function creditsForProduct(productId: string): number | null {
  return IAP_PRODUCTS[productId]?.credits ?? null;
}
