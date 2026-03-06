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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com https://cdn.paddle.com https://sandbox-cdn.paddle.com",
              "style-src 'self' 'unsafe-inline' https://cdn.paddle.com https://sandbox-cdn.paddle.com",
              "img-src 'self' blob: data: https://*.supabase.co https://data.recipekeeper.org https://paddle.s3.amazonaws.com",
              "font-src 'self'",
              "frame-src 'self' https://challenges.cloudflare.com https://cdn.paddle.com https://sandbox-cdn.paddle.com https://checkout.paddle.com https://sandbox-checkout.paddle.com",
              "connect-src 'self' https://*.supabase.co https://data.recipekeeper.org https://challenges.cloudflare.com https://checkout.paddle.com https://sandbox-checkout.paddle.com https://api.paddle.com https://sandbox-api.paddle.com https://cdn.paddle.com https://sandbox-cdn.paddle.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
