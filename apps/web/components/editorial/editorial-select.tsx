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
import { blogFontClass } from '@/lib/theme-fonts';

export type EditorialSelectOption = { value: string; label: string };

type MenuBox = { top: number; left: number; width: number };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: readonly EditorialSelectOption[];
  ariaLabel: string;
  /** `inline` = queue filter bar; `field` = form control. */
  variant?: 'inline' | 'field';
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export function EditorialSelect({
  value,
  onChange,
  options,
  ariaLabel,
  variant = 'field',
  id,
  disabled = false,
  placeholder = 'Select',
  className = '',
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
      const minW = Math.max(r.width, 12 * 16);
      const left = Math.max(8, Math.min(r.left, window.innerWidth - minW - 8));
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

  const menu =
    open && box && typeof document !== 'undefined'
      ? createPortal(
          <ul
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            data-theme="blog"
            data-density="compact"
            className={`editorial-select-menu fixed ${blogFontClass}`}
            style={{
              top: box.top,
              left: box.left,
              width: box.width,
              zIndex: 'var(--z-modal)',
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
                    className={`editorial-select-option${hi ? ' is-active' : ''}${active ? ' is-selected' : ''}`}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => choose(opt.value)}
                  >
                    {opt.label}
                    {active ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={`editorial-select editorial-select--${variant} ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        className="editorial-select__trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onTriggerKey}
      >
        <span className="min-w-0 truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 opacity-55 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {menu}
    </div>
  );
}
