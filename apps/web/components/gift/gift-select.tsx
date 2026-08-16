'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export type GiftSelectOption = { value: string; label: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: readonly GiftSelectOption[];
  ariaLabel: string;
  variant?: 'pill' | 'field';
  className?: string;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
};

type MenuBox = { top: number; left: number; width: number };

export function GiftSelect({
  value,
  onChange,
  options,
  ariaLabel,
  variant = 'field',
  className = '',
  id,
  disabled = false,
  placeholder = 'Select',
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<MenuBox | null>(null);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, selectedIndex));
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  useEffect(() => {
    if (!open) {
      setBox(null);
      return;
    }
    setActiveIndex(Math.max(0, selectedIndex));

    function sync() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const r = trigger.getBoundingClientRect();
      const minW = Math.max(r.width, 13 * 16);
      const left = Math.max(8, Math.min(r.right - minW, window.innerWidth - minW - 8));
      setBox({ top: r.bottom + 4, left, width: minW });
    }

    sync();

    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', sync, { passive: true });
    window.addEventListener('scroll', sync, { passive: true, capture: true });
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', sync);
      window.removeEventListener('scroll', sync, true);
    };
  }, [open, selectedIndex]);

  function choose(next: string) {
    onChange(next);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onTriggerKey(e: ReactKeyboardEvent) {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        const opt = options[activeIndex];
        if (opt) choose(opt.value);
        return;
      }
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((i) => (i + dir + options.length) % options.length);
    }
  }

  const triggerCls =
    variant === 'pill'
      ? 'inline-flex min-h-9 items-center gap-gs-2 rounded-pill border border-foreground/12 bg-[var(--background)] px-gs-3 py-gs-2 text-body shadow-sm outline-none transition hover:border-primary/35 focus-visible:ring-2 focus-visible:ring-primary/40'
      : 'flex w-full min-h-[calc(var(--tap-min)-4px)] items-center justify-between gap-gs-2 rounded-control border border-[var(--input-border)] bg-[var(--input-bg)] px-gs-3 py-gs-2 text-body shadow-[var(--input-shadow)] outline-none transition hover:border-[var(--border-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--focus-ring)]';

  const menu =
    open && box && typeof document !== 'undefined'
      ? createPortal(
          <ul
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            data-theme="gift"
            data-lenis-prevent
            className="gift-nested-scroll fixed z-[var(--z-overlay)] max-h-64 overflow-y-auto overscroll-contain rounded-control border border-border-subtle bg-[var(--background)] p-gs-1 shadow-clay"
            style={{
              top: box.top,
              left: box.left,
              width: box.width,
            }}
          >
            {options.map((opt, i) => {
              const active = opt.value === value;
              const hi = i === activeIndex;
              return (
                <li key={opt.value || `empty-${i}`} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={
                      hi
                        ? 'flex w-full items-center justify-between gap-gs-2 rounded-control bg-primary px-gs-3 py-gs-2 text-left text-body font-medium text-primary-foreground'
                        : 'flex w-full items-center justify-between gap-gs-2 rounded-control px-gs-3 py-gs-2 text-left text-body text-foreground hover:bg-foreground/[0.04]'
                    }
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => choose(opt.value)}
                  >
                    {opt.label}
                    {active ? <Check className="size-3.5 shrink-0 opacity-90" aria-hidden /> : null}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        className={`${triggerCls} ${disabled ? 'cursor-not-allowed opacity-55' : ''}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onTriggerKey}
      >
        <span className="min-w-0 truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={`size-4 shrink-0 opacity-55 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {menu}
    </div>
  );
}
