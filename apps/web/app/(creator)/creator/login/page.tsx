'use client';

import { Suspense } from 'react';
import { PortalLoginForm } from '@/components/auth/portal-login-form';
import { CreatorCollectiveVisual } from '@/components/auth/auth-visuals';

function Form() {
  return (
    <PortalLoginForm
      portalId="creator"
      variant="creator"
      overline="Creator Collective"
      title="Enter the studio"
      description="Campaigns, proposals & deliverables."
      visual={<CreatorCollectiveVisual />}
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
