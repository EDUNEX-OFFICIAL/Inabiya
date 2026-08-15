'use client';

import type { ReactNode } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  ArrowUpToLine,
  Minus,
} from 'lucide-react';
import {
  parseSectionStyle,
  SECTION_HEADLINE,
  SECTION_OVERLAY,
  SECTION_PAD,
  type SectionAlign,
  type SectionHeadline,
  type SectionInk,
  type SectionOverlay,
  type SectionPad,
  type SectionValign,
} from '@/components/cms/section-style';

type Props = {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  showValign?: boolean;
  showHeadlineSize?: boolean;
  showOverlay?: boolean;
};

function toggle<T extends string>(current: T | undefined, next: T): string {
  return current === next ? '' : next;
}

function Chip({
  pressed,
  label,
  onClick,
  children,
}: {
  pressed: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-medium ${
        pressed
          ? 'bg-[var(--foreground)] text-[var(--background)]'
          : 'hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]'
      }`}
    >
      {children}
    </button>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="shrink-0 text-xs text-[var(--muted-foreground)]">{label}</span>
      <div className="flex flex-wrap justify-end gap-0.5">{children}</div>
    </div>
  );
}

export function CmsSectionStyleFields({
  values,
  onChange,
  showValign = false,
  showHeadlineSize = true,
  showOverlay = false,
}: Props) {
  const style = parseSectionStyle(values);

  return (
    <div className="space-y-2">
      <Row label="Align">
        {(
          [
            ['start', 'Left', AlignLeft],
            ['center', 'Center', AlignCenter],
            ['end', 'Right', AlignRight],
          ] as const
        ).map(([value, label, Icon]) => (
          <Chip
            key={value}
            pressed={style.align === value}
            label={label}
            onClick={() => onChange('align', toggle<SectionAlign>(style.align, value))}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </Chip>
        ))}
      </Row>
      {showValign ? (
        <Row label="Vertical">
          {(
            [
              ['start', 'Top', ArrowUpToLine],
              ['center', 'Middle', Minus],
              ['end', 'Bottom', ArrowDownToLine],
            ] as const
          ).map(([value, label, Icon]) => (
            <Chip
              key={value}
              pressed={style.valign === value}
              label={label}
              onClick={() => onChange('valign', toggle<SectionValign>(style.valign, value))}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </Chip>
          ))}
        </Row>
      ) : null}
      {showHeadlineSize ? (
        <Row label="Headline">
          {SECTION_HEADLINE.map((value) => (
            <Chip
              key={value}
              pressed={style.headlineSize === value}
              label={value === 'h2' ? 'Small' : value === 'h1' ? 'Medium' : 'Large'}
              onClick={() =>
                onChange('headlineSize', toggle<SectionHeadline>(style.headlineSize, value))
              }
            >
              {value === 'h2' ? 'S' : value === 'h1' ? 'M' : 'L'}
            </Chip>
          ))}
        </Row>
      ) : null}
      <Row label="Color">
        {(
          [
            ['default', 'Ink', 'bg-[var(--foreground)]'],
            ['muted', 'Muted', 'bg-[var(--inabiya-body)] opacity-60'],
            ['blush', 'Pink', 'bg-[var(--primary)]'],
          ] as const
        ).map(([value, label, swatch]) => (
          <Chip
            key={value}
            pressed={style.ink === value}
            label={label}
            onClick={() => onChange('ink', toggle<SectionInk>(style.ink, value))}
          >
            <span className={`h-3 w-3 rounded-full ${swatch}`} aria-hidden />
          </Chip>
        ))}
      </Row>
      <Row label="Space">
        {SECTION_PAD.map((value) => (
          <Chip
            key={value}
            pressed={style.pad === value}
            label={value === 'sm' ? 'Small' : value === 'md' ? 'Medium' : 'Large'}
            onClick={() => onChange('pad', toggle<SectionPad>(style.pad, value))}
          >
            {value === 'sm' ? 'S' : value === 'md' ? 'M' : 'L'}
          </Chip>
        ))}
      </Row>
      {showOverlay ? (
        <Row label="Overlay">
          {SECTION_OVERLAY.map((value) => (
            <Chip
              key={value}
              pressed={style.overlay === value}
              label={value === 'none' ? 'None' : value === 'soft' ? 'Soft' : 'Strong'}
              onClick={() => onChange('overlay', toggle<SectionOverlay>(style.overlay, value))}
            >
              {value === 'none' ? '0' : value === 'soft' ? '½' : '1'}
            </Chip>
          ))}
        </Row>
      ) : null}
    </div>
  );
}
