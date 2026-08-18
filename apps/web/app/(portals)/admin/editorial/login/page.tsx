'use client';

import { Suspense } from 'react';
import { PortalLoginForm } from '@/components/auth/portal-login-form';
import { BlogEditorialVisual } from '@/components/auth/auth-visuals';

function Form() {
  return (
    <PortalLoginForm
      portalId="editorial"
      variant="blog"
      overline="Blog Creative"
      title="Editorial"
      description="Draft, review, schedule & publish."
      visual={<BlogEditorialVisual />}
    />
  );
}

export default function EditorialLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-shell auth-shell--blog p-8 text-sm opacity-70">Loading…</main>
      }
    >
      <Form />
    </Suspense>
  );
}
