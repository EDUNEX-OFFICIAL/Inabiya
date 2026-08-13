import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';

/** Root index — shells only; product features come in later phases. */
export default function HomePage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <BrandLogo href={null} size="lg" />
      <p style={{ marginTop: '1rem' }}>
        Phase 1 identity — simple email/password auth (no third-party IdP).
      </p>
      <ul>
        <li>
          <Link href="/login">Login</Link>
        </li>
        <li>
          <Link href="/register">Register</Link>
        </li>
        <li>
          <Link href="/gift">Gift storefront (System A)</Link>
        </li>
        <li>
          <Link href="/articles">Journal / Articles</Link>
        </li>
        <li>
          <Link href="/creator">Creator Collective (System B)</Link>
        </li>
        <li>
          <Link href="/admin/commerce">Admin — Commerce</Link>
        </li>
        <li>
          <Link href="/admin/cms/pages">Admin — CMS (Soft Gift pages)</Link>
        </li>
        <li>
          <Link href="/admin/editorial">Admin — Editorial</Link>
        </li>
        <li>
          <Link href="/admin/creator">Admin — Creator</Link>
        </li>
        <li>
          <Link href="/admin/platform">Admin — Platform</Link>
        </li>
      </ul>
    </main>
  );
}
