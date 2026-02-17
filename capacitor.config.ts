import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.recipekeeper.app',
  appName: 'Recipekeeper.org',
  webDir: 'public',
  server: {
    url: 'https://mobile.recipekeeper.com',
    allowNavigation: [
      'mobile.recipekeeper.com',
      'recipe-keeper.derived.ch', // Keep old one just in case redirects happen
      '*.supabase.co'
    ]
  }
};

export default config;
