'use client';

import { useCallback, useRef } from 'react';
import { GripVertical } from 'lucide-react';

export const PANEL_CLOSE_PX = 148;
export const INSERTER_DEFAULT_PX = 256;
export const INSPECTOR_DEFAULT_PX = 384;
export const INSERTER_MAX_PX = 400;
export const INSPECTOR_MAX_PX = 560;

export const INSERTER_WIDTH_KEY = 'inabiya.cms.builder.inserterWidth';
export const INSPECTOR_WIDTH_KEY = 'inabiya.cms.builder.inspectorWidth';

export function readPanelWidth(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const n = Number(raw);
    if (!Number.isFinite(n)) return fallback;
    return Math.round(n);
  } catch {
    return fallback;
  }
}

export function writePanelWidth(key: string, width: number) {
  try {
    localStorage.setItem(key, String(Math.round(width)));
  } catch {
    /* ignore */
  }
}

type Props = {
  /** Left panel: drag right grows. Right panel: drag left grows. */
  grow: 'east' | 'west';
  width: number;
  max: number;
  onWidth: (w: number) => void;
  onCommit: (w: number) => void;
  onClose: () => void;
  label: string;
};

export function PanelResizeHandle({ grow, width, max, onWidth, onCommit, onClose, label }: Props) {
  const start = useRef({ x: 0, w: 0 });
  const widthRef = useRef(width);
  widthRef.current = width;
  const closed = useRef(false);

  const cleanup = useCallback((el: HTMLButtonElement, pointerId: number) => {
    try {
      el.releasePointerCapture(pointerId);
    } catch {
      /* already released */
    }
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    closed.current = false;
    start.current = { x: e.clientX, w: widthRef.current };
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId) || closed.current) return;
      const dx = e.clientX - start.current.x;
      const signed = grow === 'east' ? dx : -dx;
      const next = start.current.w + signed;
      if (next < PANEL_CLOSE_PX) {
        closed.current = true;
        onWidth(start.current.w);
        cleanup(e.currentTarget, e.pointerId);
        onClose();
        return;
      }
      onWidth(Math.min(max, Math.max(PANEL_CLOSE_PX, Math.round(next))));
    },
    [cleanup, grow, max, onClose, onWidth],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      cleanup(e.currentTarget, e.pointerId);
      if (!closed.current) onCommit(widthRef.current);
    },
    [cleanup, onCommit],
  );

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="group relative z-10 flex w-3 shrink-0 cursor-col-resize touch-none items-center justify-center bg-[color-mix(in_srgb,var(--surface)_88%,var(--foreground))] hover:bg-[color-mix(in_srgb,var(--primary)_18%,var(--surface))] active:bg-[color-mix(in_srgb,var(--primary)_28%,var(--surface))]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <span
        className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--border-subtle)] group-hover:bg-[var(--primary)] group-active:bg-[var(--primary)]"
        aria-hidden
      />
      <span
        className="pointer-events-none relative flex h-10 w-3.5 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--muted-foreground)] shadow-sm group-hover:border-[var(--primary)] group-hover:text-[var(--primary)] group-active:border-[var(--primary)] group-active:text-[var(--primary)]"
        aria-hidden
      >
        <GripVertical className="h-3.5 w-3.5" strokeWidth={2.25} />
      </span>
    </button>
  );
}
