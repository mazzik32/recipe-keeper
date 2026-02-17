import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.recipekeeper.app',
  appName: 'Recipe Keeper',
  webDir: 'public',
  server: {
    url: 'https://recipe-keeper.derived.ch', // TODO: Verify production URL
    allowNavigation: [
      'recipe-keeper.derived.ch',
      '*.supabase.co'
    ]
  }
};

export default config;
