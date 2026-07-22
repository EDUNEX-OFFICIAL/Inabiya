'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { ArticleEditor } from '@/components/editorial/article-editor';
import { CmsMediaField } from '@/components/cms/cms-media-field';

type BlockType =
  | 'hero'
  | 'richText'
  | 'image'
  | 'productGrid'
  | 'cta'
  | 'spacer'
  | 'brandStrip'
  | 'recipientSplit'
  | 'articleTeasers'
  | 'footer'
  | 'saleStrip';

type Block = {
  clientId: string;
  type: BlockType;
  props: Record<string, string>;
};

type MarketingPage = {
  id: string;
  slug: string;
  title: string;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
  isHomepage?: boolean;
  blocks: Array<{ id: string; type: string; props: Record<string, unknown> }>;
};

const ALL_TYPES: BlockType[] = [
  'hero',
  'richText',
  'image',
  'productGrid',
  'cta',
  'spacer',
  'brandStrip',
  'recipientSplit',
  'articleTeasers',
  'footer',
  'saleStrip',
];

const EMPTY_PROPS: Record<BlockType, Record<string, string>> = {
  hero: {
    headline: '',
    subcopy: '',
    eyebrow: '',
    ctaLabel: '',
    ctaHref: '/gift',
    ctaLabel2: '',
    ctaHref2: '',
    trustLine: '',
    imageUrl: '',
    variant: 'storefront',
  },
  richText: { html: '<p></p>' },
  image: { url: '', alt: '', caption: '' },
  productGrid: {
    title: '',
    productSlugs: '',
    category: '',
    hamper: 'false',
    limit: '',
    seeAllHref: '',
    seeAllLabel: 'See all',
  },
  cta: { label: 'Shop', href: '/gift', variant: 'primary', title: '', body: '' },
  spacer: { size: 'md' },
  brandStrip: {
    title: 'Trusted brands we stock',
    subtitle: '',
    brands: '',
    usps: '',
    showUsps: 'true',
  },
  recipientSplit: {
    title: 'Shop by baby',
    subtitle: 'Curated gifts for little girls and boys',
    leftLabel: 'girl',
    leftHref: '/gift/products?recipient=girl',
    leftEyebrow: 'For the little',
    leftCta: 'Shop girl gifts →',
    leftAccent: 'pink',
    leftImageUrl: '',
    rightLabel: 'boy',
    rightHref: '/gift/products?recipient=boy',
    rightEyebrow: 'For the little',
    rightCta: 'Shop boy gifts →',
    rightAccent: 'sky',
    rightImageUrl: '',
  },
  articleTeasers: {
    overline: 'Journal',
    title: 'From the parenting journal',
    limit: '3',
    seeAllHref: '/articles',
    seeAllLabel: 'All articles →',
  },
  footer: {
    brandName: 'Inabiya',
    tagline: 'Thoughtfully personalised baby essentials & gifting.',
    shopLinks: '',
    companyLinks: '',
  },
  saleStrip: {
    text: 'Free personalisation on gift boxes this week',
    ctaLabel: 'Shop →',
    ctaHref: '/gift',
    tone: 'blush',
  },
};

let clientSeq = 0;
function newClientId() {
  clientSeq += 1;
  return `b-${clientSeq}-${Date.now()}`;
}

function nestCard(
  prefix: 'left' | 'right',
  props: Record<string, string>,
): {
  label: string;
  href: string;
  eyebrow?: string;
  cta?: string;
  accent?: 'pink' | 'sky';
  imageUrl?: string;
} {
  const label = props[`${prefix}Label`] || (prefix === 'left' ? 'girl' : 'boy');
  const href =
    props[`${prefix}Href`] ||
    (prefix === 'left' ? '/gift/products?recipient=girl' : '/gift/products?recipient=boy');
  const accentRaw = props[`${prefix}Accent`];
  const accent =
    accentRaw === 'pink' || accentRaw === 'sky' ? (accentRaw as 'pink' | 'sky') : undefined;
  return {
    label,
    href,
    ...(props[`${prefix}Eyebrow`] ? { eyebrow: props[`${prefix}Eyebrow`] } : {}),
    ...(props[`${prefix}Cta`] ? { cta: props[`${prefix}Cta`] } : {}),
    ...(accent ? { accent } : {}),
    ...(props[`${prefix}ImageUrl`] ? { imageUrl: props[`${prefix}ImageUrl`] } : {}),
  };
}

