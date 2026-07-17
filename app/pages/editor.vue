<script lang="ts" setup>
import { EDITOR_DEMO_CONTENT } from "~/content/editor-demo"
import { Node, mergeAttributes } from "@tiptap/core"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { Emoji, gitHubEmojis } from "@tiptap/extension-emoji"
import Link from "@tiptap/extension-link"
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table"
import { VueNodeViewRenderer } from "@tiptap/vue-3"
import type { Editor } from "@tiptap/vue-3"
import { createLowlight, common } from "lowlight"

/**
 * editor.vue — nuxt-doc-kit editor layer demo
 * All data is hardcoded — no API calls.
 */
definePageMeta({ layout: false })

const doc = ref({
  id: "doc_demo_1",
  title: "Getting Started with nuxt-doc-kit",
  description: "A complete guide to integrating the reader and editor layers.",
  status: "draft",
  seo: {},
  tags: ["nuxt", "docs"],
  draftBody: EDITOR_DEMO_CONTENT,
})

const editor = useDocEditor({
  doc,
  onSave: async (content, meta) => {
    console.log("[demo] save", { chars: content.length, title: meta.title })
    await new Promise((r) => setTimeout(r, 600))
  },
  onPublish: async () => {
    console.log("[demo] publish")
    await new Promise((r) => setTimeout(r, 600))
    doc.value.status = "published"
  },
  onAutoSave: async (content) => {
    console.log("[demo] autosave", content.length, "chars")
  },
  onMentionSearch: async (query) => {
    return [
      { id: "u1", label: "alice", description: "Alice Smith", mentionType: "user" },
      { id: "u2", label: "bob", description: "Bob Jones", mentionType: "user" },
    ].filter((u) => u.label.includes(query.toLowerCase()))
  },
})

const imageModalOpen = ref(false)
const linkModalOpen = ref(false)
const mermaidModalOpen = ref(false)

const { customHandlers, editorToolbarItems, suggestionItems, editorBaseClass } = useEditorToolbar({
  openImageModal: (e) => { imageModalOpen.value = true },
  openLinkModal: (e) => { linkModalOpen.value = true },
  openMermaidModal: (e) => { mermaidModalOpen.value = true },
})

provide("editorHandlers", computed(() => customHandlers))

// ── TipTap extensions ──────────────────────────────────────────────────────
// Must live in .vue — TipTap node views can't resolve component imports from .ts
const MDC_BLOCK_RE = /^[ \t]*(:{2,})([a-z][a-z0-9-]*)(\{[^}]*\})?\n([\s\S]*?)\n[ \t]*\1(?!:)(?:\n|$)/
const MDC_INLINE_RE = /:([a-z][a-z0-9-]*)(?:\[([^\]]*)\])?(\{[^}]*\})?/

