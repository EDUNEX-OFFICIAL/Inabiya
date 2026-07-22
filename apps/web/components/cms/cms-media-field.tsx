'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { apiUrl } from '@/lib/api-base';

type MediaAsset = {
  id: string;
  mimeType: string;
  originalName: string | null;
  publicUrl?: string;
  signedUrl?: string;
};

type Props = {
  value: string;
  onChange: (url: string) => void;
  /** Restrict library/upload to images (CMS default). */
  imagesOnly?: boolean;
};

export async function uploadCmsMediaFile(file: File): Promise<MediaAsset> {
  const token = getStoredAccessToken();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(apiUrl('/media'), {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: 'include',
    body: form,
  });
  const data = (await res.json().catch(() => ({}))) as MediaAsset & {
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(
      typeof data?.error?.message === 'string'
        ? data.error.message
        : `Upload failed (${res.status})`,
    );
  }
  return data;
}

export function MediaLibraryModal({
  open,
  onClose,
  onPick,
  imagesOnly = true,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (url: string) => void;
  imagesOnly?: boolean;
}) {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await apiAuth<{ items: MediaAsset[] }>('/media?limit=48');
    const list = data.items ?? [];
    setItems(imagesOnly ? list.filter((i) => i.mimeType.startsWith('image/')) : list);
  }, [imagesOnly]);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    void load().catch((e) => setErr(String((e as Error).message ?? e)));
  }, [open, load]);

  async function onUpload(file: File | null) {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const asset = await uploadCmsMediaFile(file);
      const url = asset.publicUrl ?? `/api/v1/media/${asset.id}/content`;
      onPick(url);
      onClose();
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal
      aria-label="Media library"
    >
      <div className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-lg bg-white p-4 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm">Media library</p>
          <button type="button" className="text-sm underline" onClick={onClose}>
            Close
          </button>
        </div>
        {err ? <p className="mt-2 text-xs text-red-600">{err}</p> : null}
        <label className="mt-3 inline-block cursor-pointer rounded border px-2 py-1 text-xs">
          Upload new
          <input
            type="file"
            className="hidden"
            accept={imagesOnly ? 'image/jpeg,image/png,image/webp,image/gif' : undefined}
            disabled={busy}
            onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
          />
        </label>
        <ul className="mt-4 grid grid-cols-3 gap-2">
          {items.map((row) => {
            const url = row.publicUrl ?? `/api/v1/media/${row.id}/content`;
            return (
              <li key={row.id}>
                <button
                  type="button"
                  className="w-full overflow-hidden rounded border text-left hover:ring-2 hover:ring-[var(--primary)]"
                  onClick={() => {
                    onPick(url);
                    onClose();
                  }}
                >
                  {row.mimeType.startsWith('image/') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" className="aspect-square w-full object-cover" />
                  ) : (
                    <div className="aspect-square bg-black/5 p-2 text-[10px]">PDF</div>
                  )}
                  <p className="truncate px-1 py-0.5 text-[10px] opacity-70">
                    {row.originalName ?? row.id.slice(0, 8)}
                  </p>
                </button>
              </li>
            );
          })}
          {items.length === 0 ? (
            <li className="col-span-3 text-xs opacity-60">No images yet — upload one.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

export function CmsMediaField({ value, onChange, imagesOnly = true }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onUpload(file: File | null) {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const asset = await uploadCmsMediaFile(file);
      const url = asset.publicUrl ?? `/api/v1/media/${asset.id}/content`;
      onChange(url);
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-1 space-y-2">
      <input
        className="block w-full rounded border px-2 py-1 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="/api/v1/media/…/content or https://…"
      />
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-20 max-w-full rounded border object-cover" />
      ) : null}
      <div className="flex flex-wrap gap-2">
        <label className="cursor-pointer rounded border px-2 py-1 text-xs hover:bg-black/5">
          Upload
          <input
            type="file"
            className="hidden"
            accept={imagesOnly ? 'image/jpeg,image/png,image/webp,image/gif' : undefined}
            disabled={busy}
            onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs hover:bg-black/5"
          disabled={busy}
          onClick={() => setOpen(true)}
        >
          Library
        </button>
        {value ? (
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs text-red-700 hover:bg-red-50"
            onClick={() => onChange('')}
          >
            Clear
          </button>
        ) : null}
      </div>
      {err ? <p className="text-xs text-red-600">{err}</p> : null}
      <MediaLibraryModal
        open={open}
        onClose={() => setOpen(false)}
        onPick={onChange}
        imagesOnly={imagesOnly}
      />
    </div>
  );
}
