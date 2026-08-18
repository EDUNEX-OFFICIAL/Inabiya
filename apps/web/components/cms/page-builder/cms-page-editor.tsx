'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { arrayMove } from '@dnd-kit/sortable';
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  ChevronLeft,
  ExternalLink,
  Loader2,
  PanelLeft,
  PanelLeftClose,
  PanelRight,
  PanelRightClose,
} from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { defaultPathForCmsSlug, getSiteOrigin, webPageJsonLd } from '@/lib/cms-seo';
import { collectCmsFaqJsonLd } from '@/lib/seo-json-ld/cms-faq';
import type { SeoSchemaEntry } from '@inabiya/validation';
import {
  cmsCanvasCollision,
  dropIndexForOver,
  remapSelectedAfterMove,
  toggleSectionPreview,
} from './cms-canvas-dnd';
import { CmsBlockPalette } from './cms-block-palette';
import { CmsBlockCanvas, CmsCanvasDragPreview } from './cms-block-canvas';
import { CmsBlockInspector } from './cms-block-inspector';
import { CmsPageSeoForm } from './cms-page-seo-form';
import { CmsSectionPreview } from './cms-section-preview';
import {
  INSERTER_DEFAULT_PX,
  INSERTER_MAX_PX,
  INSERTER_WIDTH_KEY,
  INSPECTOR_DEFAULT_PX,
  INSPECTOR_MAX_PX,
  INSPECTOR_WIDTH_KEY,
  PanelResizeHandle,
  readPanelWidth,
  writePanelWidth,
} from './cms-panel-resize';
import {
  createBlockFromInsert,
  isHomepagePage,
  newClientId,
  toEditable,
  toPayload,
  type Block,
  type PaletteInsert,
  type MarketingPage,
} from './cms-page-model';

type InspectorTab = 'block' | 'seo';

const INSERTER_KEY = 'inabiya.cms.builder.inserter';
const INSPECTOR_KEY = 'inabiya.cms.builder.inspector';

function readOpen(key: string, fallback = true): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === '0') return false;
    if (v === '1') return true;
  } catch {
    /* ignore */
  }
  return fallback;
}

