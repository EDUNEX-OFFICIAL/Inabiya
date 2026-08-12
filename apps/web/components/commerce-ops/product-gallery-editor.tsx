'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link2, Trash2, Upload, Images, ClipboardPaste, Plus } from 'lucide-react';
import {
  MediaLibraryModal,
  uploadCmsMediaFile,
} from '@/components/cms/cms-media-field';
import { OpsIconButton, OpsIconFileLabel } from '@/components/commerce-ops/ops-icon-action';

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

function SortableGalleryRow({
  id,
  item,
  index,
  titleHint,
  showUrl,
  onUpdate,
  onRemove,
}: {
  id: string;
  item: GalleryItem;
  index: number;
  titleHint?: string;
  showUrl: boolean;
  onUpdate: (patch: Partial<GalleryItem>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  };
  const roleLabel = index === 0 ? 'Main photo' : `Extra photo ${index}`;

  return (
    <li ref={setNodeRef} style={style} className="flex gap-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_96%,white)] p-2">
      <button
        type="button"
        className="mt-6 cursor-grab touch-none self-start px-0.5 text-xs opacity-50 active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>

      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-[color-mix(in_srgb,var(--surface-soft)_80%,white)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.url} alt="" className="h-full w-full object-cover" />
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              index === 0
                ? 'rounded bg-[color-mix(in_srgb,var(--primary)_18%,white)] px-1.5 py-0.5 text-[10px] font-medium'
                : 'rounded bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-1.5 py-0.5 text-[10px] font-medium opacity-70'
            }
          >
            {roleLabel}
          </span>
          <OpsIconButton
            label="Remove image"
            icon={Trash2}
            labelFrom="sm"
            className="ml-auto text-[var(--danger)]"
            onClick={onRemove}
          />
        </div>

        {showUrl ? (
          <label className="block text-[11px] opacity-70">
            Image URL
            <input
              className="clay-input font-mono text-xs"
              value={item.url}
              onChange={(e) => onUpdate({ url: e.target.value })}
              maxLength={500}
            />
          </label>
        ) : null}

        <label className="block text-[11px]">
          Alt text
          <input
            className="clay-input text-sm"
            value={item.altText}
            onChange={(e) => onUpdate({ altText: e.target.value })}
            placeholder={titleHint || 'Describe this image'}
            maxLength={200}
          />
        </label>
      </div>
    </li>
  );
}

/** Visual product gallery — images only; product video is a separate field. */
export function ProductGalleryEditor({ items, onChange, titleHint }: Props) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteUrl, setPasteUrl] = useState('');
  const [showUrls, setShowUrls] = useState(false);

  const imageItems = useMemo(
    () => items.filter((item) => item.kind !== 'VIDEO'),
    [items],
  );

  const ids = useMemo(
    () => imageItems.map((item, i) => `${item.url}::${i}`),
    [imageItems],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function setImages(nextImages: GalleryItem[]) {
    const videos = items.filter((item) => item.kind === 'VIDEO');
    onChange([
      ...nextImages.map((row) => ({ ...row, kind: 'IMAGE' as const, posterUrl: undefined })),
      ...videos,
    ]);
  }

  function addItem(url: string, alt = '') {
    const trimmed = url.trim();
    if (!trimmed) return;
    setImages([
      ...imageItems,
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
      addItem(asset.publicUrl ?? `/api/v1/media/${asset.id}/content`, asset.altText ?? '');
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
    setImages(imageItems.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeAt(index: number) {
    setImages(imageItems.filter((_, i) => i !== index));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    setImages(arrayMove(imageItems, oldIndex, newIndex));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Product photos</p>
          <p className="text-[11px] opacity-55">First = main photo · drag to reorder</p>
        </div>
        {imageItems.length > 0 ? (
          <OpsIconButton
            label={showUrls ? 'Hide URLs' : 'Show URLs'}
            icon={Link2}
            onClick={() => setShowUrls((v) => !v)}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <OpsIconFileLabel
          label="Upload image"
          icon={Upload}
          busy={busy}
          inputProps={{
            accept: IMAGE_ACCEPT,
            onChange: (e) => {
              void onUpload(e.target.files?.[0] ?? null);
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
        <OpsIconButton
          label={pasteOpen ? 'Hide URL' : 'Paste URL'}
          icon={ClipboardPaste}
          onClick={() => setPasteOpen((v) => !v)}
        />
      </div>

      {pasteOpen ? (
        <div className="flex flex-wrap items-end gap-2">
          <input
            className="clay-input min-w-0 flex-1 text-sm"
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            placeholder="https://… or /gift/media/…"
          />
          <OpsIconButton
            label="Add"
            icon={Plus}
            variant="secondary"
            onClick={() => {
              addItem(pasteUrl);
              setPasteUrl('');
              setPasteOpen(false);
            }}
          />
        </div>
      ) : null}

      {err ? (
        <div className="gift-banner gift-banner--danger text-xs" role="alert">
          {err}
        </div>
      ) : null}

      {imageItems.length === 0 ? (
        <div className="flex h-16 items-center justify-center rounded-[var(--radius-control)] border border-dashed border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface-soft)_80%,white)] text-sm opacity-60">
          No images
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {imageItems.map((item, index) => {
                const id = ids[index]!;
                return (
                  <SortableGalleryRow
                    key={id}
                    id={id}
                    item={item}
                    index={index}
                    titleHint={titleHint}
                    showUrl={showUrls}
                    onUpdate={(patch) => updateAt(index, patch)}
                    onRemove={() => removeAt(index)}
                  />
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <MediaLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onPick={(pick) => {
          addItem(pick.url, pick.altText?.trim() || '');
          setLibraryOpen(false);
        }}
        imagesOnly
      />
    </div>
  );
}
