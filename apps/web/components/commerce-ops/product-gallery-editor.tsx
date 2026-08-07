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

function isInternalMediaUrl(url: string): boolean {
  const u = url.trim();
  return (
    u.startsWith('/api/v1/media/') ||
    u.startsWith('/gift/media/') ||
    /^https?:\/\/[^/]+\/api\/v1\/media\//i.test(u)
  );
}

function SortableGalleryRow({
  id,
  item,
  index,
  titleHint,
  sourceOpen,
  onToggleSource,
  onUpdate,
  onRemove,
}: {
  id: string;
  item: GalleryItem;
  index: number;
  titleHint?: string;
  sourceOpen: boolean;
  onToggleSource: () => void;
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

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex gap-2 rounded-lg border border-[color:var(--border-subtle)] bg-white p-2"
    >
      <button
        type="button"
        className="mt-6 cursor-grab touch-none self-start px-0.5 text-xs opacity-50 active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>

      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-[color:var(--surface-soft)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.url} alt="" className="h-full w-full object-cover" />
        {index === 0 ? (
          <span className="absolute left-0.5 top-0.5 rounded bg-white/90 px-1 py-px text-[9px] font-medium shadow-sm">
            Primary
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="text-[11px] underline opacity-60"
            onClick={onToggleSource}
          >
            {sourceOpen ? 'Hide source' : 'Show source'}
          </button>
          <button
            type="button"
            className="ml-auto rounded border border-red-200 px-1.5 py-0.5 text-[11px] text-red-700"
            onClick={onRemove}
          >
            Remove
          </button>
        </div>

        {sourceOpen ? (
          <label className="block text-[11px] opacity-70">
            Image URL
            <input
              className="mt-0.5 block w-full rounded border px-2 py-1 font-mono text-xs"
              value={item.url}
              onChange={(e) => onUpdate({ url: e.target.value })}
              maxLength={500}
            />
          </label>
        ) : null}

        <label className="block text-[11px]">
          Alt text
          <input
            className="mt-0.5 block w-full rounded border px-2 py-1 text-sm"
            value={item.altText}
            onChange={(e) => onUpdate({ altText: e.target.value })}
            placeholder={titleHint || 'Describe this media'}
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
  const [showSource, setShowSource] = useState<Record<string, boolean>>({});

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
    const id = ids[index];
    setImages(imageItems.filter((_, i) => i !== index));
    if (id) {
      setShowSource((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
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
        <div className="flex flex-wrap items-end gap-2">
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

      {imageItems.length === 0 ? (
        <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-[color:var(--border-subtle)] bg-[color:var(--surface-soft)] text-sm opacity-60">
          No images
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {imageItems.map((item, index) => {
                const id = ids[index]!;
                const sourceOpen =
                  showSource[id] ?? (!isInternalMediaUrl(item.url) && Boolean(item.url));
                return (
                  <SortableGalleryRow
                    key={id}
                    id={id}
                    item={item}
                    index={index}
                    titleHint={titleHint}
                    sourceOpen={sourceOpen}
                    onToggleSource={() =>
                      setShowSource((s) => ({ ...s, [id]: !sourceOpen }))
                    }
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
