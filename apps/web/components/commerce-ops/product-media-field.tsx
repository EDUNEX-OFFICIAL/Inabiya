'use client';

import { useState } from 'react';
import {
  MediaLibraryModal,
  uploadCmsMediaFile,
} from '@/components/cms/cms-media-field';

const IMAGE_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml,.svg,.jpg,.jpeg,.png,.webp,.gif,.avif';

type Props = {
  url: string;
  altText: string;
  onUrlChange: (url: string) => void;
  onAltChange: (alt: string) => void;
  /** Hint shown under alt when empty (e.g. product title). */
  altPlaceholder?: string;
  label?: string;
  /** Hide alt editor (e.g. OG image — URL only). */
  showAlt?: boolean;
};

/** Primary product image: preview + upload / library + alt text. */
export function ProductMediaField({
  url,
  altText,
  onUrlChange,
  onAltChange,
  altPlaceholder,
  label = 'Product image',
  showAlt = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);

  async function onUpload(file: File | null) {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const asset = await uploadCmsMediaFile(file);
      onUrlChange(asset.publicUrl ?? `/api/v1/media/${asset.id}/content`);
    } catch (e) {
      const msg = String((e as Error).message ?? e);
      setErr(
        /invalid or expired|Authentication required/i.test(msg)
          ? `${msg} Sign out and log in again, then retry upload.`
          : msg,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative aspect-square w-full max-w-[11rem] shrink-0 overflow-hidden rounded border border-[color:var(--gift-line)] bg-[color:var(--gift-cream)]/50">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={altText || altPlaceholder || 'Product preview'}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 px-3 text-center text-xs opacity-50">
              <span>No image</span>
              <span>Upload or pick from library</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <label className="clay-btn-secondary cursor-pointer text-sm disabled:opacity-60">
              {busy ? 'Uploading…' : 'Upload'}
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
              onClick={() => setOpen(true)}
            >
              Library
            </button>
            {url ? (
              <button
                type="button"
                className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                disabled={busy}
                onClick={() => onUrlChange('')}
              >
                Remove
              </button>
            ) : null}
            <button
              type="button"
              className="text-sm underline opacity-70"
              onClick={() => setShowUrl((v) => !v)}
            >
              {showUrl ? 'Hide URL' : 'Paste URL'}
            </button>
          </div>

          {showUrl ? (
            <label className="block text-xs">
              Image URL
              <input
                className="mt-1 block w-full rounded border px-2 py-1.5 text-sm"
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder="/gift/media/… or https://…"
              />
            </label>
          ) : null}

          {showAlt ? (
            <label className="block text-xs">
              Alt text
              <input
                className="mt-1 block w-full rounded border px-2 py-1.5 text-sm"
                value={altText}
                onChange={(e) => onAltChange(e.target.value)}
                maxLength={200}
                placeholder={altPlaceholder || 'Alt text'}
              />
            </label>
          ) : null}

          {err ? <p className="text-xs text-red-600">{err}</p> : null}
        </div>
      </div>

      <MediaLibraryModal
        open={open}
        onClose={() => setOpen(false)}
        onPick={(pick) => onUrlChange(pick.url)}
        imagesOnly
      />
    </div>
  );
}
