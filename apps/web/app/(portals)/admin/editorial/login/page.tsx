'use client';

import { Suspense } from 'react';
import { PortalLoginForm } from '@/components/auth/portal-login-form';
import { BlogEditorialVisual } from '@/components/auth/auth-visuals';

const DEMOS = [
  { email: 'writer@test.inabiya', note: 'Writer' },
  { email: 'seo@test.inabiya', note: 'SEO editor' },
  { email: 'medical@test.inabiya', note: 'Medical reviewer' },
  { email: 'finance@test.inabiya', note: 'Finance' },
  { email: 'content@test.inabiya', note: 'Content admin' },
  { email: 'super@test.inabiya', note: 'Super admin' },
] as const;

function Form() {
  return (
    <PortalLoginForm
      portalId="editorial"
      variant="blog"
      overline="Blog Creative"
      title="Editorial"
      description="Draft, review, schedule & publish."
      visual={<BlogEditorialVisual />}
      demos={DEMOS}
    />
  );
}

export default function EditorialLoginPage() {
  return (
    <Suspense fallback={<main className="auth-shell auth-shell--blog p-8 text-sm opacity-70">Loading…</main>}>
      <Form />
    </Suspense>
  );
}
