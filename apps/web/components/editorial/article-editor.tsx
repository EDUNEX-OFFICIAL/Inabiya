'use client';

import { useEffect, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { normalizeArticleBody } from '@/lib/article-html';
import { MediaLibraryModal, uploadCmsMediaFile } from '@/components/cms/cms-media-field';

type Props = {
  /** Initial HTML/plain body — remount via parent `key` when reloading from server */
  initialContent: string;
  onChange: (html: string) => void;
  editable?: boolean;
  className?: string;
  /** TipTap placeholder when empty */
  placeholder?: string;
  /** Show media library / upload for images (CMS + editorial). */
  enableMediaLibrary?: boolean;
  /** Image / upload / library controls. Default true. */
  showImages?: boolean;
  /** Code block control. Default true. */
  showCode?: boolean;
  /** Show Insert table toolbar button. Schema always loads so paste works. Default true. */
  showTable?: boolean;
};

const selectCls =
  'h-7 max-w-[6.5rem] rounded border border-black/10 bg-white/80 px-1.5 text-xs disabled:opacity-40';

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active ? true : false}
      className={`rounded px-2 py-1 text-xs border ${
        active ? 'bg-[var(--primary)] text-white border-transparent' : 'bg-white/80 border-black/10'
      } disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function blockTypeValue(editor: Editor): string {
  if (editor.isActive('heading', { level: 2 })) return 'h2';
  if (editor.isActive('heading', { level: 3 })) return 'h3';
  if (editor.isActive('heading', { level: 4 })) return 'h4';
  return 'p';
}

function listValue(editor: Editor): string {
  if (editor.isActive('bulletList')) return 'bullet';
  if (editor.isActive('orderedList')) return 'ordered';
  return '';
}

function alignValue(editor: Editor): string {
  if (editor.isActive({ textAlign: 'center' })) return 'center';
  if (editor.isActive({ textAlign: 'right' })) return 'right';
  return 'left';
}

export function ArticleEditor({
  initialContent,
  onChange,
  editable = true,
  className,
  placeholder = 'Write the article…',
  enableMediaLibrary = false,
  showImages = true,
  showCode = true,
  showTable = true,
}: Props) {
  const imagesOn = showImages;
  const [libraryOpen, setLibraryOpen] = useState(false);
  /** TipTap selection changes don't always re-render React — tick refreshes active toolbar state. */
  const [, setSelTick] = useState(0);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // H1 reserved for page title — body uses H2–H4 only.
        heading: { levels: [2, 3, 4] },
        codeBlock: showCode ? { HTMLAttributes: { class: 'article-code' } } : false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      ...(imagesOn ? [Image.configure({ allowBase64: false })] : []),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      // Always register table schema so pasted / saved HTML tables round-trip.
      // `showTable` only controls the Insert toolbar button.
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: normalizeArticleBody(initialContent),
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'article-prose min-h-[280px] max-w-none px-3 py-4 focus:outline-none font-body text-[15px] leading-7',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    onSelectionUpdate: () => {
      setSelTick((n) => n + 1);
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor) return;
    const bump = () => setSelTick((n) => n + 1);
    editor.on('transaction', bump);
    return () => {
      editor.off('transaction', bump);
    };
  }, [editor]);

  if (!editor) {
    return (
      <div className="rounded border min-h-[280px] p-3 text-sm opacity-60">Loading editor…</div>
    );
  }

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  function setImage() {
    if (!editor || !imagesOn) return;
    if (enableMediaLibrary) {
      setLibraryOpen(true);
      return;
    }
    const url = window.prompt('Image URL (https://…)');
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }

  async function uploadImageFile(file: File | null) {
    if (!editor || !file || !imagesOn) return;
    try {
      const asset = await uploadCmsMediaFile(file);
      const url = asset.publicUrl ?? `/api/v1/media/${asset.id}/content`;
      editor.chain().focus().setImage({ src: url }).run();
    } catch (e) {
      window.alert(String((e as Error).message ?? e));
    }
  }

  function onBlockType(value: string) {
    const ed = editor;
    if (!ed) return;
    const chain = ed.chain().focus();
    if (value === 'p') chain.setParagraph().run();
    else if (value === 'h2') chain.setHeading({ level: 2 }).run();
    else if (value === 'h3') chain.setHeading({ level: 3 }).run();
    else if (value === 'h4') chain.setHeading({ level: 4 }).run();
  }

  function onList(value: string) {
    const ed = editor;
    if (!ed) return;
    const chain = ed.chain().focus();
    if (value === 'bullet') {
      if (!ed.isActive('bulletList')) chain.toggleBulletList().run();
      return;
    }
    if (value === 'ordered') {
      if (!ed.isActive('orderedList')) chain.toggleOrderedList().run();
      return;
    }
    if (ed.isActive('bulletList')) chain.toggleBulletList().run();
    else if (ed.isActive('orderedList')) chain.toggleOrderedList().run();
  }

  function onAlign(value: string) {
    editor?.chain().focus().setTextAlign(value).run();
  }

  return (
    <div
      className={`rounded border border-black/15 bg-white/90 overflow-hidden ${className ?? ''}`}
    >
      {editable ? (
        <div className="flex flex-wrap items-center gap-1 border-b border-black/10 bg-[var(--background)] p-2">
          <select
            className={selectCls}
            aria-label="Text style"
            value={blockTypeValue(editor)}
            onChange={(e) => onBlockType(e.target.value)}
          >
            <option value="p">Paragraph</option>
            <option value="h2">H2</option>
            <option value="h3">H3</option>
            <option value="h4">H4</option>
          </select>

          <select
            className={selectCls}
            aria-label="List"
            value={listValue(editor)}
            onChange={(e) => onList(e.target.value)}
          >
            <option value="">List</option>
            <option value="bullet">• Bullets</option>
            <option value="ordered">1. Numbered</option>
          </select>

          <select
            className={selectCls}
            aria-label="Align"
            value={alignValue(editor)}
            onChange={(e) => onAlign(e.target.value)}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>

          <ToolbarButton
            title="Bold"
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            B
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            I
          </ToolbarButton>
          <ToolbarButton
            title="Underline"
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            U
          </ToolbarButton>
          <ToolbarButton
            title="Strike"
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            S
          </ToolbarButton>
          <ToolbarButton
            title="Quote"
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            Quote
          </ToolbarButton>
          {showCode ? (
            <ToolbarButton
              title="Code block"
              active={editor.isActive('codeBlock')}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            >
              Code
            </ToolbarButton>
          ) : null}
          <ToolbarButton
            title="Horizontal rule"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            —
          </ToolbarButton>
          <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
            Link
          </ToolbarButton>
          {imagesOn ? (
            <>
              <ToolbarButton title="Image" onClick={setImage}>
                Image
              </ToolbarButton>
              {enableMediaLibrary ? (
                <>
                  <label className="cursor-pointer rounded border border-black/10 bg-white/80 px-2 py-1 text-xs hover:bg-black/5">
                    Upload
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => void uploadImageFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <ToolbarButton title="Media library" onClick={() => setLibraryOpen(true)}>
                    Library
                  </ToolbarButton>
                </>
              ) : null}
            </>
          ) : null}
          {showTable ? (
            <ToolbarButton
              title="Insert table"
              onClick={() =>
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              }
            >
              Table
            </ToolbarButton>
          ) : null}
          <ToolbarButton
            title="Undo"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            Undo
          </ToolbarButton>
          <ToolbarButton
            title="Redo"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            Redo
          </ToolbarButton>
        </div>
      ) : null}
      <EditorContent editor={editor} />
      {imagesOn && enableMediaLibrary ? (
        <MediaLibraryModal
          open={libraryOpen}
          onClose={() => setLibraryOpen(false)}
          onPick={(pick) => {
            editor.chain().focus().setImage({ src: pick.url }).run();
          }}
        />
      ) : null}
    </div>
  );
}
