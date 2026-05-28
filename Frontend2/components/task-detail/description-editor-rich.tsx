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
// Save pattern (revised — UAT bugfix):
//   Fires onChange SYNCHRONOUSLY on every editor update. The original D-36
//   2s debounce dropped content silently whenever the user clicked "Bitir"
//   within the debounce window — the parent's local `draft` state was
//   still stale and `finishEdit()` saw `draft === value`, so no PATCH ever
//   left the browser. The "Bitir" button itself is the commit gate now; we
//   no longer need a timer-based one.

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
      // Push the latest HTML up on every keystroke so the parent's draft
      // state stays in sync. Commit still happens via the explicit "Bitir"
      // button in description-editor.tsx; this just keeps draft fresh.
      latestOnChange.current(ed.getHTML())
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