function flattenRecipientCard(
  side: unknown,
  prefix: 'left' | 'right',
  props: Record<string, string>,
) {
  if (!side || typeof side !== 'object' || Array.isArray(side)) return;
  const card = side as Record<string, unknown>;
  if (card.label != null) props[`${prefix}Label`] = String(card.label);
  if (card.href != null) props[`${prefix}Href`] = String(card.href);
  if (card.eyebrow != null) props[`${prefix}Eyebrow`] = String(card.eyebrow);
  if (card.cta != null) props[`${prefix}Cta`] = String(card.cta);
  if (card.accent != null) props[`${prefix}Accent`] = String(card.accent);
  if (card.imageUrl != null) props[`${prefix}ImageUrl`] = String(card.imageUrl);
}

function toEditable(blocks: MarketingPage['blocks']): Block[] {
  return blocks
    .filter((b) => ALL_TYPES.includes(b.type as BlockType))
    .map((b) => {
      const props: Record<string, string> = { ...EMPTY_PROPS[b.type as BlockType] };
      const raw = b.props ?? {};

      if (b.type === 'recipientSplit') {
        for (const [k, v] of Object.entries(raw)) {
          if (k === 'left' || k === 'right') continue;
          if (v != null && typeof v !== 'object') props[k] = String(v);
        }
        flattenRecipientCard(raw.left, 'left', props);
        flattenRecipientCard(raw.right, 'right', props);
      } else {
        for (const [k, v] of Object.entries(raw)) {
          if (k === 'products' || k === 'articles') {
            // Resolved catalog/journal payload — editor keeps source fields only
            continue;
          }
          if (k === 'productSlugs' && Array.isArray(v)) {
            props.productSlugs = v.map(String).join(', ');
          } else if (k === 'brands' && Array.isArray(v)) {
            props.brands = v
              .map((item) => {
                if (typeof item === 'string') return item;
                if (item && typeof item === 'object' && 'name' in item) {
                  const name = String((item as { name: unknown }).name);
                  const logo =
                    typeof (item as { logoUrl?: unknown }).logoUrl === 'string'
                      ? String((item as { logoUrl: string }).logoUrl)
                      : '';
                  return logo ? `${name} | ${logo}` : name;
                }
                return '';
              })
              .filter(Boolean)
              .join(', ');
          } else if (k === 'usps' && Array.isArray(v)) {
            props.usps = v
              .map((item) => {
                if (!item || typeof item !== 'object') return '';
                const label = String((item as { label?: unknown }).label ?? '').trim();
                const icon = String((item as { icon?: unknown }).icon ?? '').trim();
                if (!label) return '';
                return icon ? `${icon}:${label}` : label;
              })
              .filter(Boolean)
              .join(', ');
          } else if (k === 'columns' && Array.isArray(v) && b.type === 'footer') {
            const cols = v as Array<{ title?: string; links?: Array<{ label: string; href: string }> }>;
            const shop = cols.find((c) => /shop/i.test(String(c.title ?? ''))) ?? cols[0];
            const company = cols.find((c) => /company/i.test(String(c.title ?? ''))) ?? cols[1];
            props.shopLinks = (shop?.links ?? [])
              .map((l) => `${l.label} | ${l.href}`)
              .join('\n');
            props.companyLinks = (company?.links ?? [])
              .map((l) => `${l.label} | ${l.href}`)
              .join('\n');
          } else if (k === 'showUsps') {
            props.showUsps = v === false || v === 'false' ? 'false' : 'true';
          } else if (k === 'hamper') {
            props.hamper = v === true || v === 'true' ? 'true' : 'false';
          } else if (k === 'limit' && v != null) {
            props.limit = String(v);
          } else if (v != null && typeof v !== 'object') {
            props[k] = String(v);
          }
        }
      }

      return { clientId: b.id || newClientId(), type: b.type as BlockType, props };
    });
}

