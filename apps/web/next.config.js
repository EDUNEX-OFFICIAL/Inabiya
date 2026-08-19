/** @type {import('next').NextConfig} */
const apiRewrite =
  process.env.API_REWRITE_URL?.replace(/\/$/, '') ||
  process.env.API_URL?.replace(/\/$/, '') ||
  'http://127.0.0.1:4001';

// next dev uses eval-source-map; without 'unsafe-eval' the admin gate stays on
// "Checking access…" because React never hydrates. Prod `next start` does not need it.
const isDev = process.env.NODE_ENV !== 'production';
const googleScriptSrc =
  'https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.google.com https://connect.facebook.net';
const googleConnectSrc =
  'https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://ssl.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://stats.g.doubleclick.net https://www.google.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://connect.facebook.net https://www.facebook.com https://*.facebook.com';
const contentSecurityPolicy = [
  "default-src 'self'",
  "img-src 'self' data: https:",
  "media-src 'self' blob: https:",
  // Razorpay Checkout.js opens frames on api/checkout hosts
  `frame-src 'self' https://www.youtube-nocookie.com https://api.razorpay.com https://checkout.razorpay.com https://www.googletagmanager.com https://td.doubleclick.net https://www.facebook.com https://connect.facebook.net`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  isDev
    ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com ${googleScriptSrc}`
    : `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com ${googleScriptSrc}`,
  `connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com ${googleConnectSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
].join('; ');

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@inabiya/types', '@inabiya/validation'],
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 14,
    deviceSizes: [640, 750, 828, 1080, 1200, 1600],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'inabiya.edunexservices.in' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async redirects() {
    return [
      // Public journal is `/blog`. Keep old `/articles` links working.
      {
        source: '/articles',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/articles/:slug',
        destination: '/blog/:slug',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiRewrite}/api/v1/:path*`,
      },
    ];
  },
  async headers() {
    const longCache = 'public, max-age=2592000, stale-while-revalidate=86400';
    return [
      {
        source: '/brand/:path*',
        headers: [{ key: 'Cache-Control', value: longCache }],
      },
      {
        source: '/gift/media/:path*',
        headers: [{ key: 'Cache-Control', value: longCache }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
