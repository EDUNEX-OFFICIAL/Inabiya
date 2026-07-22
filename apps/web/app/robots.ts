import type { MetadataRoute } from 'next';
import { getSiteOrigin } from '@/lib/cms-seo';

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/account',
          '/checkout',
          '/orders',
          '/gift/cart',
          '/gift/wishlist',
          '/gift/build-your-box',
          '/pages/preview',
          '/pages/preview/',
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
