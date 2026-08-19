'use client';

import { CmsMediaField } from '@/components/cms/cms-media-field';
import { parseTrustChipDrafts, serializeTrustChips, TRUST_ICON_KINDS } from '@/components/cms/parse-trust-line';
import {
  INSPECTOR_INPUT,
  INSPECTOR_TEXTAREA_SHORT,
  RepeatableAdd,
  RepeatableRow,
} from './page-builder/cms-inspector-ui';

function moveItem<T>(items: T[], index: number, dir: -1 | 1): T[] {
  const j = index + dir;
  if (j < 0 || j >= items.length) return items;
  const next = [...items];
  const tmp = next[index]!;
  next[index] = next[j]!;
  next[j] = tmp;
  return next;
}

function parseJsonArray(raw: string): Record<string, unknown>[] {
  try {
    const parsed = JSON.parse(raw || '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object');
  } catch {
    return [];
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[11px] text-[var(--muted-foreground)]">{label}</span>
      {children}
    </label>
  );
}

type BrandRow = { name: string; logoUrl: string };

export function parseBrandRows(raw: string): BrandRow[] {
  return (raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const [namePart, logoPart] = entry.split('|').map((x) => x.trim());
      return { name: namePart || '', logoUrl: logoPart || '' };
    });
}

export function serializeBrandRows(rows: BrandRow[]): string {
  return rows
    .map((r) => {
      const name = r.name.trim();
      const logo = r.logoUrl.trim();
      if (!name) return '';
      return logo ? `${name} | ${logo}` : name;
    })
    .filter(Boolean)
    .join(', ');
}

export function BrandsRowsEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const rows = parseBrandRows(value);
  function set(next: BrandRow[]) {
    onChange(serializeBrandRows(next));
  }
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <RepeatableRow
          key={`${row.name}-${i}`}
          label={`Brand ${i + 1}`}
          onMove={(dir) => set(moveItem(rows, i, dir))}
          onRemove={() => set(rows.filter((_, j) => j !== i))}
        >
          <Field label="Name">
            <input
              className={INSPECTOR_INPUT}
              value={row.name}
              onChange={(e) =>
                set(rows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))
              }
            />
          </Field>
          <Field label="Logo">
            <CmsMediaField
              value={row.logoUrl}
              onChange={(logoUrl) => set(rows.map((r, j) => (j === i ? { ...r, logoUrl } : r)))}
            />
          </Field>
        </RepeatableRow>
      ))}
      <RepeatableAdd
        label="Add brand"
        onClick={() => set([...rows, { name: 'New brand', logoUrl: '' }])}
      />
    </div>
  );
}

const USP_ICONS = ['heart', 'package', 'gift', 'truck', 'shield', 'sparkles'] as const;
type UspRow = { icon: string; label: string; body: string };

export function parseUspRows(raw: string): UspRow[] {
  return (raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const m = entry.match(
        /^(heart|package|gift|truck|shield|sparkles)\s*:\s*([^|]+)(?:\|(.+))?$/i,
      );
      if (m?.[1] && m[2]) {
        return { icon: m[1].toLowerCase(), label: m[2].trim(), body: m[3]?.trim() || '' };
      }
      const [labelPart, bodyPart] = entry.split('|').map((x) => x.trim());
      return { icon: '', label: labelPart || '', body: bodyPart || '' };
    });
}

export function serializeUspRows(rows: UspRow[]): string {
  return rows
    .map((r) => {
      const label = r.label.trim();
      if (!label) return '';
      const icon = USP_ICONS.includes(r.icon as (typeof USP_ICONS)[number]) ? r.icon : '';
      const head = icon ? `${icon}:${label}` : label;
      return r.body.trim() ? `${head}|${r.body.trim()}` : head;
    })
    .filter(Boolean)
    .join(', ');
}

export function UspsRowsEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const rows = parseUspRows(value);
  function set(next: UspRow[]) {
    onChange(serializeUspRows(next));
  }
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <RepeatableRow
          key={`usp-${i}`}
          label={`USP ${i + 1}`}
          onMove={(dir) => set(moveItem(rows, i, dir))}
          onRemove={() => set(rows.filter((_, j) => j !== i))}
        >
          <div className="grid grid-cols-2 gap-1.5">
            <Field label="Icon">
              <select
                className={INSPECTOR_INPUT}
                value={row.icon}
                onChange={(e) =>
                  set(rows.map((r, j) => (j === i ? { ...r, icon: e.target.value } : r)))
                }
              >
                <option value="">None</option>
                {USP_ICONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Label">
              <input
                className={INSPECTOR_INPUT}
                value={row.label}
                onChange={(e) =>
                  set(rows.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))
                }
              />
            </Field>
          </div>
          <Field label="Body">
            <input
              className={INSPECTOR_INPUT}
              value={row.body}
              onChange={(e) =>
                set(rows.map((r, j) => (j === i ? { ...r, body: e.target.value } : r)))
              }
            />
          </Field>
        </RepeatableRow>
      ))}
      <RepeatableAdd
        label="Add USP"
        disabled={rows.length >= 8}
        onClick={() => set([...rows, { icon: 'gift', label: 'New USP', body: '' }])}
      />
    </div>
  );
}

