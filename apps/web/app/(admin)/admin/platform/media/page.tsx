'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken, type AuthUser } from '@/lib/auth-client';
import { apiUrl } from '@/lib/api-base';

type MediaAsset = {
  id: string;
  storageKey: string;
  bucket: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string | null;
  createdAt: string;
  publicUrl?: string;
  signedUrl?: string;
};

export default function PlatformMediaPage() {
  const router = useRouter();
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await apiAuth<{ items: MediaAsset[] }>('/media?limit=50');
    setItems(data.items);
  }, []);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login?next=/admin/platform/media');
      return;
    }
    apiAuth<AuthUser>('/auth/me')
      .then((u) => {
        const ok =
          u.roles.includes('SUPER_ADMIN') ||
          u.roles.includes('COMMERCE_ADMIN') ||
          u.roles.includes('CONTENT_ADMIN');
        if (!ok) throw new Error('Admin role required');
        return load();
      })
      .catch((e) => {
        setErr(String(e.message ?? e));
        if (String(e.message ?? e).includes('Admin')) {
          router.replace('/login?next=/admin/platform/media');
        }
      });
  }, [router, load]);

  async function onUpload(file: File | null) {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const token = getStoredAccessToken();
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(apiUrl('/media'), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: 'include',
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data?.error?.message === 'string'
            ? data.error.message
            : `Upload failed (${res.status})`,
        );
      }
      await load();
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    setBusy(true);
    setErr(null);
    try {
      await apiAuth(`/media/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen p-8 bg-[var(--background)] text-[var(--foreground)] max-w-3xl">
      <p className="text-sm opacity-70">
        <Link className="underline" href="/admin/platform">
          Platform
        </Link>{' '}
        / Media
      </p>
      <h1 className="font-display text-3xl mt-2">Media library</h1>
      <p className="mt-2 text-sm opacity-70">
        Files persist on local disk (`MEDIA_LOCAL_ROOT`). Images are public at{' '}
        <code className="text-xs">/api/v1/media/:id/content</code> for CMS / Soft Gift.
      </p>
      {err ? <p className="mt-4 text-sm text-red-600">{err}</p> : null}
      <div className="mt-6">
        <label className="text-sm font-medium block mb-2">Upload</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          disabled={busy}
          onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
        />
      </div>
      <ul className="mt-8 space-y-3 text-sm">
        {items.map((row) => {
          const publicUrl = row.publicUrl ?? `/api/v1/media/${row.id}/content`;
          return (
            <li key={row.id} className="border rounded p-3 space-y-1">
              <div className="flex gap-3">
                {row.mimeType.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={publicUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded object-cover border"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{row.originalName ?? row.storageKey}</p>
                  <p className="opacity-70">
                    {row.mimeType} · {row.sizeBytes} bytes
                  </p>
                  <p className="break-all text-xs opacity-80">{publicUrl}</p>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  className="underline"
                  onClick={() => {
                    void navigator.clipboard.writeText(publicUrl);
                  }}
                >
                  Copy public URL
                </button>
                <button
                  type="button"
                  className="underline text-red-700"
                  disabled={busy}
                  onClick={() => void onDelete(row.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
        {items.length === 0 ? <li className="opacity-60">No assets yet.</li> : null}
      </ul>
    </main>
  );
}
