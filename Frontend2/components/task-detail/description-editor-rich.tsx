"use client"

// DescriptionEditorRich — TipTap editor. THIS IS THE DYNAMIC IMPORT TARGET.
// MUST be the default export so next/dynamic can load it.
//
// SSR pattern (RESEARCH Pitfall 2, @tiptap/react 3.22.4):
//   Both `dynamic({ ssr: false })` on the parent AND `immediatelyRender: false`
//   on useEditor are REQUIRED. The parent's dynamic() keeps TipTap out of the
//   server bundle; `immediatelyRender: false` protects the first hydration
//   pass even after the chunk arrives on the client.
//
// Save pattern (D-36):
//   2s debounced save — `setTimeout` inside onUpdate, cleared on each keystroke,
//   cleaned up on unmount. onChange receives editor.getHTML(); the caller
//   (description-editor.tsx) forwards it up to the page which PATCHes /tasks/{id}.

import * as React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"

import { DescriptionToolbar } from "./description-toolbar"

interface Props {
  value: string
  onChange: (html: string) => void
}

export default function DescriptionEditorRich({ value, onChange }: Props) {
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestOnChange = React.useRef(onChange)
  React.useEffect(() => {
    latestOnChange.current = onChange
  }, [onChange])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image,
    ],
    content: value || "",
    // CRITICAL per RESEARCH Pitfall 2 — required even with dynamic(ssr:false).
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        latestOnChange.current(ed.getHTML())
      }, 2000) // D-36 debounce
    },
  })

  // Sync external value changes (e.g. query refetch) into the editor without
  // losing focus. Only replace content when it actually differs.
  React.useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  React.useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  if (!editor) return null

  return (
    <div
      style={{
        background: "var(--surface)",
        boxShadow: "inset 0 0 0 1px var(--border)",
        borderRadius: "var(--radius-sm)",
        overflow: "hidden",
      }}
    >
      <DescriptionToolbar editor={editor} />
      <div
        style={{
          padding: 12,
          minHeight: 120,
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