type OfferRow = {
  tag: string;
  title: string;
  subtitle: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  tone: string;
  icon: string;
};

function offerFromRaw(row: Record<string, unknown>): OfferRow {
  return {
    tag: String(row.tag ?? '').trim(),
    title: String(row.title ?? '').trim(),
    subtitle: String(row.subtitle ?? '').trim(),
    body: String(row.body ?? '').trim(),
    ctaLabel: String(row.ctaLabel ?? '').trim(),
    ctaHref: String(row.ctaHref ?? '').trim(),
    tone: String(row.tone ?? 'blush'),
    icon: String(row.icon ?? 'heart'),
  };
}

export function OfferCardsEditor({
  value,
  onChange,
  max = 8,
}: {
  value: string;
  onChange: (v: string) => void;
  max?: number;
}) {
  const rows = parseJsonArray(value).map(offerFromRaw);
  function set(next: OfferRow[]) {
    onChange(
      JSON.stringify(
        next.map((r) => ({
          tag: r.tag,
          title: r.title,
          ...(r.subtitle ? { subtitle: r.subtitle } : {}),
          ...(r.body ? { body: r.body } : {}),
          ctaLabel: r.ctaLabel,
          ctaHref: r.ctaHref,
          ...(r.tone === 'sky' || r.tone === 'lavender' || r.tone === 'blush'
            ? { tone: r.tone }
            : {}),
          ...(r.icon === 'heart' || r.icon === 'briefcase' || r.icon === 'box'
            ? { icon: r.icon }
            : {}),
        })),
      ),
    );
  }
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <RepeatableRow
          key={`${row.tag}-${i}`}
          label={`Offer ${i + 1}`}
          onMove={(dir) => set(moveItem(rows, i, dir))}
          onRemove={() => set(rows.filter((_, j) => j !== i))}
        >
          <div className="grid grid-cols-2 gap-1.5">
            <Field label="Tag">
              <input
                className={INSPECTOR_INPUT}
                value={row.tag}
                onChange={(e) =>
                  set(rows.map((r, j) => (j === i ? { ...r, tag: e.target.value } : r)))
                }
              />
            </Field>
            <Field label="Title">
              <input
                className={INSPECTOR_INPUT}
                value={row.title}
                onChange={(e) =>
                  set(rows.map((r, j) => (j === i ? { ...r, title: e.target.value } : r)))
                }
              />
            </Field>
          </div>
          <Field label="Subtitle">
            <input
              className={INSPECTOR_INPUT}
              value={row.subtitle}
              onChange={(e) =>
                set(rows.map((r, j) => (j === i ? { ...r, subtitle: e.target.value } : r)))
              }
            />
          </Field>
          <Field label="Body">
            <textarea
              className={INSPECTOR_TEXTAREA_SHORT}
              value={row.body}
              onChange={(e) =>
                set(rows.map((r, j) => (j === i ? { ...r, body: e.target.value } : r)))
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-1.5">
            <Field label="Button">
              <input
                className={INSPECTOR_INPUT}
                value={row.ctaLabel}
                onChange={(e) =>
                  set(rows.map((r, j) => (j === i ? { ...r, ctaLabel: e.target.value } : r)))
                }
              />
            </Field>
            <Field label="Link">
              <input
                className={INSPECTOR_INPUT}
                value={row.ctaHref}
                onChange={(e) =>
                  set(rows.map((r, j) => (j === i ? { ...r, ctaHref: e.target.value } : r)))
                }
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Field label="Tone">
              <select
                className={INSPECTOR_INPUT}
                value={row.tone}
                onChange={(e) =>
                  set(rows.map((r, j) => (j === i ? { ...r, tone: e.target.value } : r)))
                }
              >
                <option value="blush">Blush</option>
                <option value="sky">Sky</option>
                <option value="lavender">Lavender</option>
              </select>
            </Field>
            <Field label="Icon">
              <select
                className={INSPECTOR_INPUT}
                value={row.icon}
                onChange={(e) =>
                  set(rows.map((r, j) => (j === i ? { ...r, icon: e.target.value } : r)))
                }
              >
                <option value="heart">Heart</option>
                <option value="briefcase">Briefcase</option>
                <option value="box">Box</option>
              </select>
            </Field>
          </div>
        </RepeatableRow>
      ))}
      <RepeatableAdd
        label="Add offer"
        disabled={rows.length >= max}
        onClick={() =>
          set([
            ...rows,
            {
              tag: 'Offer',
              title: 'Save',
              subtitle: '',
              body: '',
              ctaLabel: 'Shop',
              ctaHref: '/',
              tone: 'blush',
              icon: 'heart',
            },
          ])
        }
      />
    </div>
  );
}

