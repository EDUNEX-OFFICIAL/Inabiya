'use client';

import { useMemo, useState } from 'react';
import {
  MediaLibraryModal,
  uploadCmsMediaFile,
} from '@/components/cms/cms-media-field';
import { isValidProductVideoUrl, parseProductVideoUrl } from '@/lib/product-video';

const IMAGE_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml,.svg,.jpg,.jpeg,.png,.webp,.gif,.avif';

export type ProductVideoValue = {
  url: string;
  posterUrl: string;
  altText: string;
};

type Props = {
  value: ProductVideoValue;
  onChange: (value: ProductVideoValue) => void;
  titleHint?: string;
};

/** Dedicated product video: YouTube or direct .mp4/.webm URL + optional poster. */
export function ProductVideoField({ value, onChange, titleHint }: Props) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const parsed = useMemo(() => parseProductVideoUrl(value.url), [value.url]);
  const urlError =
    value.url.trim() && !parsed
      ? 'Use a YouTube link or a direct video file (.mp4, .webm, …)'
      : null;

  async function onPosterUpload(file: File | null) {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const asset = await uploadCmsMediaFile(file);
      onChange({
        ...value,
        posterUrl: asset.publicUrl ?? `/api/v1/media/${asset.id}/content`,
      });
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

  function clear() {
    onChange({ url: '', posterUrl: '', altText: '' });
    setErr(null);
  }

  return (
    <div className="clay-panel space-y-3 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Product video</p>
        {value.url.trim() || value.posterUrl.trim() ? (
          <button type="button" className="clay-btn-ghost text-[11px]" onClick={clear}>
            Clear
          </button>
        ) : null}
      </div>

      <label className="block text-xs">
        Video URL
        <input
          className="clay-input font-mono text-sm"
          value={value.url}
          onChange={(e) => onChange({ ...value, url: e.target.value })}
          placeholder="YouTube link or https://…/video.mp4"
          maxLength={500}
          aria-invalid={Boolean(urlError)}
        />
      </label>
      {urlError ? (
        <div className="gift-banner gift-banner--danger text-xs" role="alert">
          {urlError}
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1 text-xs">
          Poster URL
          <input
            className="clay-input text-sm"
            value={value.posterUrl}
            onChange={(e) => onChange({ ...value, posterUrl: e.target.value })}
            placeholder="Optional cover image"
            maxLength={500}
          />
        </label>
        <label className="clay-btn-secondary cursor-pointer text-sm">
          {busy ? '…' : 'Upload'}
          <input
            type="file"
            className="hidden"
            accept={IMAGE_ACCEPT}
            disabled={busy}
            onChange={(e) => {
              void onPosterUpload(e.target.files?.[0] ?? null);
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
      </div>

      <label className="block text-xs">
        Alt text
        <input
          className="clay-input text-sm"
          value={value.altText}
          onChange={(e) => onChange({ ...value, altText: e.target.value })}
          placeholder={titleHint || 'Describe this video'}
          maxLength={200}
        />
      </label>

      {err ? (
        <div className="gift-banner gift-banner--danger text-xs" role="alert">
          {err}
        </div>
      ) : null}

      {value.posterUrl.trim() || (parsed?.kind === 'youtube' && isValidProductVideoUrl(value.url)) ? (
        <div className="relative h-20 w-36 overflow-hidden rounded-md bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              value.posterUrl.trim() ||
              (parsed?.kind === 'youtube'
                ? `https://i.ytimg.com/vi/${parsed.id}/hqdefault.jpg`
                : '')
            }
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <MediaLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onPick={(pick) => {
          onChange({ ...value, posterUrl: pick.url });
          setLibraryOpen(false);
        }}
        imagesOnly
      />
    </div>
  );
}