function writeOpen(key: string, open: boolean) {
  try {
    localStorage.setItem(key, open ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function panelToggleClass(open: boolean) {
  return `inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium ${
    open
      ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
      : 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--primary)_14%,var(--surface))]'
  }`;
}

function EdgeReopen({
  side,
  label,
  onClick,
}: {
  side: 'left' | 'right';
  label: string;
  onClick: () => void;
}) {
  const Icon = side === 'left' ? PanelLeft : PanelRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${label.toLowerCase()}`}
      title={`Open ${label.toLowerCase()}`}
      className={`flex w-9 shrink-0 flex-col items-center justify-center gap-2 bg-[color-mix(in_srgb,var(--primary)_14%,var(--surface))] text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--primary)_22%,var(--surface))] ${
        side === 'left' ? 'border-r' : 'border-l'
      } border-[var(--border-subtle)]`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span
        className={`text-[10px] font-medium tracking-wide [writing-mode:vertical-rl] ${
          side === 'left' ? 'rotate-180' : ''
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function statusTone(status: string): string {
  if (status === 'PUBLISHED') return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80';
  return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80';
}

export function CmsPageEditor({ pageId }: { pageId: string }) {
  const router = useRouter();
  const [page, setPage] = useState<MarketingPage | null>(null);
  const [title, setTitle] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [canonicalPath, setCanonicalPath] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [robotsIndex, setRobotsIndex] = useState(true);
  const [seoSchemaExtras, setSeoSchemaExtras] = useState<SeoSchemaEntry[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selected, setSelected] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [tab, setTab] = useState<InspectorTab>('block');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [dragInsert, setDragInsert] = useState<PaletteInsert | null>(null);
  const [dragBlock, setDragBlock] = useState<Block | null>(null);
  const [resolvedExtras, setResolvedExtras] = useState<Record<string, Record<string, unknown>>>({});
  const [inserterOpen, setInserterOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [inserterWidth, setInserterWidth] = useState(INSERTER_DEFAULT_PX);
  const [inspectorWidth, setInspectorWidth] = useState(INSPECTOR_DEFAULT_PX);
  const savedSnap = useRef('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const draftSnap = useMemo(
    () =>
      JSON.stringify({
        title,
        seoTitle,
        seoDescription,
        canonicalPath,
        ogImageUrl,
        robotsIndex,
        seoSchemaExtras,
        blocks,
      }),
    [
      title,
      seoTitle,
      seoDescription,
      canonicalPath,
      ogImageUrl,
      robotsIndex,
      seoSchemaExtras,
      blocks,
    ],
  );
  const dirty = Boolean(savedSnap.current) && draftSnap !== savedSnap.current;
  const isHomepage = page ? isHomepagePage(page) : false;
  const current = blocks[selected] ?? null;
  const schemaAutoNodes = useMemo(() => {
    if (!page) return [];
    return [
      webPageJsonLd({
        slug: page.slug,
        title,
        seoTitle,
        seoDescription,
        canonicalPath,
        ogImageUrl,
        robotsIndex,
      }),
      collectCmsFaqJsonLd(blocks),
    ];
  }, [page, title, seoTitle, seoDescription, canonicalPath, ogImageUrl, robotsIndex, blocks]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl(`/admin/cms/pages/${pageId}`));
      return;
    }
    apiAuth<MarketingPage>(`/admin/cms/pages/${pageId}`)
      .then((p) => {
        setPage(p);
        setTitle(p.title);
        setSeoTitle(p.seoTitle ?? '');
        setSeoDescription(p.seoDescription ?? '');
        setCanonicalPath(p.canonicalPath ?? '');
        setOgImageUrl(p.ogImageUrl ?? '');
        setRobotsIndex(p.robotsIndex !== false);
        setSeoSchemaExtras(p.seoSchemaExtras ?? []);
        const nextBlocks = toEditable(p.blocks);
        const extras: Record<string, Record<string, unknown>> = {};
        for (const b of p.blocks) {
          const raw = b.props ?? {};
          const extra: Record<string, unknown> = {};
          if (Array.isArray(raw.products)) extra.products = raw.products;
          if (Array.isArray(raw.articles)) extra.articles = raw.articles;
          if (Object.keys(extra).length) extras[b.id] = extra;
        }
        setResolvedExtras(extras);
        setBlocks(nextBlocks);
        savedSnap.current = JSON.stringify({
          title: p.title,
          seoTitle: p.seoTitle ?? '',
          seoDescription: p.seoDescription ?? '',
          canonicalPath: p.canonicalPath ?? '',
          ogImageUrl: p.ogImageUrl ?? '',
          robotsIndex: p.robotsIndex !== false,
          seoSchemaExtras: p.seoSchemaExtras ?? [],
          blocks: nextBlocks,
        });
      })
      .catch(() => setLoadError(true));
  }, [pageId, router]);

  useEffect(() => {
    setInserterOpen(readOpen(INSERTER_KEY));
    setInspectorOpen(readOpen(INSPECTOR_KEY));
    setInserterWidth(readPanelWidth(INSERTER_WIDTH_KEY, INSERTER_DEFAULT_PX));
    setInspectorWidth(readPanelWidth(INSPECTOR_WIDTH_KEY, INSPECTOR_DEFAULT_PX));
  }, []);

  function setInserterOpenPersist(next: boolean) {
    setInserterOpen(next);
    writeOpen(INSERTER_KEY, next);
  }

  function setInspectorOpenPersist(next: boolean) {
    setInspectorOpen(next);
    writeOpen(INSPECTOR_KEY, next);
  }

  function toggleInserter() {
    setInserterOpenPersist(!inserterOpen);
  }

  function toggleInspector() {
    setInspectorOpenPersist(!inspectorOpen);
  }

  const commitInserterWidth = useCallback((w: number) => {
    setInserterWidth(w);
    writePanelWidth(INSERTER_WIDTH_KEY, w);
  }, []);

  const commitInspectorWidth = useCallback((w: number) => {
    setInspectorWidth(w);
    writePanelWidth(INSPECTOR_WIDTH_KEY, w);
  }, []);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const save = useCallback(async () => {
    if (!page) return false;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      let blockPayload;
      try {
        blockPayload = toPayload(blocks);
      } catch (payloadErr) {
        setError(payloadErr instanceof Error ? payloadErr.message : 'Invalid blocks');
        return false;
      }
      const updated = await apiAuth<MarketingPage>(`/admin/cms/pages/${page.id}`, {
        method: 'PATCH',
        json: {
          title,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          canonicalPath: canonicalPath.trim() || null,
          ogImageUrl: ogImageUrl.trim() || null,
          robotsIndex,
          seoSchemaExtras: seoSchemaExtras.length ? seoSchemaExtras : null,
          blocks: blockPayload,
        },
      });
      setPage((prev) =>
        prev
          ? {
              ...prev,
              title: updated.title,
              status: updated.status,
              seoTitle: updated.seoTitle,
              seoDescription: updated.seoDescription,
              canonicalPath: updated.canonicalPath,
              ogImageUrl: updated.ogImageUrl,
              robotsIndex: updated.robotsIndex,
              seoSchemaExtras: updated.seoSchemaExtras,
            }
          : updated,
      );
      setCanonicalPath(updated.canonicalPath ?? '');
      setOgImageUrl(updated.ogImageUrl ?? '');
      setRobotsIndex(updated.robotsIndex !== false);
      setSeoSchemaExtras(updated.seoSchemaExtras ?? []);
      savedSnap.current = JSON.stringify({
        title,
        seoTitle,
        seoDescription,
        canonicalPath: updated.canonicalPath ?? '',
        ogImageUrl: updated.ogImageUrl ?? '',
        robotsIndex: updated.robotsIndex !== false,
        seoSchemaExtras: updated.seoSchemaExtras ?? [],
        blocks,
      });
      setMsg('Saved');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      return false;
    } finally {
      setBusy(false);
    }
  }, [
    page,
    blocks,
    title,
    seoTitle,
    seoDescription,
    canonicalPath,
    ogImageUrl,
    robotsIndex,
    seoSchemaExtras,
  ]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void save();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  function clearDrag() {
    setDragInsert(null);
    setDragBlock(null);
  }

  function onDragStart(event: DragStartEvent) {
    const insert = event.active.data.current?.insert as PaletteInsert | undefined;
    setDragInsert(insert ?? null);
    if (event.active.data.current?.source === 'canvas') {
      const block = blocks.find((b) => b.clientId === event.active.id) ?? null;
      setDragBlock(block);
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    clearDrag();
    const insert = active.data.current?.insert as PaletteInsert | undefined;
    if (insert) {
      if (!over) return;
      setBlocks((prev) => {
        const index = dropIndexForOver(
          over.id,
          prev.map((b) => b.clientId),
        );
        const block = createBlockFromInsert(insert);
        const next = [...prev.slice(0, index), block, ...prev.slice(index)];
        setSelected(index);
        setPreviewOpen(true);
        return next;
      });
      setTab('block');
      return;
    }
    if (!over || active.id === over.id) return;
    setBlocks((prev) => {
      const oldIndex = prev.findIndex((b) => b.clientId === active.id);
      const newIndex = prev.findIndex((b) => b.clientId === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const next = arrayMove(prev, oldIndex, newIndex);
      setSelected(remapSelectedAfterMove(selected, oldIndex, newIndex));
      return next;
    });
  }

  function addInsert(insert: PaletteInsert) {
    setBlocks((prev) => {
      const next = [...prev, createBlockFromInsert(insert)];
      setSelected(next.length - 1);
      setPreviewOpen(true);
      return next;
    });
    setTab('block');
  }

  function removeBlock(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
    setSelected((s) => (s >= index ? Math.max(0, s - 1) : s));
  }

  function duplicateBlock(index: number) {
    setBlocks((prev) => {
      const src = prev[index];
      if (!src) return prev;
      const copy: Block = {
        clientId: newClientId(),
        type: src.type,
        props: { ...src.props },
      };
      setResolvedExtras((map) => {
        const extra = map[src.clientId];
        return extra ? { ...map, [copy.clientId]: extra } : map;
      });
      const next = [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
      setSelected(index + 1);
      setPreviewOpen(true);
      return next;
    });
    setTab('block');
  }

  function updateProp(key: string, value: string) {
    setBlocks((prev) =>
      prev.map((b, i) => (i === selected ? { ...b, props: { ...b.props, [key]: value } } : b)),
    );
  }

  async function publish() {
    if (!page) return;
    const ok = await save();
    if (!ok) return;
    setBusy(true);
    try {
      const updated = await apiAuth<MarketingPage>(`/admin/cms/pages/${page.id}/publish`, {
        method: 'POST',
      });
      setPage((prev) => (prev ? { ...prev, status: updated.status } : updated));
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
      setPage((prev) => (prev ? { ...prev, status: updated.status } : updated));
      setMsg('Unpublished');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unpublish failed');
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="font-medium">Page not found</p>
        <Link href="/admin/cms/pages" className="clay-btn-secondary mt-4 inline-flex text-sm">
          Back to pages
        </Link>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm opacity-70">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading page…
      </div>
    );
  }

  const livePath = page.canonicalPath?.trim() || defaultPathForCmsSlug(page.slug);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={cmsCanvasCollision}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={clearDrag}
    >
      <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin/cms/pages"
              className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Pages
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-display text-lg leading-tight">{page.title}</h1>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusTone(page.status)}`}
                >
                  {page.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                </span>
                {dirty ? (
                  <span className="text-xs text-amber-800">Unsaved</span>
                ) : msg ? (
                  <span className="text-xs text-emerald-700">{msg}</span>
                ) : null}
              </div>
              <p className="ops-muted font-mono text-[11px]">
                {livePath}
                {page.status === 'PUBLISHED' ? (
                  <>
                    {' '}
                    ·{' '}
                    <Link href={livePath} className="underline" target="_blank" rel="noreferrer">
                      View live
                    </Link>
                  </>
                ) : null}
                {isHomepage ? ' · Homepage' : null}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={panelToggleClass(inserterOpen)}
              aria-pressed={inserterOpen}
              aria-label={inserterOpen ? 'Close blocks' : 'Open blocks'}
              onClick={toggleInserter}
            >
              <PanelLeft className="h-4 w-4" aria-hidden />
              Blocks
            </button>
            <button
              type="button"
              className={panelToggleClass(inspectorOpen)}
              aria-pressed={inspectorOpen}
              aria-label={inspectorOpen ? 'Close inspector' : 'Open inspector'}
              onClick={toggleInspector}
            >
              <PanelRight className="h-4 w-4" aria-hidden />
              Inspector
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void save()}
              className="clay-btn-secondary min-h-9 text-sm disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
            <Link
              href={`/pages/preview/${page.id}`}
              className="clay-btn-ghost inline-flex min-h-9 items-center gap-1 text-sm"
              target="_blank"
              rel="noreferrer"
            >
              Preview
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
            {page.status === 'PUBLISHED' ? (
              isHomepage ? null : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void unpublish()}
                  className="clay-btn-ghost min-h-9 text-sm"
                >
                  Unpublish
                </button>
              )
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void publish()}
                className="clay-btn min-h-9 text-sm"
              >
                Publish
              </button>
            )}
          </div>
        </header>

        {error ? (
          <p className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex min-h-0 min-w-0 flex-1">
          {inserterOpen ? (
            <>
              <aside
                className="min-h-0 shrink-0 overflow-y-auto border-r border-[var(--border-subtle)] bg-[var(--surface)] p-3"
                style={{ width: inserterWidth }}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Blocks</p>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
                    aria-label="Close blocks"
                    onClick={toggleInserter}
                  >
                    <PanelLeftClose className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <CmsBlockPalette onAdd={addInsert} />
              </aside>
              <PanelResizeHandle
                grow="east"
                width={inserterWidth}
                max={INSERTER_MAX_PX}
                onWidth={setInserterWidth}
                onCommit={commitInserterWidth}
                onClose={() => setInserterOpenPersist(false)}
                label="Resize blocks panel"
              />
            </>
          ) : null}

          <section className="flex min-h-0 min-w-0 flex-1">
            {inserterOpen ? null : (
              <EdgeReopen side="left" label="Blocks" onClick={toggleInserter} />
            )}
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-3">
              <p className="mb-2 text-sm font-medium">
                Blocks
                <span className="ops-muted ml-1.5 font-normal">{blocks.length}</span>
              </p>
              <CmsBlockCanvas
                blocks={blocks}
                selected={selected}
                previewOpen={previewOpen}
                onSelect={(i) => {
                  const next = toggleSectionPreview(selected, previewOpen, i);
                  setSelected(next.selected);
                  setPreviewOpen(next.previewOpen);
                  if (next.previewOpen) setTab('block');
                }}
                onRemove={removeBlock}
                onDuplicate={duplicateBlock}
                preview={
                  current ? (
                    <CmsSectionPreview
                      key={current.clientId}
                      block={current}
                      extras={resolvedExtras[current.clientId]}
                    />
                  ) : null
                }
              />
            </div>
            {inspectorOpen ? null : (
              <EdgeReopen side="right" label="Inspector" onClick={toggleInspector} />
            )}
          </section>

          {inspectorOpen ? (
            <>
              <PanelResizeHandle
                grow="west"
                width={inspectorWidth}
                max={INSPECTOR_MAX_PX}
                onWidth={setInspectorWidth}
                onCommit={commitInspectorWidth}
                onClose={() => setInspectorOpenPersist(false)}
                label="Resize inspector panel"
              />
              <aside
                className="flex min-h-0 shrink-0 flex-col overflow-hidden border-l border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_70%,var(--background))]"
                style={{ width: inspectorWidth }}
              >
                <div className="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    <div
                      className="grid min-w-0 flex-1 grid-cols-2 gap-0.5 rounded-lg bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] p-0.5"
                      role="tablist"
                      aria-label="Inspector"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'block'}
                        className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
                          tab === 'block'
                            ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                        }`}
                        onClick={() => setTab('block')}
                      >
                        Block
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'seo'}
                        className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
                          tab === 'seo'
                            ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                        }`}
                        onClick={() => setTab('seo')}
                      >
                        SEO
                      </button>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
                      aria-label="Close inspector"
                      onClick={toggleInspector}
                    >
                      <PanelRightClose className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                  {tab === 'seo' ? (
                    <CmsPageSeoForm
                      title={title}
                      seoTitle={seoTitle}
                      seoDescription={seoDescription}
                      canonicalPath={canonicalPath}
                      ogImageUrl={ogImageUrl}
                      robotsIndex={robotsIndex}
                      seoSchemaExtras={seoSchemaExtras}
                      autoPreviewNodes={schemaAutoNodes}
                      publicUrl={`${getSiteOrigin()}${canonicalPath.trim() || livePath}`}
                      onTitle={setTitle}
                      onSeoTitle={setSeoTitle}
                      onSeoDescription={setSeoDescription}
                      onCanonicalPath={setCanonicalPath}
                      onOgImageUrl={setOgImageUrl}
                      onRobotsIndex={setRobotsIndex}
                      onSeoSchemaExtras={setSeoSchemaExtras}
                    />
                  ) : current ? (
                    <CmsBlockInspector block={current} onChange={updateProp} />
                  ) : (
                    <p className="ops-muted text-sm">Select a block</p>
                  )}
                </div>
              </aside>
            </>
          ) : null}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {dragInsert ? (
          <div className="rounded-lg border border-[var(--primary)] bg-[var(--surface)] px-3 py-2 text-xs font-medium shadow-lg">
            {dragInsert.label}
          </div>
        ) : dragBlock ? (
          <CmsCanvasDragPreview block={dragBlock} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
