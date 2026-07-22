/** @type {import('next').NextConfig} */
const apiRewrite =
  process.env.API_REWRITE_URL?.replace(/\/$/, '') ||
  process.env.API_URL?.replace(/\/$/, '') ||
  'http://127.0.0.1:4001';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@inabiya/types', '@inabiya/validation'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'inabiya.edunexservices.in' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/gift/box',
        destination: '/gift/build-your-box',
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
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
