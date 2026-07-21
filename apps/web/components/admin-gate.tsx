'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken, type AuthUser } from '@/lib/auth-client';

type Props = {
  children: ReactNode;
  /** Any of these roles (or SUPER_ADMIN via API) may enter */
  allow: string[];
  loginNext?: string;
};

export function AdminGate({ children, allow, loginNext = '/admin/commerce' }: Props) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(`/login?next=${encodeURIComponent(loginNext)}`);
      return;
    }
    const allowSet = new Set(allow);
    apiAuth<AuthUser>('/auth/me')
      .then((u) => {
        if (u.roles.includes('SUPER_ADMIN') || u.roles.some((r) => allowSet.has(r))) {
          setOk(true);
          return;
        }
        router.replace('/login?next=' + encodeURIComponent(loginNext));
      })
      .catch(() => router.replace(`/login?next=${encodeURIComponent(loginNext)}`));
    // allow identity via joined string — avoid new-array identity loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allow.join('|'), loginNext, router]);

  if (!ok) {
    return <main className="p-8 text-sm opacity-70">Checking access…</main>;
  }
  return <>{children}</>;
}