function toPayload(blocks: Block[]) {
  return blocks.map((b) => {
    if (b.type === 'hero') {
      const variant =
        b.props.variant === 'storefront' || b.props.variant === 'panel'
          ? b.props.variant
          : undefined;
      return {
        type: 'hero' as const,
        props: {
          headline: b.props.headline || 'Headline',
          ...(b.props.subcopy ? { subcopy: b.props.subcopy } : {}),
          ...(b.props.ctaLabel ? { ctaLabel: b.props.ctaLabel } : {}),
          ...(b.props.ctaHref ? { ctaHref: b.props.ctaHref } : {}),
          ...(b.props.ctaLabel2 ? { ctaLabel2: b.props.ctaLabel2 } : {}),
          ...(b.props.ctaHref2 ? { ctaHref2: b.props.ctaHref2 } : {}),
          ...(b.props.trustLine ? { trustLine: b.props.trustLine } : {}),
          ...(b.props.eyebrow ? { eyebrow: b.props.eyebrow } : {}),
          ...(b.props.imageUrl ? { imageUrl: b.props.imageUrl } : {}),
          ...(variant ? { variant } : {}),
        },
      };
    }
    if (b.type === 'richText') {
      return { type: 'richText' as const, props: { html: b.props.html || '<p></p>' } };
    }
    if (b.type === 'image') {
      return {
        type: 'image' as const,
        props: {
          url: b.props.url || 'https://placehold.co/800x400',
          alt: b.props.alt || 'Image',
          ...(b.props.caption ? { caption: b.props.caption } : {}),
        },
      };
    }
    if (b.type === 'productGrid') {
      const slugs = (b.props.productSlugs || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const limitNum = Number.parseInt(b.props.limit || '', 10);
      return {
        type: 'productGrid' as const,
        props: {
          ...(b.props.title ? { title: b.props.title } : {}),
          ...(slugs.length ? { productSlugs: slugs } : {}),
          ...(b.props.category ? { category: b.props.category } : {}),
          ...(b.props.hamper === 'true' ? { hamper: true } : {}),
          ...(Number.isFinite(limitNum) && limitNum > 0 ? { limit: limitNum } : {}),
          ...(b.props.seeAllHref ? { seeAllHref: b.props.seeAllHref } : {}),
          ...(b.props.seeAllLabel ? { seeAllLabel: b.props.seeAllLabel } : {}),
        },
      };
    }
    if (b.type === 'spacer') {
      const size = (['sm', 'md', 'lg'] as const).includes(b.props.size as 'sm' | 'md' | 'lg')
        ? (b.props.size as 'sm' | 'md' | 'lg')
        : 'md';
      return { type: 'spacer' as const, props: { size } };
    }
    if (b.type === 'brandStrip') {
      const brands = (b.props.brands || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((entry) => {
          const [namePart, logoPart] = entry.split('|').map((x) => x.trim());
          if (logoPart) return { name: namePart, logoUrl: logoPart };
          return namePart;
        });
      const usps = (b.props.usps || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((entry) => {
          const m = entry.match(/^(heart|package|gift|truck)\s*:\s*(.+)$/i);
          if (m?.[1] && m[2]) {
            return {
              icon: m[1].toLowerCase() as 'heart' | 'package' | 'gift' | 'truck',
              label: m[2].trim(),
            };
          }
          return { label: entry };
        });
      return {
        type: 'brandStrip' as const,
        props: {
          ...(b.props.title ? { title: b.props.title } : {}),
          ...(b.props.subtitle ? { subtitle: b.props.subtitle } : {}),
          ...(brands.length ? { brands } : {}),
          ...(usps.length ? { usps } : {}),
          ...(b.props.showUsps === 'false' ? { showUsps: false } : { showUsps: true }),
        },
      };
    }
    if (b.type === 'recipientSplit') {
      return {
        type: 'recipientSplit' as const,
        props: {
          ...(b.props.title ? { title: b.props.title } : {}),
          ...(b.props.subtitle ? { subtitle: b.props.subtitle } : {}),
          left: nestCard('left', b.props),
          right: nestCard('right', b.props),
        },
      };
    }
    if (b.type === 'articleTeasers') {
      const limitNum = Number.parseInt(b.props.limit || '', 10);
      return {
        type: 'articleTeasers' as const,
        props: {
          ...(b.props.overline ? { overline: b.props.overline } : {}),
          ...(b.props.title ? { title: b.props.title } : {}),
          ...(Number.isFinite(limitNum) && limitNum > 0 ? { limit: limitNum } : {}),
          ...(b.props.seeAllHref ? { seeAllHref: b.props.seeAllHref } : {}),
          ...(b.props.seeAllLabel ? { seeAllLabel: b.props.seeAllLabel } : {}),
        },
      };
    }
    if (b.type === 'footer') {
      const parseLinks = (text: string) =>
        text
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [label, href] = line.split('|').map((s) => s.trim());
            return { label: label || href, href: href || label };
          })
          .filter((l) => l.href);
      return {
        type: 'footer' as const,
        props: {
          ...(b.props.brandName ? { brandName: b.props.brandName } : {}),
          ...(b.props.tagline ? { tagline: b.props.tagline } : {}),
          columns: [
            { title: 'Shop', links: parseLinks(b.props.shopLinks || '') },
            { title: 'Company', links: parseLinks(b.props.companyLinks || '') },
          ].filter((c) => c.links.length > 0),
        },
      };
    }
    if (b.type === 'saleStrip') {
      const tone = (['blush', 'mint', 'sky', 'soft'] as const).includes(
        b.props.tone as 'blush' | 'mint' | 'sky' | 'soft',
      )
        ? (b.props.tone as 'blush' | 'mint' | 'sky' | 'soft')
        : 'blush';
      return {
        type: 'saleStrip' as const,
        props: {
          text: b.props.text || 'Limited-time offer',
          ...(b.props.ctaLabel ? { ctaLabel: b.props.ctaLabel } : {}),
          ...(b.props.ctaHref ? { ctaHref: b.props.ctaHref } : {}),
          tone,
        },
      };
    }
    return {
      type: 'cta' as const,
      props: {
        label: b.props.label || 'Continue',
        href: b.props.href || '/gift',
        ...(b.props.variant === 'secondary' ? { variant: 'secondary' as const } : {}),
        ...(b.props.title ? { title: b.props.title } : {}),
        ...(b.props.body ? { body: b.props.body } : {}),
      },
    };
  });
}

function SortableRow({
  block,
  index,
  selected,
  onSelect,
  onRemove,
}: {
  block: Block;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.clientId,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded border p-2 ${
        selected ? 'border-neutral-900' : ''
      }`}
    >
      <button
        type="button"
        className="cursor-grab px-1 text-xs opacity-60 active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <button type="button" className="flex-1 text-left" onClick={onSelect}>
        {index + 1}. {block.type}
      </button>
      <button type="button" className="text-xs text-red-600 underline" onClick={onRemove}>
        Remove
      </button>
    </div>
  );
}

function PropField({
  blockType,
  fieldKey,
  value,
  onChange,
  editorKey,
}: {
  blockType: BlockType;
  fieldKey: string;
  value: string;
  onChange: (v: string) => void;
  editorKey?: string;
}) {
  if (blockType === 'richText' && fieldKey === 'html') {
    return (
      <div className="mt-1">
        <ArticleEditor
          key={editorKey ?? 'richtext'}
          initialContent={value || '<p></p>'}
          onChange={onChange}
          placeholder="Write page copy…"
          className="text-sm"
          enableMediaLibrary
        />
      </div>
    );
  }

  if (
    fieldKey === 'url' ||
    fieldKey === 'imageUrl' ||
    fieldKey === 'leftImageUrl' ||
    fieldKey === 'rightImageUrl'
  ) {
    return <CmsMediaField value={value} onChange={onChange} />;
  }

  if (fieldKey === 'html' || fieldKey === 'subcopy' || fieldKey === 'productSlugs' || fieldKey === 'brands' || fieldKey === 'usps' || fieldKey === 'body' || fieldKey === 'subtitle' || fieldKey === 'shopLinks' || fieldKey === 'companyLinks' || fieldKey === 'trustLine') {
    return (
      <textarea
        className="mt-1 block w-full rounded border px-2 py-1 min-h-[80px] font-mono text-xs"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          fieldKey === 'brands'
            ? 'Name | /gift/brands/x.svg, …'
            : fieldKey === 'usps'
              ? 'heart:Personalised with care, package:Ready-made hampers'
              : fieldKey === 'shopLinks' || fieldKey === 'companyLinks'
                ? 'Label | /path (one per line)'
                : fieldKey === 'trustLine'
                  ? 'Chip A · Chip B · Chip C'
                  : fieldKey === 'productSlugs'
                    ? 'one, two, three'
                    : undefined
        }
      />
    );
  }

  if (fieldKey === 'size') {
    return (
      <select
        className="mt-1 block w-full rounded border px-2 py-1"
        value={value || 'md'}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="sm">sm</option>
        <option value="md">md</option>
        <option value="lg">lg</option>
      </select>
    );
  }

  if (fieldKey === 'tone' && blockType === 'saleStrip') {
    return (
      <select
        className="mt-1 block w-full rounded border px-2 py-1"
        value={value || 'blush'}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="blush">blush</option>
        <option value="mint">mint</option>
        <option value="sky">sky</option>
        <option value="soft">soft</option>
      </select>
    );
  }

  if (fieldKey === 'hamper' || fieldKey === 'showUsps') {
    return (
      <select
        className="mt-1 block w-full rounded border px-2 py-1"
        value={value === 'true' ? 'true' : 'false'}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="false">false</option>
        <option value="true">true</option>
      </select>
    );
  }

  if (fieldKey === 'leftAccent' || fieldKey === 'rightAccent') {
    return (
      <select
        className="mt-1 block w-full rounded border px-2 py-1"
        value={value === 'sky' ? 'sky' : 'pink'}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="pink">pink</option>
        <option value="sky">sky</option>
      </select>
    );
  }

  if (fieldKey === 'variant') {
    if (blockType === 'hero') {
      return (
        <select
          className="mt-1 block w-full rounded border px-2 py-1"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">(default)</option>
          <option value="storefront">storefront</option>
          <option value="panel">panel</option>
        </select>
      );
    }
    return (
      <select
        className="mt-1 block w-full rounded border px-2 py-1"
        value={value || 'primary'}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="primary">primary</option>
        <option value="secondary">secondary</option>
      </select>
    );
  }

  return (
    <input
      className="mt-1 block w-full rounded border px-2 py-1"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default function AdminCmsPageEditor({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [page, setPage] = useState<MarketingPage | null>(null);
  const [title, setTitle] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selected, setSelected] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = useMemo(() => blocks.map((b) => b.clientId), [blocks]);
  const isHomepage = page ? page.slug === 'home' || Boolean(page.isHomepage) : false;

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(`/login?next=/admin/cms/pages/${params.id}`);
      return;
    }
    apiAuth<MarketingPage>(`/admin/cms/pages/${params.id}`)
      .then((p) => {
        setPage(p);
        setTitle(p.title);
        setSeoTitle(p.seoTitle ?? '');
        setSeoDescription(p.seoDescription ?? '');
        setBlocks(toEditable(p.blocks));
      })
      .catch(() => router.replace('/admin/cms/pages'));
  }, [params.id, router]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setBlocks((prev) => {
      const oldIndex = prev.findIndex((b) => b.clientId === active.id);
      const newIndex = prev.findIndex((b) => b.clientId === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const next = arrayMove(prev, oldIndex, newIndex);
      setSelected(newIndex);
      return next;
    });
  }

  function addBlock(type: BlockType) {
    setBlocks((prev) => {
      const next = [...prev, { clientId: newClientId(), type, props: { ...EMPTY_PROPS[type] } }];
      setSelected(next.length - 1);
      return next;
    });
  }

  function removeBlock(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
    setSelected(0);
  }

  function updateProp(key: string, value: string) {
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === selected ? { ...b, props: { ...b.props, [key]: value } } : b,
      ),
    );
  }

  async function save(e?: FormEvent) {
    e?.preventDefault();
    if (!page) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const updated = await apiAuth<MarketingPage>(`/admin/cms/pages/${page.id}`, {
        method: 'PATCH',
        json: {
          title,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          blocks: toPayload(blocks),
        },
      });
      setPage(updated);
      setBlocks(toEditable(updated.blocks));
      setMsg('Saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!page) return;
    await save();
    setBusy(true);
    try {
      const updated = await apiAuth<MarketingPage>(`/admin/cms/pages/${page.id}/publish`, {
        method: 'POST',
      });
      setPage(updated);
      setMsg('Published');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setBusy(false);
    }
  }

  async function unpublish() {
    if (!page || isHomepage) return;
    setBusy(true);
    try {
      const updated = await apiAuth<MarketingPage>(`/admin/cms/pages/${page.id}/unpublish`, {
        method: 'POST',
      });
      setPage(updated);
      setMsg('Unpublished');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unpublish failed');
    } finally {
      setBusy(false);
    }
  }

  if (!page) {
    return <main className="p-8 text-sm opacity-70">Loading page…</main>;
  }

  const current = blocks[selected];

  return (
    <main className="min-h-screen p-8 max-w-5xl">
      <Link href="/admin/cms/pages" className="text-sm underline opacity-70">
        ← Pages
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{page.title}</h1>
          <p className="text-sm opacity-70">
            /pages/{page.slug} · {page.status}
            {page.status === 'PUBLISHED' ? (
              <>
                {' '}
                ·{' '}
                <Link href={`/pages/${page.slug}`} className="underline">
                  View live
                </Link>
              </>
            ) : null}
          </p>
          {isHomepage ? (
            <p className="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
              Soft Gift homepage — cannot delete/unpublish
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="rounded border px-3 py-1.5 disabled:opacity-50"
          >
            Save draft
          </button>
          <Link
            href={`/pages/preview/${page.id}`}
            className="rounded border px-3 py-1.5"
            target="_blank"
            rel="noreferrer"
          >
            Preview
          </Link>
          {page.status === 'PUBLISHED' ? (
            isHomepage ? null : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void unpublish()}
                className="rounded border px-3 py-1.5"
              >
                Unpublish
              </button>
            )
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void publish()}
              className="rounded bg-neutral-900 px-3 py-1.5 text-white"
            >
              Publish
            </button>
          )}
        </div>
      </div>

      <form onSubmit={(e) => void save(e)} className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr_1fr]">
        <aside className="space-y-2 text-sm">
          <p className="font-medium">Add block</p>
          {ALL_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className="block w-full rounded border px-2 py-1.5 text-left"
              onClick={() => addBlock(t)}
            >
              {t}
            </button>
          ))}
        </aside>

        <section className="space-y-2 text-sm">
          <p className="font-medium">Blocks (drag to reorder)</p>
          {blocks.length === 0 ? (
            <p className="opacity-70">No blocks — add from the left.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                {blocks.map((b, i) => (
                  <SortableRow
                    key={b.clientId}
                    block={b}
                    index={i}
                    selected={i === selected}
                    onSelect={() => setSelected(i)}
                    onRemove={() => removeBlock(i)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </section>

        <aside className="space-y-3 text-sm">
          <label className="block">
            Title
            <input
              className="mt-1 block w-full rounded border px-2 py-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block">
            SEO title
            <input
              className="mt-1 block w-full rounded border px-2 py-1"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
          </label>
          <label className="block">
            SEO description
            <textarea
              className="mt-1 block w-full rounded border px-2 py-1 min-h-[64px]"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
            />
          </label>
          {current ? (
            <div className="border-t pt-3 space-y-2">
              <p className="font-medium">Props · {current.type}</p>
              {Object.keys(EMPTY_PROPS[current.type]).map((key) => (
                <label key={key} className="block">
                  {key}
                  <PropField
                    blockType={current.type}
                    fieldKey={key}
                    value={current.props[key] ?? ''}
                    onChange={(v) => updateProp(key, v)}
                    editorKey={current.clientId}
                  />
                </label>
              ))}
            </div>
          ) : null}
        </aside>
      </form>

      {msg ? <p className="mt-4 text-sm text-green-700">{msg}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </main>
  );
}
