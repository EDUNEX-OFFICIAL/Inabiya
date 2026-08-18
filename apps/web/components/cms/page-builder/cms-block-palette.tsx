'use client';

import { useDraggable } from '@dnd-kit/core';
import {
  AlignLeft,
  Columns2,
  Columns3,
  Images,
  LayoutTemplate,
  PanelLeft,
  PanelRight,
  RectangleHorizontal,
  FileText,
  Image as ImageIcon,
  UnfoldVertical,
  PanelBottom,
  LayoutGrid,
  Baby,
  Award,
  Gift,
  BookOpen,
  HelpCircle,
  Megaphone,
  Quote,
  Timer,
  MousePointerClick,
  SquareDashed,
  GalleryHorizontal,
  MessageCircle,
  Ticket,
  Minus,
  type LucideIcon,
} from 'lucide-react';
import {
  PALETTE_INSERTS,
  parseHeroLayout,
  parseCustomSectionLayout,
  type BlockType,
  type PaletteInsert,
} from './cms-page-model';
import { HeroLayoutThumb } from './cms-layout-thumb';

const TYPE_ICONS: Record<BlockType, LucideIcon> = {
  hero: RectangleHorizontal,
  richText: FileText,
  image: ImageIcon,
  productGrid: LayoutGrid,
  cta: MousePointerClick,
  spacer: UnfoldVertical,
  brandStrip: Award,
  recipientSplit: Baby,
  discoveryChips: LayoutTemplate,
  buildYourBoxTeaser: Gift,
  articleTeasers: BookOpen,
  footer: PanelBottom,
  saleStrip: Megaphone,
  faq: HelpCircle,
  exclusiveOffers: Gift,
  testimonials: Quote,
  countdown: Timer,
  featuredCarousel: GalleryHorizontal,
  whatsappCta: MessageCircle,
  offerCarousel: Ticket,
  thinStrip: Minus,
  customSection: SquareDashed,
};

const CUSTOM_ICONS: Record<string, LucideIcon> = {
  stack: SquareDashed,
  split: PanelRight,
  splitReverse: PanelLeft,
  two: Columns2,
  three: Columns3,
  bleed: RectangleHorizontal,
};

const HERO_ICONS: Record<string, LucideIcon> = {
  full: RectangleHorizontal,
  fullText: AlignLeft,
  splitMediaCopy: PanelLeft,
  splitCopyMedia: PanelRight,
  splitMedia: Images,
  splitCopy: Columns2,
};

type Props = {
  onAdd: (insert: PaletteInsert) => void;
};

function PaletteCard({
  insert,
  onAdd,
}: {
  insert: PaletteInsert;
  onAdd: (insert: PaletteInsert) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${insert.id}`,
    data: { source: 'palette', insert },
  });
  const layout = insert.type === 'hero' ? parseHeroLayout(insert.props?.layout) : undefined;
  const customLayout =
    insert.type === 'customSection' ? parseCustomSectionLayout(insert.props?.layout) : undefined;
  const Icon =
    (layout ? HERO_ICONS[layout] : null) ??
    (customLayout ? CUSTOM_ICONS[customLayout] : null) ??
    TYPE_ICONS[insert.type];

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`flex w-full items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-2 py-1.5 text-left text-xs hover:border-[var(--primary)] ${
        isDragging ? 'opacity-40' : ''
      }`}
      onClick={() => onAdd(insert)}
      {...listeners}
      {...attributes}
    >
      {insert.type === 'hero' ? (
        <HeroLayoutThumb layout={layout} />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[var(--border-subtle)] text-[var(--muted-foreground)]">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
      )}
      <span className="min-w-0 flex-1 font-medium leading-tight">{insert.label}</span>
    </button>
  );
}

export function CmsBlockPalette({ onAdd }: Props) {
  const groups: Array<{ id: string; label: string; items: PaletteInsert[] }> = [];
  for (const insert of PALETTE_INSERTS) {
    const last = groups.at(-1);
    if (!last || last.id !== insert.group) {
      groups.push({ id: insert.group, label: insert.groupLabel, items: [insert] });
    } else {
      last.items.push(insert);
    }
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            {group.label}
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {group.items.map((insert) => (
              <PaletteCard key={insert.id} insert={insert} onAdd={onAdd} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
