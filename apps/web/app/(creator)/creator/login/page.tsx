'use client';

import { Suspense } from 'react';
import { PortalLoginForm } from '@/components/auth/portal-login-form';
import { CreatorCollectiveVisual } from '@/components/auth/auth-visuals';

const DEMOS = [
  { email: 'creator@test.inabiya', note: 'Creator' },
  { email: 'brand@test.inabiya', note: 'Brand' },
  { email: 'super@test.inabiya', note: 'Super admin' },
] as const;

function Form() {
  return (
    <PortalLoginForm
      portalId="creator"
      variant="creator"
      overline="Creator Collective"
      title="Enter the studio"
      description="Campaigns, proposals & deliverables."
      visual={<CreatorCollectiveVisual />}
      demos={DEMOS}
    />
  );
}

export default function CreatorLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-shell auth-shell--creator p-8 text-sm opacity-70">Loading…</main>
      }
    >
      <Form />
    </Suspense>
  );
}
