'use client';

import { Suspense } from 'react';
import { PortalLoginForm } from '@/components/auth/portal-login-form';
import { GiftOpsVisual } from '@/components/auth/auth-visuals';

function Form() {
  return (
    <PortalLoginForm
      portalId="commerce"
      variant="ops"
      overline="Operations"
      title="Commerce Ops"
      description="Orders, inventory, support & reports."
      visual={
        <GiftOpsVisual
          kicker="Commerce Ops"
          headline="Run the gift desk with clarity"
          chips={['Orders', 'Stock', 'Support', 'Reports']}
        />
      }
    />
  );
}

export default function CommerceLoginPage() {
  return (
    <Suspense
      fallback={<main className="auth-shell auth-shell--ops p-8 text-sm opacity-70">Loading…</main>}
    >
      <Form />
    </Suspense>
  );
}