function parseInlineProps(raw: string): Record<string, string> {
  const r: Record<string, string> = {}
  const re = /(\w+)="([^"]*)"/g; let m
  while ((m = re.exec(raw)) !== null) r[m[1]!] = m[2]!
  return r
}
function serializeElementProps(obj: Record<string, string>): string {
  const e = Object.entries(obj).filter(([, v]) => v?.trim())
  return e.length ? `{${e.map(([k, v]) => `${k}="${v}"`).join(" ")}}` : ""
}
function parseSlots(body: string, helpers: { blockTokens: (s: string) => unknown[] }) {
  const slots: { name: string; tokens: unknown[] }[] = []
  const parts = body.split(/^(?=#[a-z])/m)
  for (const part of parts) {
    const t = part.trim(); if (!t) continue
    const nm = t.match(/^#([a-z][a-z0-9-]*)\n?([\s\S]*)$/)
    if (nm) slots.push({ name: nm[1]!, tokens: helpers.blockTokens(nm[2]?.trim() ?? "") })
    else slots.unshift({ name: "default", tokens: helpers.blockTokens(t) })
  }
  if (!slots.length) slots.push({ name: "default", tokens: helpers.blockTokens(body) })
  return slots
}

const lowlight = createLowlight(common)

const CodeBlockWithLanguage = CodeBlockLowlight.configure({ lowlight }).extend({
  addAttributes() { return { ...this.parent?.(), filename: { default: null } } },
  addNodeView() { return VueNodeViewRenderer(resolveComponent("CodeBlockView") as any) },
  addKeyboardShortcuts() {
    return { ...this.parent?.(), Enter: ({ editor }: { editor: Editor }) => {
      const { state } = editor; const { $from, empty } = state.selection
      if (!empty || $from.parent.type.name !== "codeBlock") return false
      if ($from.parentOffset !== $from.parent.content.size) return false
      if (!$from.parent.textContent.endsWith("\n\n")) return false
      const { tr } = state; tr.delete($from.pos - 2, $from.pos)
      const after = $from.after()
      tr.insert(after - 2, state.schema.nodes.paragraph!.create())
      tr.setSelection((state.selection.constructor as any).near(tr.doc.resolve(after - 1)))
      editor.view.dispatch(tr); return true
    }}
  },
} as any)
;(CodeBlockWithLanguage as any).config.markdownTokenName = "code"
;(CodeBlockWithLanguage as any).config.parseMarkdown = function (token: any, helpers: any) {
  if (token.type !== "code") return null
  const langStr = token.lang ?? ""; const fm = langStr.match(/^(\S*)\s*\[([^\]]+)\]/)
  return helpers.createNode("codeBlock", { language: fm ? fm[1] || null : langStr || null, filename: fm ? fm[2] : null }, [helpers.createTextNode(token.text ?? "")])
}
;(CodeBlockWithLanguage as any).config.renderMarkdown = function (node: any) {
  const lang = node.attrs?.language ?? ""; const filename = node.attrs?.filename ?? ""
  let code = ""; node.content?.forEach((c: any) => { if (c.type === "text") code += c.text ?? "" })
  return `\`\`\`${filename ? `${lang} [${filename}]` : lang}\n${code}\n\`\`\``
}

const InlineElement = Node.create({
  name: "inlineElement", group: "inline", inline: true, atom: true,
  addOptions() { return { HTMLAttributes: {} } },
  addAttributes() {
    return { tag: { default: "badge" }, content: { default: "" }, props: {
      default: {},
      parseHTML: (el: HTMLElement) => { try { return JSON.parse(el.getAttribute("data-props") ?? "{}") } catch { return {} } },
      renderHTML: (attrs: Record<string, any>) => ({ "data-props": JSON.stringify(attrs.props ?? {}) }),
    }}
  },
  parseHTML() { return [{ tag: "span[data-mdc-inline]" }] },
  renderHTML({ HTMLAttributes }: any) { return ["span", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-mdc-inline": HTMLAttributes.tag })] },
  addNodeView() { return VueNodeViewRenderer(resolveComponent("InlineElementView") as any) },
} as any)
;(InlineElement as any).config.markdownTokenName = "inlineElement"
;(InlineElement as any).config.markdownTokenizer = { name: "inlineElement", level: "inline", start: ":",
  tokenize(src: string) {
    const m = MDC_INLINE_RE.exec(src)
    if (!m || m.index !== 0 || m[1] === "mention") return undefined
    return { type: "inlineElement", raw: m[0]!, tag: m[1]!, content: m[2] ?? "", rawProps: m[3] ?? "" }
  }
}
;(InlineElement as any).config.parseMarkdown = function (token: any, helpers: any) {
  if (token.type !== "inlineElement") return null
  const p: Record<string, string> = {}; const re = /(\w+)="([^"]*)"/g; let m
  while ((m = re.exec(token.rawProps ?? "")) !== null) p[m[1]!] = m[2]!
  return helpers.createNode("inlineElement", { tag: token.tag, content: token.content, props: p })
}
;(InlineElement as any).config.renderMarkdown = function (node: any) {
  const { tag, content, props: p } = node.attrs ?? {}
  const ps = Object.entries(p ?? {}).filter(([,v]) => v).map(([k, v]) => `${k}="${v}"`).join(" ")
  return `:${tag}${content ? `[${content}]` : ""}${ps ? `{${ps}}` : ""}`
}

const Slot = Node.create({
  name: "slot", group: "block", content: "block+", defining: true, isolating: true,
  addOptions() { return { HTMLAttributes: {} } },
  addAttributes() { return { name: { default: "default" } } },
  parseHTML() { return [{ tag: "div[data-mdc-slot]" }] },
  renderHTML({ HTMLAttributes }: any) { return ["div", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-mdc-slot": HTMLAttributes.name }), 0] },
  addNodeView() { return VueNodeViewRenderer(resolveComponent("EditorSlot") as any) },
  addKeyboardShortcuts() {
    return { Enter: ({ editor }: { editor: Editor }) => {
      const { state } = editor; const { $from, empty } = state.selection
      if (!empty) return false; const d = $from.depth - 1; if (d < 0) return false
      const parent = $from.node(d); if (parent.type.name !== "slot") return false
      if ($from.index(d) !== parent.childCount - 1 || $from.parentOffset !== $from.parent.content.size) return false
      const elementDepth = d - 1; if (elementDepth < 0) return false
      const element = $from.node(elementDepth); if (element.type.name !== "element") return false
      if ($from.index(elementDepth) < element.childCount - 1) return false
      const after = $from.after(elementDepth); const { tr } = state
      tr.insert(after, state.schema.nodes.paragraph!.create())
      tr.setSelection((state.selection.constructor as any).near(tr.doc.resolve(after + 1)))
      editor.view.dispatch(tr); return true
    }}
  },
} as any)
;(Slot as any).config.markdownTokenName = "slot"
;(Slot as any).config.markdownOptions = { indentsContent: false }
;(Slot as any).config.parseMarkdown = function (token: any, helpers: any) {
  if (token.type !== "slot") return null
  const c = token.tokens?.length ? helpers.parseBlockChildren(token.tokens) : [helpers.createNode("paragraph")]
  return helpers.createNode("slot", { name: token.name }, c.length ? c : [helpers.createNode("paragraph")])
}
;(Slot as any).config.renderMarkdown = function (node: any, h: any) {
  const name = node.attrs?.name ?? "default"
  return name === "default" ? h.renderChildren(node, "\n\n") : `#${name}\n${h.renderChildren(node, "\n\n")}`
}

const Element = Node.create({
  name: "element", group: "block", content: "block+", defining: true, isolating: true,
  addOptions() { return { HTMLAttributes: {} } },
  addAttributes() {
    return { tag: { default: "callout" }, props: {
      default: {},
      parseHTML: (el: HTMLElement) => { try { return JSON.parse(el.getAttribute("data-props") ?? "{}") } catch { return {} } },
      renderHTML: (attrs: Record<string, any>) => ({ "data-props": JSON.stringify(attrs.props ?? {}) }),
    }}
  },
  parseHTML() { return [{ tag: "div[data-mdc-element]" }] },
  renderHTML({ HTMLAttributes }: any) { return ["div", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-mdc-element": HTMLAttributes.tag }), 0] },
  addNodeView() { return VueNodeViewRenderer(resolveComponent("EditorElement") as any) },
  addKeyboardShortcuts() {
    return { Enter: ({ editor }: { editor: Editor }) => {
      const { state } = editor; const { $from, empty } = state.selection
      if (!empty) return false; const d = $from.depth - 1; if (d < 0) return false
      const parent = $from.node(d); if (parent.type.name !== "element") return false
      if ($from.index(d) !== parent.childCount - 1 || $from.parentOffset !== $from.parent.content.size) return false
      const after = $from.after(d); const { tr } = state
      tr.insert(after, state.schema.nodes.paragraph!.create())
      tr.setSelection((state.selection.constructor as any).near(tr.doc.resolve(after + 1)))
      editor.view.dispatch(tr); return true
    },
    Backspace: ({ editor }: { editor: Editor }) => {
      const { state } = editor; const { $from, empty } = state.selection
      if (!empty) return false; const d = $from.depth - 1; if (d < 0) return false
      const parent = $from.node(d); if (parent.type.name !== "element") return false
      if ($from.index(d) !== 0 || $from.parentOffset !== 0) return false
      if (parent.childCount !== 1 || parent.firstChild?.content.size !== 0) return false
      return editor.chain().focus().deleteNode("element").run()
    }}
  },
} as any)
;(Element as any).config.markdownTokenName = "element"
;(Element as any).config.markdownOptions = { indentsContent: true }
;(Element as any).config.markdownTokenizer = { name: "element", level: "block", start: "::",
  tokenize(src: string, _: unknown, helpers: { blockTokens: (s: string) => unknown[] }) {
    const m = MDC_BLOCK_RE.exec(src); if (!m) return undefined
    return { type: "element", raw: m[0]!, tag: m[2]!, rawProps: m[3] ?? "", slots: parseSlots(m[4] ?? "", helpers) }
  }
}
;(Element as any).config.parseMarkdown = function (token: any, helpers: any) {
  if (token.type !== "element") return null
  const slots: { name: string; tokens: unknown[] }[] = token.slots ?? [{ name: "default", tokens: token.tokens ?? [] }]
  const content = slots.map((s) => {
    const children = s.tokens?.length ? helpers.parseBlockChildren(s.tokens) : [helpers.createNode("paragraph")]
    return helpers.createNode("slot", { name: s.name }, children.length ? children : [helpers.createNode("paragraph")])
  })
  return helpers.createNode("element", { tag: token.tag, props: parseInlineProps(token.rawProps) }, content.length ? content : [helpers.createNode("slot", { name: "default" }, [helpers.createNode("paragraph")])])
}
;(Element as any).config.renderMarkdown = function (node: any, h: any, context: any) {
  const tag = node.attrs?.tag ?? "element"; const propsStr = serializeElementProps(node.attrs?.props ?? {})
  const fence = ":".repeat((context?.level ?? 0) + 2)
  return `${fence}${tag}${propsStr}\n${h.renderChildren(node, "\n\n")}\n${fence}`
}

const MATH_BLOCK_INLINE_RE = /^\$\$([^\n]*)\$\$[ \t]*(?:\n|$)/
const MATH_BLOCK_FENCED_RE = /^\$\$([^\n]*)(?:\n([\s\S]*?))?\n\$\$[ \t]*(?:\n|$)/
const MathBlock = Node.create({
  name: "mathBlock", group: "block", atom: true, selectable: true, draggable: true,
  addOptions() { return { HTMLAttributes: {} } },
  addAttributes() { return { formula: { default: "" } } },
  parseHTML() { return [{ tag: "div[data-math-block]" }] },
  renderHTML({ HTMLAttributes }: any) { return ["div", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-math-block": HTMLAttributes.formula ?? "" })] },
  addNodeView() { return VueNodeViewRenderer(resolveComponent("MathBlockView") as any) },
  addKeyboardShortcuts() {
    return { Backspace: ({ editor }: { editor: Editor }) => {
      const { $from, empty } = editor.state.selection
      if (!empty || $from.parent.type.name !== "mathBlock") return false
      return editor.chain().focus().deleteNode("mathBlock").run()
    }}
  },
} as any)
;(MathBlock as any).config.markdownTokenName = "mathBlock"
;(MathBlock as any).config.markdownTokenizer = { name: "mathBlock", level: "block", start: "$$",
  tokenize(src: string) {
    const im = MATH_BLOCK_INLINE_RE.exec(src); if (im) return { type: "mathBlock", raw: im[0]!, formula: (im[1] ?? "").trim() }
    const fm = MATH_BLOCK_FENCED_RE.exec(src); if (!fm) return undefined
    const sl = (fm[1] ?? "").trim(); const bl = (fm[2] ?? "").trim()
    return { type: "mathBlock", raw: fm[0]!, formula: (sl && bl ? `${sl}\n${bl}` : sl || bl).trim() }
  }
}
;(MathBlock as any).config.parseMarkdown = function (t: any, h: any) {
  if (t.type !== "mathBlock") return null
  return h.createNode("mathBlock", { formula: (t.formula ?? "").replace(/\\\\(?=[a-zA-Z{}[\]|])/g, "\\") })
}
;(MathBlock as any).config.renderMarkdown = function (node: any) { return `$$\n${node.attrs?.formula ?? ""}\n$$` }

const MATH_INLINE_RE = /^\$(?!\$)((?:[^$\n])+?)\$(?!\$)/
const MathInline = Node.create({
  name: "mathInline", group: "inline", inline: true, atom: true, selectable: true,
  addOptions() { return { HTMLAttributes: {} } },
  addAttributes() { return { formula: { default: "" } } },
  parseHTML() { return [{ tag: "span[data-math-inline]" }] },
  renderHTML({ HTMLAttributes }: any) { return ["span", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-math-inline": HTMLAttributes.formula ?? "" })] },
  addNodeView() { return VueNodeViewRenderer(resolveComponent("MathInlineView") as any) },
} as any)
;(MathInline as any).config.markdownTokenName = "mathInline"
;(MathInline as any).config.markdownTokenizer = { name: "mathInline", level: "inline", start: "$",
  tokenize(src: string) { const m = MATH_INLINE_RE.exec(src); if (!m) return undefined; return { type: "mathInline", raw: m[0]!, formula: m[1] ?? "" } }
}
;(MathInline as any).config.parseMarkdown = function (t: any, h: any) {
  if (t.type !== "mathInline") return null
  return h.createNode("mathInline", { formula: (t.formula ?? "").replace(/\\\\(?=[a-zA-Z{}[\]|])/g, "\\") })
}
;(MathInline as any).config.renderMarkdown = function (node: any) { return `$${node.attrs?.formula ?? ""}$` }

;(Link as any).config.renderMarkdown = function (node: any, h: any) {
  const href = node.attrs?.href ?? ""; const title = node.attrs?.title ?? ""; const target = node.attrs?.target
  const text = h.renderChildren(node)
  if (target === "_blank") return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`
  return title ? `[${text}](${href} "${title}")` : `[${text}](${href})`
}

const extensions = [
  Element, Slot, CodeBlockWithLanguage, InlineElement, MathBlock, MathInline,
  Emoji.configure({ enableEmoticons: true }),
  Table.configure({ resizable: false }),
  TableRow.extend({
    renderHTML({ HTMLAttributes }: any) {
      return ["tr", mergeAttributes(HTMLAttributes, { class: "[&:first-child>th:first-child]:rounded-tl-md [&:first-child>th:last-child]:rounded-tr-md [&:last-child>td:first-child]:rounded-bl-md [&:last-child>td:last-child]:rounded-br-md" }), 0]
    },
  }),
  TableHeader.extend({
    renderHTML({ HTMLAttributes }: any) {
      return ["th", mergeAttributes(HTMLAttributes, { class: "py-3 px-4 font-semibold text-sm border-e border-b first:border-s border-t border-muted text-left" }), 0]
    },
  }),
  TableCell.extend({
    renderHTML({ HTMLAttributes }: any) {
      return ["td", mergeAttributes(HTMLAttributes, { class: "py-3 px-4 text-sm align-top border-e border-b first:border-s border-muted [&_p]:my-0 [&_p]:leading-6 text-left" }), 0]
    },
  }),
]

const emojiItems = gitHubEmojis.filter((e: any) => !e.name.startsWith("regional_indicator_"))

const activeEditor = ref<any>(null)
const panesRowRef = ref<HTMLElement | null>(null)

// Reset scroll position when switching modes — matches qarpeo behaviour
watch(() => editor.editorMode.value, () => {
  if (panesRowRef.value) panesRowRef.value.scrollTop = 0
})

onMounted(() => window.addEventListener("keydown", editor.handleGlobalKeydown))
onBeforeUnmount(() => window.removeEventListener("keydown", editor.handleGlobalKeydown))
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden">
    <!-- Top bar -->
    <header class="border-default bg-default flex shrink-0 items-center gap-2 border-b px-3 py-1.5">
      <NuxtLink to="/" class="text-muted hover:text-foreground transition-colors">
        <UIcon name="i-lucide-arrow-left" class="size-4" />
      </NuxtLink>
      <USeparator orientation="vertical" class="h-4" />
      <input
        :value="editor.meta.title"
        type="text"
        placeholder="Untitled"
        class="text-foreground placeholder:text-muted min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
        @input="editor.meta.title = ($event.target as HTMLInputElement).value"
      />
      <UBadge v-if="editor.hasUnsavedChanges.value" label="Unsaved" color="warning" variant="subtle" size="xs" />
      <UBadge v-else-if="doc.status === 'published'" label="Published" color="success" variant="subtle" size="xs" />
      <UBadge v-else label="Draft" color="neutral" variant="subtle" size="xs" />
      <UButton
        icon="i-lucide-save" label="Save" size="xs" color="primary"
        :variant="editor.hasUnsavedChanges.value ? 'solid' : 'soft'"
        :loading="editor.saving.value"
        :disabled="!editor.hasUnsavedChanges.value"
        @click="editor.save"
      />
      <UButton
        icon="i-lucide-globe" label="Publish" size="xs" color="success" variant="solid"
        :loading="editor.publishing.value"
        :disabled="editor.hasUnsavedChanges.value || editor.publishing.value"
        @click="editor.publish"
      />
    </header>

    <!-- Editor body -->
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <!-- Visual toolbar -->
      <div v-if="editor.editorMode.value === 'visual'" class="border-default bg-default/60 flex shrink-0 items-center border-b backdrop-blur-sm">
        <UEditorToolbar
          v-if="activeEditor"
          :editor="activeEditor"
          :items="editorToolbarItems"
          :handlers="customHandlers"
          class="flex-1 overflow-x-auto px-4 py-2"
        />
        <div v-else class="flex-1 px-4 py-2">
          <div class="bg-muted h-7 w-48 animate-pulse rounded" />
        </div>
        <div class="border-default flex items-center gap-1 border-l px-2 py-2">
          <UButton icon="i-lucide-code" size="xs" color="neutral" variant="ghost" title="Source mode" @click="editor.toggleEditorMode" />
          <UButton
            :icon="editor.showPreview.value ? 'i-lucide-panel-right-close' : 'i-lucide-panel-right-open'"
            :label="editor.showPreview.value ? 'Close' : 'Preview'"
            size="xs" color="neutral" variant="ghost"
            @click="editor.togglePreview"
          />
        </div>
      </div>

      <!-- Source toolbar -->
      <div v-else class="border-default bg-default/60 flex shrink-0 items-center justify-between border-b px-3 py-2">
        <span class="text-muted flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest">
          <UIcon name="i-lucide-code" class="size-3" /> Markdown Source
        </span>
        <div class="flex items-center gap-1">
          <UButton icon="i-lucide-layout-template" size="xs" color="neutral" variant="ghost" title="Visual editor" @click="editor.toggleEditorMode" />
          <UButton
            :icon="editor.showPreview.value ? 'i-lucide-panel-right-close' : 'i-lucide-panel-right-open'"
            :label="editor.showPreview.value ? 'Close' : 'Preview'"
            size="xs" color="neutral" variant="ghost"
            @click="editor.togglePreview"
          />
        </div>
      </div>

      <!-- Panes -->
      <div
        ref="panesRowRef"
        class="flex flex-1"
        :class="editor.editorMode.value === 'visual' ? 'overflow-y-auto' : 'min-h-0 overflow-hidden'"
      >
        <!-- Visual editor -->
        <UEditor
          v-if="editor.editorMode.value === 'visual'"
          v-slot="{ editor: tiptap }"
          v-model="editor.content.value"
          content-type="markdown"
          :extensions="extensions"
          :starter-kit="{ codeBlock: false, link: { HTMLAttributes: { target: null, rel: null, class: null } } }"
          :mention="false"
          :handlers="customHandlers"
          :ui="{ base: editorBaseClass }"
          class="flex flex-1 flex-col"
          :class="editor.showPreview.value ? 'w-1/2' : 'w-full'"
          @keydown.ctrl.s.prevent="editor.save"
          @keydown.meta.s.prevent="editor.save"
          @vue:mounted="activeEditor = tiptap"
        >
          <UEditorSuggestionMenu :editor="tiptap" :items="suggestionItems" />
          <UEditorEmojiMenu :editor="tiptap" :items="emojiItems" />
        </UEditor>

        <!-- Source editor -->
        <textarea
          v-else
          v-model="editor.content.value"
          class="bg-default text-foreground min-h-0 w-full flex-1 resize-none overflow-auto p-8 font-mono text-sm outline-none"
          placeholder="Write Markdown here…"
          spellcheck="false"
        />

        <!-- Preview pane -->
        <div
          v-if="editor.showPreview.value"
          class="border-default relative w-1/2 border-l"
          :class="editor.editorMode.value === 'source' ? 'min-h-0 overflow-y-auto' : ''"
        >
          <article class="doc-content mx-auto max-w-3xl p-8">
            <DocReader
              v-if="editor.previewAst.value"
              :page="{ body: editor.previewAst.value, rawBody: editor.content.value }"
            />
            <p v-else-if="!editor.previewParsing.value" class="text-muted text-sm italic">
              Nothing to preview yet.
            </p>
          </article>
          <div v-if="editor.previewParsing.value" class="pointer-events-none absolute top-3 right-4">
            <UIcon name="i-lucide-loader-circle" class="text-muted size-4 animate-spin" />
          </div>
        </div>
      </div>
    </div>

    <!-- Status bar -->
    <div class="border-default bg-muted/20 flex shrink-0 items-center justify-between border-t px-4 py-1">
      <span class="text-muted flex items-center gap-3 text-xs tabular-nums">
        <span>{{ editor.wordCount.value.toLocaleString() }} words</span>
        <span class="text-muted/50">·</span>
        <span>{{ editor.readingTime.value }} min read</span>
      </span>
      <NuxtLink to="/reader" class="text-muted hover:text-primary flex items-center gap-1 text-xs transition-colors">
        <UIcon name="i-lucide-eye" class="size-3" /> View reader demo
      </NuxtLink>
    </div>
  </div>
</template>
