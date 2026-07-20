import Link from 'next/link';

/** Root index — shells only; product features come in later phases. */
export default function HomePage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Inabiya</h1>
      <p>Phase 0 platform foundation. Product surfaces live under route groups.</p>
      <ul>
        <li>
          <Link href="/gift">Gift storefront (System A)</Link>
        </li>
        <li>
          <Link href="/blog">Blog (System A)</Link>
        </li>
        <li>
          <Link href="/creator">Creator Collective (System B)</Link>
        </li>
        <li>
          <Link href="/admin/commerce">Admin — Commerce</Link>
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
