/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "data.recipekeeper.org",
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https://*.supabase.co https://data.recipekeeper.org",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co https://data.recipekeeper.org",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