type FaqRow = { question: string; answerHtml: string };

export function FaqItemsEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const rows = parseJsonArray(value).map((row) => ({
    question: String(row.question ?? ''),
    answerHtml: String(row.answerHtml ?? ''),
  }));
  function set(next: FaqRow[]) {
    onChange(JSON.stringify(next));
  }
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <RepeatableRow
          key={`${row.question.slice(0, 12)}-${i}`}
          label={`Q${i + 1}`}
          onMove={(dir) => set(moveItem(rows, i, dir))}
          onRemove={() => set(rows.filter((_, j) => j !== i))}
        >
          <Field label="Question">
            <input
              className={INSPECTOR_INPUT}
              value={row.question}
              onChange={(e) =>
                set(rows.map((r, j) => (j === i ? { ...r, question: e.target.value } : r)))
              }
            />
          </Field>
          <Field label="Answer">
            <textarea
              className={INSPECTOR_TEXTAREA_SHORT}
              value={row.answerHtml
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()}
              onChange={(e) =>
                set(
                  rows.map((r, j) =>
                    j === i ? { ...r, answerHtml: `<p>${e.target.value}</p>` } : r,
                  ),
                )
              }
            />
          </Field>
        </RepeatableRow>
      ))}
      <RepeatableAdd
        label="Add question"
        disabled={rows.length >= 20}
        onClick={() => set([...rows, { question: 'New question', answerHtml: '<p></p>' }])}
      />
    </div>
  );
}

type QuoteRow = { quote: string; author: string; role: string; rating: string; dated: string };

export function TestimonialsEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const rows = parseJsonArray(value).map((row) => ({
    quote: String(row.quote ?? ''),
    author: String(row.author ?? ''),
    role: String(row.role ?? ''),
    rating: row.rating != null ? String(row.rating) : '5',
    dated: String(row.dated ?? row.date ?? ''),
  }));
  function set(next: QuoteRow[]) {
    onChange(
      JSON.stringify(
        next.map((r) => {
          const ratingNum = Number(r.rating);
          return {
            quote: r.quote,
            author: r.author,
            ...(r.role ? { role: r.role } : {}),
            ...(Number.isFinite(ratingNum) ? { rating: Math.round(ratingNum) } : {}),
            ...(r.dated ? { dated: r.dated } : {}),
          };
        }),
      ),
    );
  }
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <RepeatableRow
          key={`${row.author}-${i}`}
          label={row.author || `Quote ${i + 1}`}
          onMove={(dir) => set(moveItem(rows, i, dir))}
          onRemove={() => set(rows.filter((_, j) => j !== i))}
        >
          <Field label="Quote">
            <textarea
              className={INSPECTOR_TEXTAREA_SHORT}
              value={row.quote}
              onChange={(e) =>
                set(rows.map((r, j) => (j === i ? { ...r, quote: e.target.value } : r)))
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-1.5">
            <Field label="Author">
              <input
                className={INSPECTOR_INPUT}
                value={row.author}
                onChange={(e) =>
                  set(rows.map((r, j) => (j === i ? { ...r, author: e.target.value } : r)))
                }
              />
            </Field>
            <Field label="Role">
              <input
                className={INSPECTOR_INPUT}
                value={row.role}
                onChange={(e) =>
                  set(rows.map((r, j) => (j === i ? { ...r, role: e.target.value } : r)))
                }
              />
            </Field>
          </div>
        </RepeatableRow>
      ))}
      <RepeatableAdd
        label="Add quote"
        disabled={rows.length >= 12}
        onClick={() => set([...rows, { quote: '', author: '', role: '', rating: '5', dated: '' }])}
      />
    </div>
  );
}

type LinkRow = { label: string; href: string };

function parseLinkRows(raw: string): LinkRow[] {
  return (raw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, href] = line.split('|').map((s) => s.trim());
      return { label: label || '', href: href || '' };
    });
}

function serializeLinkRows(rows: LinkRow[]): string {
  return rows
    .map((r) => {
      const label = r.label.trim();
      const href = r.href.trim();
      if (!label && !href) return '';
      return `${label} | ${href}`;
    })
    .filter(Boolean)
    .join('\n');
}

