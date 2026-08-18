'use client';

import { Suspense } from 'react';
import { PortalLoginForm } from '@/components/auth/portal-login-form';
import { PlatformVisual } from '@/components/auth/auth-visuals';

function Form() {
  return (
    <PortalLoginForm
      portalId="platform"
      variant="ops"
      overline="Control plane"
      title="Platform"
      description="Flags, media & privileged tools."
      visual={<PlatformVisual />}
    />
  );
}

export default function PlatformLoginPage() {
  return (
    <Suspense
      fallback={<main className="auth-shell auth-shell--ops p-8 text-sm opacity-70">Loading…</main>}
    >
      <Form />
    </Suspense>
  );
}
