'use client';

import { memo, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useDndContext, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, GripVertical, Trash2 } from 'lucide-react';
import { isCanvasDropId } from './cms-canvas-dnd';
import { blockLabel, blockSummary, parseHeroLayout, type Block } from './cms-page-model';
import { HeroLayoutThumb } from './cms-layout-thumb';

type Props = {
  blocks: Block[];
  selected: number;
  previewOpen: boolean;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
  onDuplicate: (index: number) => void;
  preview?: ReactNode;
};

function SortableRow({
  block,
  index,
  selected,
  previewOpen,
  showInsertBefore,
  showPreview,
  preview,
  onSelect,
  onRemove,
  onDuplicate,
}: {
  block: Block;
  index: number;
  selected: boolean;
  previewOpen: boolean;
  showInsertBefore: boolean;
  showPreview: boolean;
  preview?: ReactNode;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.clientId,
    data: { source: 'canvas' },
  });
  const summary = blockSummary(block);
  const layout = block.type === 'hero' ? parseHeroLayout(block.props.layout) : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform ? { ...transform, x: 0 } : null),
        transition,
      }}
      className="space-y-1.5"
    >
      {showInsertBefore ? (
        <div className="h-1 rounded-full bg-[var(--primary)]" aria-hidden />
      ) : null}
      <div
        className={
          isDragging
            ? 'rounded-lg border-2 border-dashed border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_10%,white)]'
            : undefined
        }
      >
        <div
          className={`flex items-start gap-1.5 rounded-lg border px-1.5 py-1.5 ${
            isDragging
              ? 'invisible'
              : selected
                ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_8%,white)]'
                : 'border-[var(--border-subtle)] bg-[var(--surface)]'
          }`}
        >
          <button
            type="button"
            className="mt-0.5 cursor-grab rounded p-1 text-[var(--muted-foreground)] active:cursor-grabbing"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" aria-hidden />
          </button>
          {block.type === 'hero' ? <HeroLayoutThumb layout={layout} /> : null}
          <button
            type="button"
            className="min-w-0 flex-1 self-stretch text-left"
            aria-expanded={selected && previewOpen}
            onClick={onSelect}
          >
            <span className="flex items-baseline gap-2">
              <span className="ops-muted w-5 shrink-0 text-[11px] tabular-nums">{index + 1}</span>
              <span className="text-sm font-medium">
                {blockLabel(block.type, block.props.layout)}
              </span>
            </span>
            {summary ? (
              <span className="mt-0.5 block truncate pl-7 text-xs text-[var(--muted-foreground)]">
                {summary}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]"
            aria-label="Duplicate block"
            onClick={onDuplicate}
          >
            <Copy className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            className="rounded p-1 text-red-700 hover:bg-red-50"
            aria-label="Remove block"
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
      {showPreview ? (
        <div className="overflow-hidden rounded-xl border border-[var(--primary)] bg-[var(--background)]">
          {preview}
        </div>
      ) : null}
    </div>
  );
}

const MemoRow = memo(SortableRow);

function DeleteBlockDialog({
  label,
  onCancel,
  onConfirm,
}: {
  label: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 shadow-xl"
      >
        <p id={titleId} className="text-sm font-medium">
          Delete {label}?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            className="clay-btn-ghost min-h-9 px-3 text-sm"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="clay-btn min-h-9 bg-red-700 px-3 text-sm text-white hover:bg-red-800"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function CmsCanvasDragPreview({ block }: { block: Block }) {
  return (
    <div className="flex w-[min(28rem,90vw)] items-center gap-2 rounded-lg border border-[var(--primary)] bg-[var(--surface)] px-2 py-2 shadow-lg">
      <GripVertical className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden />
      <span className="truncate text-sm font-medium">
        {blockLabel(block.type, block.props.layout)}
      </span>
    </div>
  );
}

export function CmsBlockCanvas({
  blocks,
  selected,
  previewOpen,
  onSelect,
  onRemove,
  onDuplicate,
  preview,
}: Props) {
  const { active, over } = useDndContext();
  const paletteDrag = active?.data.current?.source === 'palette';
  const dragging = Boolean(active);
  const ids = blocks.map((b) => b.clientId);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const pendingBlock = pendingDelete != null ? blocks[pendingDelete] : null;
  const { setNodeRef: setEmptyRef, isOver: emptyOver } = useDroppable({
    id: 'canvas-drop',
    disabled: blocks.length > 0,
  });
  const { setNodeRef: setEndRef, isOver: endOver } = useDroppable({
    id: 'canvas-end',
    disabled: !paletteDrag,
  });
  const overId = over?.id;
  const showInsertBefore =
    paletteDrag && overId != null && !isCanvasDropId(overId) ? String(overId) : null;

  if (blocks.length === 0) {
    return (
      <div
        ref={setEmptyRef}
        className={`min-h-[12rem] rounded-lg ${emptyOver ? 'ring-2 ring-[var(--primary)] ring-offset-2' : ''}`}
      >
        <p className="ops-muted px-2 py-8 text-center text-sm">No blocks</p>
      </div>
    );
  }

  return (
    <div className="min-h-[12rem] rounded-lg">
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          {blocks.map((b, i) => (
            <MemoRow
              key={b.clientId}
              block={b}
              index={i}
              selected={i === selected}
              previewOpen={previewOpen}
              showInsertBefore={showInsertBefore === b.clientId}
              showPreview={i === selected && previewOpen && Boolean(preview) && !dragging}
              preview={i === selected ? preview : undefined}
              onSelect={() => onSelect(i)}
              onRemove={() => setPendingDelete(i)}
              onDuplicate={() => onDuplicate(i)}
            />
          ))}
        </div>
      </SortableContext>
      {paletteDrag ? (
        <div
          ref={setEndRef}
          className={`mt-1.5 h-8 rounded-lg border-2 border-dashed ${
            endOver
              ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_10%,white)]'
              : 'border-[var(--border-subtle)]'
          }`}
        />
      ) : null}

      {pendingBlock && pendingDelete != null ? (
        <DeleteBlockDialog
          label={blockLabel(pendingBlock.type, pendingBlock.props.layout)}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            onRemove(pendingDelete);
            setPendingDelete(null);
          }}
        />
      ) : null}
    </div>
  );
}