export function LinkRowsEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const rows = parseLinkRows(value);
  function set(next: LinkRow[]) {
    onChange(serializeLinkRows(next));
  }
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <RepeatableRow
          key={`${row.href}-${i}`}
          label={`Link ${i + 1}`}
          onMove={(dir) => set(moveItem(rows, i, dir))}
          onRemove={() => set(rows.filter((_, j) => j !== i))}
        >
          <div className="grid grid-cols-2 gap-1.5">
            <Field label="Label">
              <input
                className={INSPECTOR_INPUT}
                value={row.label}
                onChange={(e) =>
                  set(rows.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))
                }
              />
            </Field>
            <Field label="Link">
              <input
                className={INSPECTOR_INPUT}
                value={row.href}
                onChange={(e) =>
                  set(rows.map((r, j) => (j === i ? { ...r, href: e.target.value } : r)))
                }
              />
            </Field>
          </div>
        </RepeatableRow>
      ))}
      <RepeatableAdd label="Add link" onClick={() => set([...rows, { label: '', href: '/' }])} />
    </div>
  );
}

type StepRow = { title: string; body: string };

export function StepsRowsEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const rows = (value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, body] = line.split('|').map((s) => s.trim());
      return { title: title || '', body: body || '' };
    });
  function set(next: StepRow[]) {
    onChange(
      next
        .map((r) => {
          const title = r.title.trim();
          if (!title) return '';
          return r.body.trim() ? `${title} | ${r.body.trim()}` : title;
        })
        .filter(Boolean)
        .join('\n'),
    );
  }
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <RepeatableRow
          key={`${row.title}-${i}`}
          label={`Step ${i + 1}`}
          onMove={(dir) => set(moveItem(rows, i, dir))}
          onRemove={() => set(rows.filter((_, j) => j !== i))}
        >
          <Field label="Title">
            <input
              className={INSPECTOR_INPUT}
              value={row.title}
              onChange={(e) =>
                set(rows.map((r, j) => (j === i ? { ...r, title: e.target.value } : r)))
              }
            />
          </Field>
          <Field label="Body">
            <input
              className={INSPECTOR_INPUT}
              value={row.body}
              onChange={(e) =>
                set(rows.map((r, j) => (j === i ? { ...r, body: e.target.value } : r)))
              }
            />
          </Field>
        </RepeatableRow>
      ))}
      <RepeatableAdd
        label="Add step"
        disabled={rows.length >= 6}
        onClick={() => set([...rows, { title: 'New step', body: '' }])}
      />
    </div>
  );
}

export function TextRowsEditor({
  value,
  onChange,
  addLabel,
  max = 8,
}: {
  value: string;
  onChange: (v: string) => void;
  addLabel: string;
  max?: number;
}) {
  const rows = (value || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  function set(next: string[]) {
    onChange(
      next
        .map((s) => s.trim())
        .filter(Boolean)
        .join('\n'),
    );
  }
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <RepeatableRow
          key={`${row}-${i}`}
          label={`Line ${i + 1}`}
          onMove={(dir) => set(moveItem(rows, i, dir))}
          onRemove={() => set(rows.filter((_, j) => j !== i))}
        >
          <input
            className={INSPECTOR_INPUT}
            value={row}
            onChange={(e) => set(rows.map((r, j) => (j === i ? e.target.value : r)))}
          />
        </RepeatableRow>
      ))}
      <RepeatableAdd
        label={addLabel}
        disabled={rows.length >= max}
        onClick={() => set([...rows, 'New line'])}
      />
    </div>
  );
}

export function TrustChipsEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const rows = parseTrustChipDrafts(value);
  function set(next: typeof rows) {
    onChange(serializeTrustChips(next));
  }
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <RepeatableRow
          key={`chip-${i}`}
          label={`Chip ${i + 1}`}
          onMove={(dir) => set(moveItem(rows, i, dir))}
          onRemove={() => set(rows.filter((_, j) => j !== i))}
        >
          <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-1.5">
            <select
              className={INSPECTOR_INPUT}
              aria-label="Icon"
              value={row.icon}
              onChange={(e) =>
                set(
                  rows.map((r, j) =>
                    j === i ? { ...r, icon: e.target.value as typeof row.icon } : r,
                  ),
                )
              }
            >
              {TRUST_ICON_KINDS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
            <input
              className={INSPECTOR_INPUT}
              value={row.label}
              onChange={(e) => set(rows.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))}
            />
          </div>
        </RepeatableRow>
      ))}
      <RepeatableAdd
        label="Add chip"
        disabled={rows.length >= 6}
        onClick={() => set([...rows, { icon: 'heart', label: 'New chip' }])}
      />
    </div>
  );
}
