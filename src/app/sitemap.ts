import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  // Base public URLs
  const routes = [
    '',
    '/login',
    '/signup',
    '/forgot-password',
    '/terms',
    '/privacy'
  ].map((route) => ({
    url: `https://recipekeeper.org${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
