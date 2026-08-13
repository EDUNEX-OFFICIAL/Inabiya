'use client';

import { useMemo, useState } from 'react';
import { Upload, Images, Trash2, X } from 'lucide-react';
import { MediaLibraryModal, uploadCmsMediaFile } from '@/components/cms/cms-media-field';
import { OpsIconButton, OpsIconFileLabel } from '@/components/commerce-ops/ops-icon-action';
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

/** Dedicated product video: YouTube or direct .mp4/.webm URL + optional cover (poster). */
export function ProductVideoField({ value, onChange, titleHint }: Props) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const parsed = useMemo(() => parseProductVideoUrl(value.url), [value.url]);
  const urlError =
    value.url.trim() && !parsed
      ? 'Use a YouTube link or a direct video file (.mp4, .webm, …)'
      : null;

  const coverSrc =
    value.posterUrl.trim() ||
    (parsed?.kind === 'youtube' ? `https://i.ytimg.com/vi/${parsed.id}/hqdefault.jpg` : '');

  async function onCoverUpload(file: File | null) {
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

  function clearCover() {
    onChange({ ...value, posterUrl: '' });
  }

  return (
    <div className="space-y-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Product video</p>
          <p className="text-[11px] opacity-55">YouTube or .mp4 — optional</p>
        </div>
        {value.url.trim() || value.posterUrl.trim() ? (
          <OpsIconButton label="Clear video" icon={X} onClick={clear} />
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-3">
          <label className="block text-xs">
            Video link
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

          <div>
            <p className="mb-1.5 text-xs">Thumbnail before play</p>
            <div className="flex flex-wrap gap-2">
              <OpsIconFileLabel
                label="Upload thumbnail"
                icon={Upload}
                busy={busy}
                inputProps={{
                  accept: IMAGE_ACCEPT,
                  onChange: (e) => {
                    void onCoverUpload(e.target.files?.[0] ?? null);
                    e.target.value = '';
                  },
                }}
              />
              <OpsIconButton
                label="Library"
                icon={Images}
                variant="secondary"
                disabled={busy}
                onClick={() => setLibraryOpen(true)}
              />
              {value.posterUrl.trim() ? (
                <OpsIconButton
                  label="Remove thumbnail"
                  icon={Trash2}
                  className="text-[var(--danger)]"
                  onClick={clearCover}
                />
              ) : null}
            </div>
          </div>
        </div>

        {coverSrc ? (
          <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-md bg-white sm:justify-self-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverSrc} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-md border border-dashed border-[var(--border-subtle)] text-[11px] opacity-50 sm:justify-self-end">
            No thumbnail
          </div>
        )}
      </div>

      {err ? (
        <div className="gift-banner gift-banner--danger text-xs" role="alert">
          {err}
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
