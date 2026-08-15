'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiAuth, apiAuthUpload } from '@/lib/auth-client';
import { parseAmbientVideoUrl, youtubePosterUrl } from '@/lib/product-video';

export type MediaAsset = {
  id: string;
  mimeType: string;
  originalName: string | null;
  altText?: string | null;
  publicUrl?: string;
  signedUrl?: string;
};

export type MediaPick = {
  url: string;
  altText?: string | null;
  id?: string;
  originalName?: string | null;
};

type Props = {
  value: string;
  onChange: (url: string) => void;
  /** Restrict library/upload to images (CMS default). */
  imagesOnly?: boolean;
  /** Inspector preview: treat YouTube / .mp4 as video, not a broken image. */
  allowVideo?: boolean;
};

const CMS_IMAGE_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml,.svg,.jpg,.jpeg,.png,.webp,.gif,.avif';

export async function uploadCmsMediaFile(file: File): Promise<MediaAsset> {
  const form = new FormData();
  form.append('file', file);
  return apiAuthUpload<MediaAsset>('/media', form);
}

function assetUrl(row: MediaAsset): string {
  return row.publicUrl ?? `/api/v1/media/${row.id}/content`;
}

export function MediaLibraryModal({
  open,
  onClose,
  onPick,
  imagesOnly = true,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (pick: MediaPick) => void;
  imagesOnly?: boolean;
}) {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftAlt, setDraftAlt] = useState('');
  const [draftName, setDraftName] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  const load = useCallback(async () => {
    const data = await apiAuth<{ items: MediaAsset[] }>('/media?limit=48');
    const list = data.items ?? [];
    setItems(imagesOnly ? list.filter((i) => i.mimeType.startsWith('image/')) : list);
  }, [imagesOnly]);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setSelectedId(null);
    void load().catch((e) => setErr(String((e as Error).message ?? e)));
  }, [open, load]);

  useEffect(() => {
    if (!selected) {
      setDraftAlt('');
      setDraftName('');
      return;
    }
    setDraftAlt(selected.altText ?? '');
    setDraftName(selected.originalName ?? '');
  }, [selected]);

  function selectRow(row: MediaAsset) {
    setSelectedId(row.id);
  }

  async function saveMeta() {
    if (!selected) return;
    setSavingMeta(true);
    setErr(null);
    try {
      const updated = await apiAuth<MediaAsset>(`/media/${selected.id}`, {
        method: 'PATCH',
        json: {
          altText: draftAlt.trim() || null,
          originalName: draftName.trim() || null,
        },
      });
      setItems((prev) => prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)));
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    } finally {
      setSavingMeta(false);
    }
  }

  function useSelected() {
    if (!selected) return;
    onPick({
      url: assetUrl(selected),
      altText: (draftAlt.trim() || selected.altText) ?? null,
      id: selected.id,
      originalName: (draftName.trim() || selected.originalName) ?? null,
    });
    onClose();
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const asset = await uploadCmsMediaFile(file);
      await load();
      setSelectedId(asset.id);
      setDraftAlt(asset.altText ?? '');
      setDraftName(asset.originalName ?? '');
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4"
      role="dialog"
      aria-modal
      aria-label="Media library"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <p className="font-medium text-sm">Media library</p>
          <button type="button" className="text-sm underline opacity-70" onClick={onClose}>
            Close
          </button>
        </div>

        {err ? <p className="px-4 pt-2 text-xs text-red-600">{err}</p> : null}

        <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-[1fr_240px]">
          <div className="min-h-0 overflow-auto p-4">
            <label className="inline-flex cursor-pointer items-center rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-black/[0.03]">
              {busy ? 'Uploading…' : 'Upload new'}
              <input
                type="file"
                className="hidden"
                accept={imagesOnly ? CMS_IMAGE_ACCEPT : undefined}
                disabled={busy}
                onChange={(e) => {
                  void onUpload(e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
              />
            </label>

            <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {items.map((row) => {
                const url = assetUrl(row);
                const active = row.id === selectedId;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      className={`w-full overflow-hidden rounded-lg border text-left transition ${
                        active
                          ? 'border-[color:var(--primary,#FF6B9D)] ring-2 ring-[color:var(--primary,#FF6B9D)]/40'
                          : 'hover:border-neutral-400'
                      }`}
                      onClick={() => selectRow(row)}
                    >
                      {row.mimeType.startsWith('image/') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt={row.altText ?? ''}
                          className="aspect-square w-full object-cover bg-black/[0.03]"
                        />
                      ) : (
                        <div className="flex aspect-square items-center justify-center bg-black/5 text-[10px]">
                          File
                        </div>
                      )}
                      <p className="truncate px-1.5 py-1 text-[10px] opacity-60">
                        {row.originalName ?? row.id.slice(0, 8)}
                      </p>
                    </button>
                  </li>
                );
              })}
              {items.length === 0 ? (
                <li className="col-span-full py-8 text-center text-xs opacity-60">
                  No images yet — upload one.
                </li>
              ) : null}
            </ul>
          </div>

          <aside className="border-t bg-[color:var(--surface-soft,#faf8f6)] p-4 md:border-l md:border-t-0">
            {selected ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-lg border bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={assetUrl(selected)}
                    alt={draftAlt || selected.altText || ''}
                    className="aspect-square w-full object-contain"
                  />
                </div>
                <label className="block text-xs">
                  File name
                  <input
                    className="mt-1 block w-full rounded border px-2 py-1.5 text-sm"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    maxLength={255}
                  />
                </label>
                <label className="block text-xs">
                  Alt text
                  <input
                    className="mt-1 block w-full rounded border px-2 py-1.5 text-sm"
                    value={draftAlt}
                    onChange={(e) => setDraftAlt(e.target.value)}
                    placeholder="Describe the image"
                    maxLength={200}
                  />
                </label>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                    disabled={savingMeta}
                    onClick={() => void saveMeta()}
                  >
                    {savingMeta ? 'Saving…' : 'Save details'}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white"
                    onClick={useSelected}
                  >
                    Use image
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs opacity-60">Select an image to edit alt text or use it.</p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export function CmsMediaField({ value, onChange, imagesOnly = true, allowVideo = false }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const video = allowVideo ? parseAmbientVideoUrl(value) : null;

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
        placeholder={
          allowVideo
            ? 'YouTube, .mp4/.webm, or image URL'
            : '/gift/media/…, /api/v1/media/…/content, or https://…'
        }
      />
      {value && video?.kind === 'youtube' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={youtubePosterUrl(video.id)}
          alt=""
          className="h-20 max-w-full rounded border object-contain bg-black/[0.03]"
        />
      ) : value && video?.kind === 'direct' ? (
        <video
          src={video.url}
          className="h-20 max-w-full rounded border bg-black/[0.03] object-contain"
          muted
          playsInline
          preload="metadata"
        />
      ) : value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className="h-20 max-w-full rounded border object-contain bg-black/[0.03]"
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        <label className="cursor-pointer rounded border px-2 py-1 text-xs hover:bg-black/5">
          Upload
          <input
            type="file"
            className="hidden"
            accept={imagesOnly ? CMS_IMAGE_ACCEPT : undefined}
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
        onPick={(pick) => onChange(pick.url)}
        imagesOnly={imagesOnly}
      />
    </div>
  );
}
