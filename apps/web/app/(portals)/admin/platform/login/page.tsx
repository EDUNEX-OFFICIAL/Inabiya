'use client';

import { Suspense } from 'react';
import { PortalLoginForm } from '@/components/auth/portal-login-form';
import { GiftOpsVisual } from '@/components/auth/auth-visuals';

const DEMOS = [{ email: 'super@test.inabiya', note: 'Super admin' }] as const;

function Form() {
  return (
    <PortalLoginForm
      portalId="platform"
      variant="ops"
      overline="Control plane"
      title="Platform"
      description="Flags, media & privileged tools."
      visual={
        <GiftOpsVisual
          kicker="Platform"
          headline="High-trust controls, quiet surface"
          chips={['Flags', 'Media', 'Audit']}
        />
      }
      demos={DEMOS}
    />
  );
}

export default function PlatformLoginPage() {
  return (
    <Suspense fallback={<main className="auth-shell auth-shell--ops p-8 text-sm opacity-70">Loading…</main>}>
      <Form />
    </Suspense>
  );
}
