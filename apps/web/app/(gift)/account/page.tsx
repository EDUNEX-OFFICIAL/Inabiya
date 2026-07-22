'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken, type AuthUser } from '@/lib/auth-client';

type Address = {
  id: string;
  fullName: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login?next=/account');
      return;
    }
    Promise.all([apiAuth<AuthUser>('/auth/me'), apiAuth<Address[]>('/addresses')])
      .then(([u, a]) => {
        setUser(u);
        setDisplayName(u.displayName ?? '');
        setAddresses(a);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  async function saveProfile() {
    const u = await apiAuth<AuthUser>('/auth/me', {
      method: 'PATCH',
      json: { displayName },
    });
    setUser(u);
    setMsg('Profile saved');
  }

  if (!user) {
    return <main className="gift-page max-w-lg text-sm opacity-70">Loading account…</main>;
  }

  return (
    <main className="gift-page max-w-lg">
      <h1 className="gift-h1">Account</h1>
      <p className="mt-gs-1 text-sm opacity-70">{user.email}</p>

      <nav className="mt-gs-5 flex flex-wrap gap-gs-2 text-sm" aria-label="Account">
        <Link className="clay-chip hover:text-primary" href="/orders">
          Orders
        </Link>
        <Link className="clay-chip hover:text-primary" href="/gift/cart">
          Cart
        </Link>
        <Link className="clay-chip hover:text-primary" href="/gift">
          Store
        </Link>
      </nav>

      <section className="clay-panel mt-gs-6 p-gs-4 sm:p-gs-6" aria-labelledby="profile-heading">
        <h2 id="profile-heading" className="font-display text-xl sm:text-2xl">
          Profile
        </h2>
        <label className="mt-gs-3 block text-sm" htmlFor="displayName">
          Display name
          <input
            id="displayName"
            className="clay-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
          />
        </label>
        <button
          type="button"
          className="clay-btn mt-gs-4 w-full justify-center sm:w-auto"
          onClick={() => void saveProfile()}
        >
          Save
        </button>
        {msg ? (
          <p className="mt-gs-2 text-sm text-success" role="status">
            {msg}
          </p>
        ) : null}
      </section>

      <section className="mt-gs-6" aria-labelledby="addresses-heading">
        <h2 id="addresses-heading" className="gift-h2">
          Addresses
        </h2>
        <ul className="mt-gs-4 space-y-gs-3 text-sm">
          {addresses.length === 0 ? (
            <li className="clay-panel p-gs-4 opacity-80">
              No saved addresses yet — add one at checkout.
            </li>
          ) : (
            addresses.map((a) => (
              <li key={a.id} className="clay-card p-gs-4">
                <p className="font-medium">
                  {a.fullName}
                  {a.isDefault ? (
                    <span className="ml-gs-2 text-xs font-normal text-primary">default</span>
                  ) : null}
                </p>
                <p className="mt-gs-1 opacity-80">
                  {a.line1}, {a.city}, {a.state} {a.postalCode}
                </p>
                <p className="mt-gs-1 opacity-60">{a.phone}</p>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
