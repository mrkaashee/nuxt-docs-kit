/**
 * useEditorToolbar
 *
 * Returns the toolbar item config, slash-command suggestion items, custom
 * handler map, and the prose base CSS class for the doc visual editor.
 *
 * Handlers that need external state (image modal, link modal) are injected via
 * callbacks so this composable stays pure and reusable.
 */
import type { EditorCustomHandlers, EditorToolbarItem } from "@nuxt/ui"

export interface EditorToolbarCallbacks {
  openImageModal: (editor: any) => void
  openLinkModal: (editor: any) => void
  openMermaidModal: (editor: any) => void
}

export function useEditorToolbar(callbacks: EditorToolbarCallbacks) {
  const { openImageModal, openLinkModal, openMermaidModal } = callbacks

  // ── MDC insert helpers ──────────────────────────────────────────────────────
  function insertMdcBlock(
    editor: any,
    tag: string,
    nodeProps: Record<string, string>,
    bodyText: string,
  ) {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "element",
        attrs: { tag, props: nodeProps },
        content: [
          {
            type: "slot",
            attrs: { name: "default" },
            content: [
              { type: "paragraph", content: bodyText ? [{ type: "text", text: bodyText }] : [] },
            ],
          },
        ],
      })
      .run()
  }

  // ── Custom handlers ─────────────────────────────────────────────────────────
  const customHandlers = {
    image: {
      canExecute: (e: any) => e.can().setImage({ src: "" }),
      execute: (e: any) => {
        openImageModal(e)
        return e.chain()
      },
      isActive: () => false,
    },
    link: {
      canExecute: () => true,
      execute: (e: any) => {
        openLinkModal(e)
        return e.chain()
      },
      isActive: (e: any) => e.isActive("link"),
    },
    "math-block": {
      canExecute: () => true,
      execute: (e: any) => {
        e.chain()
          .focus()
          .insertContent({ type: "mathBlock", attrs: { formula: "" } })
          .run()
        return e.chain()
      },
      isActive: () => false,
    },
    "math-inline": {
      canExecute: () => true,
      execute: (e: any) => {
        const { from, to, empty } = e.state.selection
        const formula = empty ? "" : e.state.doc.textBetween(from, to)
        if (!empty) e.chain().focus().deleteSelection().run()
        e.chain().focus().insertContent({ type: "mathInline", attrs: { formula } }).run()
        return e.chain()
      },
      isActive: () => false,
    },
    mermaid: {
      canExecute: () => true,
      execute: (e: any) => {
        openMermaidModal(e)
        return e.chain()
      },
      isActive: () => false,
    },
    "mdc-badge": {
      canExecute: () => true,
      execute: (e: any) => {
        insertMdcBlock(e, "badge", {}, "v4.0.0")
        return e.chain()
      },
      isActive: () => false,
    },
    "mdc-callout": {
      canExecute: () => true,
      execute: (e: any) => {
        insertMdcBlock(
          e,
          "callout",
          { icon: "i-lucide-info", color: "info" },
          "Your callout text here.",
        )
        return e.chain()
      },
      isActive: () => false,
    },
    "mdc-note": {
      canExecute: () => true,
      execute: (e: any) => {
        insertMdcBlock(
          e,
          "callout",
          { icon: "i-lucide-triangle-alert", color: "warning" },
          "Your note here.",
        )
        return e.chain()
      },
      isActive: () => false,
    },
    "mdc-card": {
      canExecute: () => true,
      execute: (e: any) => {
        insertMdcBlock(e, "card", { title: "Title", icon: "i-lucide-star" }, "Card body content.")
        return e.chain()
      },
      isActive: () => false,
    },
    "mdc-u-card": {
      canExecute: () => true,
      execute: (e: any) => {
        insertMdcBlock(e, "u-card", { title: "Title" }, "Card body content.")
        return e.chain()
      },
      isActive: () => false,
    },
    "mdc-u-page-card": {
      canExecute: () => true,
      execute: (e: any) => {
        insertMdcBlock(
          e,
          "u-page-card",
          { title: "Title", icon: "i-lucide-star" },
          "Card description.",
        )
        return e.chain()
      },
      isActive: () => false,
    },
    "mdc-steps": {
      canExecute: () => true,
      execute: (e: any) => {
        e.chain()
          .focus()
          .insertContent({
            type: "element",
            attrs: { tag: "steps", props: {} },
            content: [
              {
                type: "slot",
                attrs: { name: "default" },
                content: [
                  {
                    type: "heading",
                    attrs: { level: 3 },
                    content: [{ type: "text", text: "Step one" }],
                  },
                  { type: "paragraph", content: [{ type: "text", text: "Do this first." }] },
                  {
                    type: "heading",
                    attrs: { level: 3 },
                    content: [{ type: "text", text: "Step two" }],
                  },
                  { type: "paragraph", content: [{ type: "text", text: "Then do this." }] },
                ],
              },
            ],
          })
          .run()
        return e.chain()
      },
      isActive: () => false,
    },
    "mdc-button": {
      canExecute: () => true,
      execute: (e: any) => {
        e.chain()
          .focus()
          .insertContent({
            type: "element",
            attrs: { tag: "u-button", props: { label: "Click me", color: "primary" } },
            content: [
              { type: "slot", attrs: { name: "default" }, content: [{ type: "paragraph" }] },
            ],
          })
          .run()
        return e.chain()
      },
      isActive: () => false,
    },
    "mdc-card-group": {
      canExecute: () => true,
      execute: (e: any) => {
        e.chain()
          .focus()
          .insertContent({
            type: "element",
            attrs: { tag: "card-group", props: {} },
            content: [
              {
                type: "element",
                attrs: { tag: "card", props: { title: "First card", icon: "i-lucide-star" } },
                content: [
                  {
                    type: "slot",
                    attrs: { name: "default" },
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "Card content here." }],
                      },
                    ],
                  },
                ],
              },
              {
                type: "element",
                attrs: { tag: "card", props: { title: "Second card", icon: "i-lucide-bolt" } },
                content: [
                  {
                    type: "slot",
                    attrs: { name: "default" },
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "Card content here." }],
                      },
                    ],
                  },
                ],
              },
            ],
          })
          .run()
        return e.chain()
      },
      isActive: () => false,
    },
    "mdc-tabs": {
      canExecute: () => true,
      execute: (e: any) => {
        e.chain()
          .focus()
          .insertContent({
            type: "element",
            attrs: { tag: "tabs", props: {} },
            content: [
              {
                type: "element",
                attrs: { tag: "tabs-item", props: { label: "Tab One" } },
                content: [
                  {
                    type: "slot",
                    attrs: { name: "default" },
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "Content for tab one." }],
                      },
                    ],
                  },
                ],
              },
              {
                type: "element",
                attrs: { tag: "tabs-item", props: { label: "Tab Two" } },
                content: [
                  {
                    type: "slot",
                    attrs: { name: "default" },
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "Content for tab two." }],
                      },
                    ],
                  },
                ],
              },
            ],
          })
          .run()
        return e.chain()
      },
      isActive: () => false,
    },
    table: {
      canExecute: () => true,
      execute: (e: any) => {
        const cell = (text: string) => ({
          type: "tableCell",
          content: [{ type: "paragraph", content: [{ type: "text", text }] }],
        })
        const headerCell = (text: string) => ({
          type: "tableHeader",
          content: [{ type: "paragraph", content: [{ type: "text", text }] }],
        })
        e.chain()
          .focus()
          .insertContent({
            type: "table",
            content: [
              {
                type: "tableRow",
                content: [headerCell("Column 1"), headerCell("Column 2"), headerCell("Column 3")],
              },
              {
                type: "tableRow",
                content: [cell("Cell 1"), cell("Cell 2"), cell("Cell 3")],
              },
              {
                type: "tableRow",
                content: [cell("Cell 4"), cell("Cell 5"), cell("Cell 6")],
              },
            ],
          })
          .run()
        return e.chain()
      },
      isActive: () => false,
    },
    "inline-badge": {
      canExecute: () => true,
      execute: (e: any) => {
        e.chain()
          .focus()
          .insertContent({
            type: "inlineElement",
            attrs: {
              tag: "u-badge",
              content: "New",
              props: { color: "primary", variant: "subtle" },
            },
          })
          .run()
        return e.chain()
      },
      isActive: () => false,
    },
    "inline-kbd": {
      canExecute: () => true,
      execute: (e: any) => {
        e.chain()
          .focus()
          .insertContent({
            type: "inlineElement",
            attrs: { tag: "u-kbd", content: "⌘K", props: {} },
          })
          .run()
        return e.chain()
      },
      isActive: () => false,
    },
  } satisfies EditorCustomHandlers

  // ── Toolbar items ───────────────────────────────────────────────────────────
  const editorToolbarItems: EditorToolbarItem[][] = [
    [
      {
        icon: "i-lucide-type",
        tooltip: { text: "Text style" },
        content: { align: "start" },
        items: [
          { kind: "paragraph", icon: "i-lucide-pilcrow", label: "Paragraph" },
          { kind: "heading", level: 1, icon: "i-lucide-heading-1", label: "Heading 1" },
          { kind: "heading", level: 2, icon: "i-lucide-heading-2", label: "Heading 2" },
          { kind: "heading", level: 3, icon: "i-lucide-heading-3", label: "Heading 3" },
          { kind: "heading", level: 4, icon: "i-lucide-heading-4", label: "Heading 4" },
        ],
      },
    ],
    [
      { kind: "mark", mark: "bold", icon: "i-lucide-bold", tooltip: { text: "Bold ⌘B" } },
      { kind: "mark", mark: "italic", icon: "i-lucide-italic", tooltip: { text: "Italic ⌘I" } },
      {
        kind: "mark",
        mark: "underline",
        icon: "i-lucide-underline",
        tooltip: { text: "Underline ⌘U" },
      },
      {
        icon: "i-lucide-ellipsis",
        tooltip: { text: "More formatting" },
        content: { align: "start" },
        items: [
          {
            kind: "mark",
            mark: "strike",
            icon: "i-lucide-strikethrough",
            label: "Strikethrough ⌘⇧X",
          },
          { kind: "mark", mark: "code", icon: "i-lucide-code", label: "Inline code ⌘E" },
        ],
      },
    ],
    [
      {
        icon: "i-lucide-layout-list",
        tooltip: { text: "Blocks" },
        content: { align: "start" },
        items: [
          { kind: "bulletList", icon: "i-lucide-list", label: "Bullet list" },
          { kind: "orderedList", icon: "i-lucide-list-ordered", label: "Ordered list" },
          { kind: "taskList", icon: "i-lucide-list-checks", label: "Task list" },
          { kind: "blockquote", icon: "i-lucide-quote", label: "Blockquote" },
          { kind: "codeBlock", icon: "i-lucide-square-code", label: "Code block" },
          { kind: "horizontalRule", icon: "i-lucide-minus", label: "Divider" },
        ],
      },
    ],
    [
      {
        icon: "i-lucide-plus-circle",
        tooltip: { text: "Insert" },
        content: { align: "start" },
        items: [
          { kind: "link", icon: "i-lucide-link", label: "Link" },
          { kind: "image", icon: "i-lucide-image", label: "Image" },
          { kind: "math-block", icon: "i-lucide-sigma", label: "Block Math" },
          { kind: "math-inline", icon: "i-lucide-function-square", label: "Inline Math" },
          { kind: "table", icon: "i-lucide-table", label: "Table" },
          { kind: "mermaid", icon: "i-lucide-share-2", label: "Diagram" },
        ],
      },
      {
        icon: "i-lucide-layout-template",
        tooltip: { text: "Components" },
        content: { align: "start" },
        items: [
          { kind: "mdc-callout", icon: "i-lucide-info", label: "Callout" },
          { kind: "mdc-note", icon: "i-lucide-triangle-alert", label: "Warning" },
          { kind: "mdc-steps", icon: "i-lucide-list-ordered", label: "Steps" },
          { kind: "mdc-tabs", icon: "i-lucide-panel-top", label: "Tabs" },
          { kind: "mdc-card", icon: "i-lucide-square", label: "Card" },
          { kind: "mdc-card-group", icon: "i-lucide-layout-grid", label: "Card Group" },
          { kind: "mdc-u-card", icon: "i-lucide-credit-card", label: "UCard" },
          { kind: "mdc-u-page-card", icon: "i-lucide-layout-panel-top", label: "UPageCard" },
          { kind: "mdc-button", icon: "i-lucide-mouse-pointer-click", label: "Button" },
          { kind: "mdc-badge", icon: "i-lucide-tag", label: "Badge (block)" },
          { kind: "inline-badge", icon: "i-lucide-tag", label: "Badge (inline)" },
          { kind: "inline-kbd", icon: "i-lucide-keyboard", label: "Kbd" },
        ],
      },
    ],
    [
      { kind: "undo", icon: "i-lucide-undo-2", tooltip: { text: "Undo ⌘Z" } },
      { kind: "redo", icon: "i-lucide-redo-2", tooltip: { text: "Redo ⌘⇧Z" } },
    ],
  ]

  // ── Slash-command suggestion items ──────────────────────────────────────────
  const suggestionItems = [
    [
      { type: "label" as const, label: "Style" },
      { kind: "paragraph", icon: "i-lucide-pilcrow", label: "Paragraph" },
      { kind: "heading", level: 1, icon: "i-lucide-heading-1", label: "Heading 1" },
      { kind: "heading", level: 2, icon: "i-lucide-heading-2", label: "Heading 2" },
      { kind: "heading", level: 3, icon: "i-lucide-heading-3", label: "Heading 3" },
      { kind: "bulletList", icon: "i-lucide-list", label: "Bullet list" },
      { kind: "orderedList", icon: "i-lucide-list-ordered", label: "Ordered list" },
      { kind: "taskList", icon: "i-lucide-list-checks", label: "Task list" },
      { kind: "blockquote", icon: "i-lucide-quote", label: "Blockquote" },
      { kind: "codeBlock", icon: "i-lucide-square-code", label: "Code block" },
    ],
    [
      { type: "label" as const, label: "Insert" },
      { kind: "image", icon: "i-lucide-image", label: "Image" },
      { kind: "horizontalRule", icon: "i-lucide-minus", label: "Divider" },
      {
        kind: "table",
        icon: "i-lucide-table",
        label: "Table",
        description: "3×2 table with header row",
      },
      {
        kind: "mermaid",
        icon: "i-lucide-share-2",
        label: "Diagram",
        description: "Mermaid diagram (flowchart, sequence, ER…)",
      },
      {
        kind: "math-block",
        icon: "i-lucide-sigma",
        label: "Block Math",
        description: "KaTeX display formula",
      },
      {
        kind: "math-inline",
        icon: "i-lucide-function-square",
        label: "Inline Math",
        description: "KaTeX inline formula",
      },
    ],
    [
      { type: "label" as const, label: "Components" },
      {
        kind: "mdc-badge",
        icon: "i-lucide-tag",
        label: "Badge",
        description: "Inline label badge",
      },
      {
        kind: "mdc-callout",
        icon: "i-lucide-info",
        label: "Callout",
        description: "Info callout block",
      },
      {
        kind: "mdc-note",
        icon: "i-lucide-triangle-alert",
        label: "Warning",
        description: "Warning callout",
      },
      { kind: "mdc-card", icon: "i-lucide-square", label: "Card", description: "Content card" },
      {
        kind: "mdc-u-card",
        icon: "i-lucide-credit-card",
        label: "UCard",
        description: "UI card with slots",
      },
      {
        kind: "mdc-u-page-card",
        icon: "i-lucide-layout-panel-top",
        label: "UPageCard",
        description: "Feature card",
      },
      {
        kind: "mdc-card-group",
        icon: "i-lucide-layout-grid",
        label: "Card Group",
        description: "Grid of cards",
      },
      {
        kind: "mdc-steps",
        icon: "i-lucide-list-ordered",
        label: "Steps",
        description: "Numbered steps",
      },
      {
        kind: "mdc-tabs",
        icon: "i-lucide-panel-top",
        label: "Tabs",
        description: "Tabbed content",
      },
      {
        kind: "mdc-button",
        icon: "i-lucide-mouse-pointer-click",
        label: "Button",
        description: "UButton component",
      },
      {
        kind: "inline-badge",
        icon: "i-lucide-tag",
        label: "Inline Badge",
        description: ":badge[text]",
      },
      { kind: "inline-kbd", icon: "i-lucide-keyboard", label: "Kbd", description: ":u-kbd[⌘K]" },
    ],
  ]

  // ── Editor prose base class ─────────────────────────────────────────────────
  // Mirror NuxtUI prose component styles so the editor canvas matches the
  // read/preview view exactly.
  const editorBaseClass = [
    "mx-auto max-w-3xl p-8 sm:px-12",
    // Headings — matches ProseH1/H2/H3/H4 themes
    "[&_h1]:text-4xl [&_h1]:text-highlighted [&_h1]:font-bold [&_h1]:mb-8",
    "[&_h2]:relative [&_h2]:text-2xl [&_h2]:text-highlighted [&_h2]:font-bold [&_h2]:mt-12 [&_h2]:mb-6",
    "[&_h3]:relative [&_h3]:text-xl [&_h3]:text-highlighted [&_h3]:font-bold [&_h3]:mt-8 [&_h3]:mb-3",
    "[&_h4]:text-lg [&_h4]:text-highlighted [&_h4]:font-bold [&_h4]:mt-6 [&_h4]:mb-2",
    // Paragraph — matches ProseP theme
    "[&_p]:my-5 [&_p]:leading-7 [&_p]:text-pretty",
    // Links — matches ProseA theme
    "[&_a]:text-primary [&_a]:border-b [&_a]:border-transparent hover:[&_a]:border-primary [&_a]:font-medium",
    // Lists — matches ProseUl/ProseOl/ProseLi themes
    "[&_ul]:list-disc [&_ul]:ps-6 [&_ul]:my-5",
    "[&_ol]:list-decimal [&_ol]:ps-6 [&_ol]:my-5",
    "[&_li]:my-1.5 [&_li]:ps-1.5 [&_li]:leading-7",
    // Suppress paragraph margin inside list items (editor wraps li content in <p>)
    "[&_li_p]:my-0 [&_li_p]:leading-7",
    // Blockquote — matches ProseBlockquote theme
    "[&_blockquote]:border-s-4 [&_blockquote]:border-accented [&_blockquote]:ps-4 [&_blockquote]:italic",
    "[&_blockquote_p:before]:content-none [&_blockquote_p:after]:content-none",
    // HR — handled via global CSS in main.css (Tailwind can't escape the data-type selector)
    //
    // Inline code (not inside pre) — matches ProseCode neutral theme.
    // :not(pre)>code avoids overriding UEditor's [&_pre_code]:bg-transparent.
    "[&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-sm [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:font-medium [&_:not(pre)>code]:rounded-md",
    "[&_:not(pre)>code]:border [&_:not(pre)>code]:border-muted [&_:not(pre)>code]:text-highlighted [&_:not(pre)>code]:bg-muted",
    // Images
    "[&_img]:rounded-xl",
    // Strong
    "[&_strong]:text-highlighted [&_strong]:font-bold",
  ].join(" ")

  return {
    customHandlers,
    editorToolbarItems,
    suggestionItems,
    editorBaseClass,
  }
}
