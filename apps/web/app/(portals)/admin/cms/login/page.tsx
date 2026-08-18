'use client';

import { Suspense } from 'react';
import { PortalLoginForm } from '@/components/auth/portal-login-form';
import { GiftOpsVisual } from '@/components/auth/auth-visuals';

const DEMOS = [
  { email: 'content@test.inabiya', note: 'Content admin' },
  { email: 'commerce@test.inabiya', note: 'Commerce admin' },
  { email: 'super@test.inabiya', note: 'Super admin' },
] as const;

function Form() {
  return (
    <PortalLoginForm
      portalId="cms"
      variant="ops"
      overline="Soft Gift"
      title="CMS"
      description="Pages, collections & storefront content."
      visual={
        <GiftOpsVisual
          kicker="Soft Gift CMS"
          headline="Compose pages without breaking the brand"
          chips={['Pages', 'Blocks', 'Collections', 'Preview']}
        />
      }
      demos={DEMOS}
    />
  );
}

export default function CmsLoginPage() {
  return (
    <Suspense
      fallback={<main className="auth-shell auth-shell--ops p-8 text-sm opacity-70">Loading…</main>}
    >
      <Form />
    </Suspense>
  );
}
