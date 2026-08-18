'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PortalLoginForm } from '@/components/auth/portal-login-form';
import { GiftCustomerVisual } from '@/components/auth/auth-visuals';
import { safeNextPath } from '@inabiya/validation';

function CustomerLogin() {
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));

  return (
    <PortalLoginForm
      portalId="customer"
      variant="gift"
      overline="Soft Gift"
      title="Welcome back"
      description={nextPath ? undefined : 'Save wishlists, track orders, checkout faster.'}
      visual={<GiftCustomerVisual />}
      footer={
        <>
          <p className="text-body opacity-75">
            <Link className="font-medium text-primary underline" href="/forgot-password">
              Forgot password?
            </Link>
          </p>
          <p className="text-body opacity-75">
            No account?{' '}
            <Link
              className="font-medium text-primary underline"
              href={nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : '/register'}
            >
              Register
            </Link>
          </p>
        </>
      }
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-shell auth-shell--gift p-gs-6 text-body opacity-70">Loading…</main>
      }
    >
      <CustomerLogin />
    </Suspense>
  );
}
