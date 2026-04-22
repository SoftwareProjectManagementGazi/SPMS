"use client"

// DescriptionToolbar — the rich-mode toolbar rendered above <EditorContent>.
// Uses the project's Button primitive with a small active-state override
// (var(--accent) background) so active formats stand out from inactive ones.
// Extensions covered: StarterKit v3 bundles bold / italic / underline / strike /
// heading / bullet-list / ordered-list / blockquote / code / code-block / link /
// horizontal-rule. @tiptap/extension-image is added alongside StarterKit in
// description-editor-rich.tsx.

import * as React from "react"
import type { Editor } from "@tiptap/react"
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List as ListIcon,
  ListOrdered,
  Minus,
  Quote,
  SquareCode,
  Strikethrough,
  Underline,
} from "lucide-react"

interface TbBtnProps {
  icon: React.ReactNode
  onClick: () => void
  active?: boolean
  title: string
}

function TbBtn({ icon, onClick, active, title }: TbBtnProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        // Prevent the button from stealing focus away from the editor before
        // the command executes — ProseMirror needs an active selection for most
        // commands. onClick still fires after the default onMouseDown is prevented.
        e.preventDefault()
      }}
      onClick={onClick}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 26,
        height: 26,
        padding: 0,
        borderRadius: 4,
        border: "none",
        background: active ? "var(--accent)" : "transparent",
        color: active ? "var(--accent-fg)" : "var(--fg-muted)",
        cursor: "pointer",
        transition: "background 0.1s, color 0.1s",
      }}
    >
      {icon}
    </button>
  )
}

function Sep() {
  return (
    <div
      style={{
        width: 1,
        alignSelf: "stretch",
        background: "var(--border)",
        margin: "2px 4px",
      }}
    />
  )
}

export function DescriptionToolbar({ editor }: { editor: Editor }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: 6,
        flexWrap: "wrap",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface-2)",
      }}
    >
      <TbBtn
        icon={<Bold size={14} />}
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      />
      <TbBtn
        icon={<Italic size={14} />}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      />
      <TbBtn
        icon={<Underline size={14} />}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline"
      />
      <TbBtn
        icon={<Strikethrough size={14} />}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strike"
      />
      <Sep />
      <TbBtn
        icon={<Heading1 size={14} />}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        active={editor.isActive("heading", { level: 1 })}
        title="H1"
      />
      <TbBtn
        icon={<Heading2 size={14} />}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        active={editor.isActive("heading", { level: 2 })}
        title="H2"
      />
      <TbBtn
        icon={<Heading3 size={14} />}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        active={editor.isActive("heading", { level: 3 })}
        title="H3"
      />
      <Sep />
      <TbBtn
        icon={<ListIcon size={14} />}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet List"
      />
      <TbBtn
        icon={<ListOrdered size={14} />}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered List"
      />
      <TbBtn
        icon={<Quote size={14} />}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Blockquote"
      />
      <Sep />
      <TbBtn
        icon={<Code size={14} />}
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        title="Code"
      />
      <TbBtn
        icon={<SquareCode size={14} />}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        title="Code Block"
      />
      <Sep />
      <TbBtn
        icon={<LinkIcon size={14} />}
        onClick={() => {
          const url = typeof window !== "undefined" ? window.prompt("URL:") : null
          if (url) {
            editor.chain().focus().setLink({ href: url }).run()
          } else if (url === "") {
            editor.chain().focus().unsetLink().run()
          }
        }}
        active={editor.isActive("link")}
        title="Link"
      />
      <TbBtn
        icon={<ImageIcon size={14} />}
        onClick={() => {
          const url =
            typeof window !== "undefined" ? window.prompt("Image URL:") : null
          if (url) editor.chain().focus().setImage({ src: url }).run()
        }}
        title="Image"
      />
      <TbBtn
        icon={<Minus size={14} />}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      />
    </div>
  )
}
