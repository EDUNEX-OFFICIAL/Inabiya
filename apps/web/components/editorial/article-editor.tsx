'use client';

import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
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
};

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
      className={`rounded px-2 py-1 text-xs border ${
        active ? 'bg-[var(--primary)] text-white border-transparent' : 'bg-white/80 border-black/10'
      } disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

export function ArticleEditor({
  initialContent,
  onChange,
  editable = true,
  className,
  placeholder = 'Write the article…',
  enableMediaLibrary = false,
}: Props) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: { HTMLAttributes: { class: 'article-code' } },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
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
          'article-prose min-h-[280px] max-w-none px-3 py-3 focus:outline-none font-body text-[15px] leading-relaxed',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

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
    if (!editor) return;
    if (enableMediaLibrary) {
      setLibraryOpen(true);
      return;
    }
    const url = window.prompt('Image URL (https://…)');
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }

  async function uploadImageFile(file: File | null) {
    if (!editor || !file) return;
    try {
      const asset = await uploadCmsMediaFile(file);
      const url = asset.publicUrl ?? `/api/v1/media/${asset.id}/content`;
      editor.chain().focus().setImage({ src: url }).run();
    } catch (e) {
      window.alert(String((e as Error).message ?? e));
    }
  }

  return (
    <div
      className={`rounded border border-black/15 bg-white/90 overflow-hidden ${className ?? ''}`}
    >
      {editable ? (
        <div className="flex flex-wrap gap-1 border-b border-black/10 p-2 bg-[var(--background)]">
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
            title="Heading 2"
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            title="Heading 3"
            active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </ToolbarButton>
          <ToolbarButton
            title="Bullet list"
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            • List
          </ToolbarButton>
          <ToolbarButton
            title="Ordered list"
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1. List
          </ToolbarButton>
          <ToolbarButton
            title="Quote"
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            Quote
          </ToolbarButton>
          <ToolbarButton
            title="Code block"
            active={editor.isActive('codeBlock')}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            Code
          </ToolbarButton>
          <ToolbarButton
            title="Horizontal rule"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            —
          </ToolbarButton>
          <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
            Link
          </ToolbarButton>
          <ToolbarButton title="Image" onClick={setImage}>
            Image
          </ToolbarButton>
          {enableMediaLibrary ? (
            <>
              <label className="cursor-pointer rounded border border-black/10 bg-white/80 px-2 py-1 text-xs hover:bg-black/5">
                Upload img
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
          <ToolbarButton
            title="Insert table"
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            Table
          </ToolbarButton>
          <ToolbarButton
            title="Align left"
            active={editor.isActive({ textAlign: 'left' })}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            Left
          </ToolbarButton>
          <ToolbarButton
            title="Align center"
            active={editor.isActive({ textAlign: 'center' })}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            Center
          </ToolbarButton>
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
      {enableMediaLibrary ? (
        <MediaLibraryModal
          open={libraryOpen}
          onClose={() => setLibraryOpen(false)}
          onPick={(url) => {
            editor.chain().focus().setImage({ src: url }).run();
          }}
        />
      ) : null}
    </div>
  );
}
