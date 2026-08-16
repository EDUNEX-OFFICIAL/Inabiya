'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { apiAuth, clearSession, loginUrl, type AuthUser } from '@/lib/auth-client';

type Props = {
  children: ReactNode;
  /** Any of these roles (or SUPER_ADMIN via API) may enter */
  allow: string[];
  /** Fallback when pathname is missing (should be rare). */
  loginNext?: string;
};

export function AdminGate({ children, allow, loginNext = '/admin/commerce' }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const allowSet = new Set(allow);
    const login = loginUrl(pathname || loginNext);
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 8000);
    const goLogin = () => {
      if (cancelled) return;
      clearSession();
      router.replace(login);
    };

    apiAuth<AuthUser>('/auth/me', { signal: ac.signal })
      .then((u) => {
        if (cancelled) return;
        if (u.roles.includes('SUPER_ADMIN') || u.roles.some((r) => allowSet.has(r))) {
          setOk(true);
          return;
        }
        goLogin();
      })
      .catch(() => goLogin())
      .finally(() => clearTimeout(timer));

    return () => {
      cancelled = true;
      ac.abort();
      clearTimeout(timer);
    };
    // allow identity via joined string — avoid new-array identity loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allow.join('|'), loginNext, router, pathname]);

  if (!ok) {
    return <main className="p-8 text-sm opacity-70">Checking access…</main>;
  }
  return <>{children}</>;
}
