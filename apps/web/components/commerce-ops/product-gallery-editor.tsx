'use client';

import { useState } from 'react';
import {
  MediaLibraryModal,
  uploadCmsMediaFile,
} from '@/components/cms/cms-media-field';

const IMAGE_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml,.svg,.jpg,.jpeg,.png,.webp,.gif,.avif';

export type GalleryItem = {
  url: string;
  altText: string;
  kind: 'IMAGE' | 'VIDEO';
  posterUrl?: string;
};

type Props = {
  items: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
  titleHint?: string;
};

/** Visual product gallery — upload / library / alt / reorder (no JSON). */
export function ProductGalleryEditor({ items, onChange, titleHint }: Props) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteUrl, setPasteUrl] = useState('');

  function addItem(url: string, alt = '') {
    const trimmed = url.trim();
    if (!trimmed) return;
    onChange([
      ...items,
      {
        url: trimmed,
        altText: alt || titleHint || '',
        kind: 'IMAGE',
      },
    ]);
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const asset = await uploadCmsMediaFile(file);
      addItem(asset.publicUrl ?? `/api/v1/media/${asset.id}/content`);
    } catch (e) {
      const msg = String((e as Error).message ?? e);
      setErr(
        /invalid or expired|Authentication required/i.test(msg)
          ? `${msg} Sign out and log in again, then retry.`
          : msg,
      );
    } finally {
      setBusy(false);
    }
  }

  function updateAt(index: number, patch: Partial<GalleryItem>) {
    onChange(items.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeAt(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= items.length) return;
    const copy = [...items];
    const row = copy[index];
    if (!row) return;
    copy.splice(index, 1);
    copy.splice(next, 0, row);
    onChange(copy);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="clay-btn-secondary cursor-pointer text-sm">
          {busy ? 'Uploading…' : 'Upload image'}
          <input
            type="file"
            className="hidden"
            accept={IMAGE_ACCEPT}
            disabled={busy}
            onChange={(e) => {
              void onUpload(e.target.files?.[0] ?? null);
              e.target.value = '';
            }}
          />
        </label>
        <button
          type="button"
          className="clay-btn-secondary text-sm"
          disabled={busy}
          onClick={() => setLibraryOpen(true)}
        >
          Library
        </button>
        <button
          type="button"
          className="text-sm underline opacity-70"
          onClick={() => setPasteOpen((v) => !v)}
        >
          {pasteOpen ? 'Hide URL' : 'Paste URL'}
        </button>
      </div>

      {pasteOpen ? (
        <div className="flex flex-wrap gap-2">
          <input
            className="min-w-0 flex-1 rounded border px-2 py-1.5 text-sm"
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            placeholder="https://… or /gift/media/…"
          />
          <button
            type="button"
            className="clay-btn-secondary text-sm"
            onClick={() => {
              addItem(pasteUrl);
              setPasteUrl('');
              setPasteOpen(false);
            }}
          >
            Add
          </button>
        </div>
      ) : null}

      {err ? <p className="text-xs text-red-600">{err}</p> : null}

      {items.length === 0 ? (
        <div className="flex aspect-[2/1] max-h-40 items-center justify-center rounded-lg border border-dashed border-[color:var(--border-subtle)] bg-[color:var(--surface-soft)] text-sm opacity-60">
          No images
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item, index) => (
            <li
              key={`${item.url}-${index}`}
              className="overflow-hidden rounded-lg border border-[color:var(--border-subtle)] bg-white"
            >
              <div className="relative aspect-square bg-[color:var(--surface-soft)]">
                {item.kind === 'VIDEO' ? (
                  <div className="flex h-full items-center justify-center text-xs opacity-60">
                    Video
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.altText || titleHint || `Image ${index + 1}`}
                    className="h-full w-full object-contain"
                  />
                )}
                {index === 0 ? (
                  <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium shadow-sm">
                    Primary
                  </span>
                ) : null}
              </div>
              <div className="space-y-2 p-3">
                <label className="block text-xs">
                  Alt text
                  <input
                    className="mt-1 block w-full rounded border px-2 py-1 text-sm"
                    value={item.altText}
                    onChange={(e) => updateAt(index, { altText: e.target.value })}
                    placeholder={titleHint || 'Describe this image'}
                    maxLength={200}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-xs disabled:opacity-40"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    ← Earlier
                  </button>
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-xs disabled:opacity-40"
                    disabled={index === items.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    Later →
                  </button>
                  <button
                    type="button"
                    className="ml-auto rounded border border-red-200 px-2 py-1 text-xs text-red-700"
                    onClick={() => removeAt(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <MediaLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onPick={(url) => {
          addItem(url);
          setLibraryOpen(false);
        }}
        imagesOnly
      />
    </div>
  );
}
