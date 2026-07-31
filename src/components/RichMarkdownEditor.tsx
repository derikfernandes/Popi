import React, { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import Placeholder from "@tiptap/extension-placeholder";
import { Underline } from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Table as TableIcon,
  Undo2,
  Redo2,
  Code2,
  Type,
  Eye,
} from "lucide-react";
import { htmlToMarkdown, markdownToHtml } from "../utils/markdownBridge";

interface RichMarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  minHeightClass?: string;
}

type EditorMode = "visual" | "markdown";

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition ${
        active
          ? "bg-blue-100 text-blue-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      } disabled:opacity-40 disabled:pointer-events-none`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-0.5 h-5 w-px bg-slate-200 shrink-0" aria-hidden />;
}

export default function RichMarkdownEditor({
  value,
  onChange,
  placeholder = "Comece a editar o documento…",
  minHeightClass = "min-h-[28rem]",
}: RichMarkdownEditorProps) {
  const [mode, setMode] = useState<EditorMode>("visual");
  const lastMarkdownRef = useRef(value);
  const skipNextSyncRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        // Underline vem da extensão dedicada
        underline: false,
      }),
      Underline,
      TableKit.configure({
        table: {
          resizable: true,
          HTMLAttributes: { class: "rme-table" },
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: markdownToHtml(value),
    editorProps: {
      attributes: {
        class: `rme-prose focus:outline-none ${minHeightClass}`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      const md = htmlToMarkdown(ed.getHTML());
      lastMarkdownRef.current = md;
      skipNextSyncRef.current = true;
      onChange(md);
    },
  });

  // Sincroniza valor externo (ex.: troca de documento / cancelar)
  useEffect(() => {
    if (!editor) return;
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    if (value === lastMarkdownRef.current) return;
    lastMarkdownRef.current = value;
    editor.commands.setContent(markdownToHtml(value), { emitUpdate: false });
  }, [value, editor]);

  const toolbar = useEditorState({
    editor,
    selector: (ctx) => {
      const ed = ctx.editor;
      if (!ed) {
        return {
          bold: false,
          italic: false,
          underline: false,
          strike: false,
          h1: false,
          h2: false,
          h3: false,
          bullet: false,
          ordered: false,
          quote: false,
          codeBlock: false,
          canUndo: false,
          canRedo: false,
        };
      }
      return {
        bold: ed.isActive("bold"),
        italic: ed.isActive("italic"),
        underline: ed.isActive("underline"),
        strike: ed.isActive("strike"),
        h1: ed.isActive("heading", { level: 1 }),
        h2: ed.isActive("heading", { level: 2 }),
        h3: ed.isActive("heading", { level: 3 }),
        bullet: ed.isActive("bulletList"),
        ordered: ed.isActive("orderedList"),
        quote: ed.isActive("blockquote"),
        codeBlock: ed.isActive("codeBlock"),
        canUndo: ed.can().chain().focus().undo().run(),
        canRedo: ed.can().chain().focus().redo().run(),
      };
    },
  });

  const switchToMarkdown = useCallback(() => {
    if (editor) {
      const md = htmlToMarkdown(editor.getHTML());
      lastMarkdownRef.current = md;
      onChange(md);
    }
    setMode("markdown");
  }, [editor, onChange]);

  const switchToVisual = useCallback(() => {
    if (editor) {
      lastMarkdownRef.current = value;
      editor.commands.setContent(markdownToHtml(value), { emitUpdate: false });
    }
    setMode("visual");
  }, [editor, value]);

  const insertTable = () => {
    editor
      ?.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  return (
    <div className="rme-shell border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        <div className="flex items-center gap-0.5 mr-1 rounded-lg border border-slate-200 bg-white p-0.5">
          <button
            type="button"
            onClick={switchToVisual}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
              mode === "visual"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Visual
          </button>
          <button
            type="button"
            onClick={switchToMarkdown}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
              mode === "markdown"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Markdown
          </button>
        </div>

        {mode === "visual" && editor && toolbar && (
          <>
            <ToolbarDivider />
            <ToolbarButton
              title="Desfazer"
              disabled={!toolbar.canUndo}
              onClick={() => editor.chain().focus().undo().run()}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Refazer"
              disabled={!toolbar.canRedo}
              onClick={() => editor.chain().focus().redo().run()}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton
              title="Título 1"
              active={toolbar.h1}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
            >
              <Heading1 className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Título 2"
              active={toolbar.h2}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              <Heading2 className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Título 3"
              active={toolbar.h3}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
            >
              <Heading3 className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Parágrafo"
              onClick={() => editor.chain().focus().setParagraph().run()}
            >
              <Type className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton
              title="Negrito"
              active={toolbar.bold}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Itálico"
              active={toolbar.italic}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Sublinhado"
              active={toolbar.underline}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Riscado"
              active={toolbar.strike}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton
              title="Lista com marcadores"
              active={toolbar.bullet}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Lista numerada"
              active={toolbar.ordered}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Citação"
              active={toolbar.quote}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Linha horizontal"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              <Minus className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Inserir tabela"
              onClick={insertTable}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Bloco de código"
              active={toolbar.codeBlock}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            >
              <Code2 className="w-3.5 h-3.5" />
            </ToolbarButton>
          </>
        )}

        {mode === "markdown" && (
          <span className="ml-2 text-[11px] text-slate-500 font-medium">
            Modo avançado — o documento é salvo em Markdown
          </span>
        )}
      </div>

      {mode === "visual" ? (
        <div className="rme-editor-wrap px-4 py-3 bg-white overflow-auto max-h-[70vh]">
          <EditorContent editor={editor} />
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => {
            lastMarkdownRef.current = e.target.value;
            onChange(e.target.value);
          }}
          rows={18}
          spellCheck={false}
          className={`w-full ${minHeightClass} resize-y border-0 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-800 leading-relaxed focus:outline-none focus:bg-white`}
          placeholder="Edite o Markdown diretamente…"
        />
      )}
    </div>
  );
}
