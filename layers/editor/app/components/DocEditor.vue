<script lang="ts" setup>
import { computePosition, flip, offset, shift } from "@floating-ui/dom"
import { Node, mergeAttributes } from "@tiptap/core"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { Emoji, gitHubEmojis } from "@tiptap/extension-emoji"
import Link from "@tiptap/extension-link"
import Mention from "@tiptap/extension-mention"
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import Suggestion from "@tiptap/suggestion"
import { VueNodeViewRenderer, VueRenderer } from "@tiptap/vue-3"
import type { Editor } from "@tiptap/vue-3"
import { createLowlight, common } from "lowlight"

import { isLatexDocument, convertLatexToMarkdown } from "#layers/editor/shared/utils/latex"
import { normalizeImageUrl } from "#layers/editor/shared/utils/normalizeImageUrl"
import CodeBlockView from "#layers/editor/app/components/editor/CodeBlockView.vue"
import EditorElementComp from "#layers/editor/app/components/editor/EditorElement.vue"
import EditorSlotComp from "#layers/editor/app/components/editor/EditorSlot.vue"
import InlineElementView from "#layers/editor/app/components/editor/InlineElementView.vue"
import MathBlockView from "#layers/editor/app/components/editor/MathBlockView.vue"
import MathInlineView from "#layers/editor/app/components/editor/MathInlineView.vue"
import MentionDropdownComp from "#layers/editor/app/components/editor/MentionDropdown.vue"
import MentionNodeView from "#layers/editor/app/components/editor/MentionNodeView.vue"
import type { DocEditorSavePayload } from "#layers/editor/app/composables/useEditorState"

// ── Props & emits ──────────────────────────────────────────────────────────────
const props = defineProps<{
  doc: any
  rawBody: string
  hasDraft?: boolean
  basePath: string
  /** Optional — resolves @mention search results. No hardcoded API calls inside the layer. */
  resolveMentionSearch?: (query: string) => Promise<any[]>
}>()

const emit = defineEmits<{
  /** Parent must handle: save body + metadata */
  save: [payload: DocEditorSavePayload]
  /** Parent must handle: publish the draft */
  publish: []
  /** Parent must handle: discard the draft */
  discard: []
}>()

// ── Editor state (pure — no API calls) ────────────────────────────────────────
const docRef = computed(() => props.doc)
const rawBodyRef = computed(() => props.rawBody)

const editorState = useEditorState({
  doc: docRef,
  initialRawBody: rawBodyRef,
  onSave: async (payload) => { emit("save", payload) },
  onPublish: async () => { emit("publish") },
  resolveMentionSearch: props.resolveMentionSearch,
})

const {
  meta, content, hasUnsavedChanges,
  wordCount, readingTime,
  saving, publishing,
  save, publish,
  editorMode, toggleEditorMode,
  focusMode, toggleFocusMode, handleGlobalKeydown,
  showPreview, previewAst, previewParsing, togglePreview,
  mentionItems, mentionSearchTerm,
} = editorState

// Sync hasDraft prop into state
const hasDraftLocal = ref(props.hasDraft ?? false)
watch(() => props.hasDraft, (v) => { if (v !== undefined) hasDraftLocal.value = v })

const isRtl = computed(() => ["ur", "ar"].includes(props.doc?.language?.toLowerCase() || ""))

// ── TipTap extensions ──────────────────────────────────────────────────────────
const MDC_BLOCK_RE =
  /^[ \t]*(:{2,})([a-z][a-z0-9-]*)(\{[^}]*\})?\n([\s\S]*?)\n[ \t]*\1(?!:)(?:\n|$)/
const MDC_INLINE_RE = /:([a-z][a-z0-9-]*)(?:\[([^\]]*)\])?(\{[^}]*\})?/

function parseInlineProps(raw: string): Record<string, string> {
  const result: Record<string, string> = {}
  if (!raw) return result
  const re = /(\w+)="([^"]*)"/g
  let m
  while ((m = re.exec(raw)) !== null) result[m[1]!] = m[2]!
  return result
}
function serializeElementProps(obj: Record<string, string>): string {
  const entries = Object.entries(obj).filter(([, v]) => v && v.trim())
  if (!entries.length) return ""
  return `{${entries.map(([k, v]) => `${k}="${v}"`).join(" ")}}`
}
function parseSlots(body: string, helpers: { blockTokens: (s: string) => unknown[] }) {
  const slots: { name: string; tokens: unknown[] }[] = []
  const parts = body.split(/^(?=#[a-z])/m)
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const nameMatch = trimmed.match(/^#([a-z][a-z0-9-]*)\n?([\s\S]*)$/)
    if (nameMatch)
      slots.push({ name: nameMatch[1]!, tokens: helpers.blockTokens(nameMatch[2]?.trim() ?? "") })
    else slots.unshift({ name: "default", tokens: helpers.blockTokens(trimmed) })
  }
  if (!slots.length) slots.push({ name: "default", tokens: helpers.blockTokens(body) })
  return slots
}

// Mention bridges
const mentionOnSelect = shallowRef<((editor: any, range: any, item: any) => void) | null>(null)
const mentionGetItems = shallowRef<(() => any[]) | null>(null)
const mentionSetQuery = shallowRef<((q: string) => void) | null>(null)
const MentionPluginKey = new PluginKey("mentionWithHref")

const MentionWithHref = Mention.extend({
  addOptions() { return { ...this.parent?.(), HTMLAttributes: { class: "mention" } } },
  addAttributes() {
    return {
      ...this.parent?.(),
      href: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute("data-href"), renderHTML: (attrs: Record<string, any>) => (attrs.href ? { "data-href": attrs.href } : {}) },
      mentionType: { default: "user", parseHTML: (el: HTMLElement) => el.getAttribute("data-mention-type") ?? "user", renderHTML: (attrs: Record<string, any>) => ({ "data-mention-type": attrs.mentionType ?? "user" }) },
      linkStyle: { default: "mention", parseHTML: (el: HTMLElement) => el.getAttribute("data-link-style") ?? "mention", renderHTML: (attrs: Record<string, any>) => ({ "data-link-style": attrs.linkStyle ?? "mention" }) },
      btnColor: { default: "primary", parseHTML: (el: HTMLElement) => el.getAttribute("data-btn-color") ?? "primary", renderHTML: (attrs: Record<string, any>) => ({ "data-btn-color": attrs.btnColor ?? "primary" }) },
      btnVariant: { default: "solid", parseHTML: (el: HTMLElement) => el.getAttribute("data-btn-variant") ?? "solid", renderHTML: (attrs: Record<string, any>) => ({ "data-btn-variant": attrs.btnVariant ?? "solid" }) },
    }
  },
  renderHTML({ HTMLAttributes, node }: any) {
    const label = node.attrs.label || node.attrs.id
    const isDoc = node.attrs.mentionType === "doc"
    return ["span", mergeAttributes({ class: "mention" }, HTMLAttributes, { "data-type": "mention", class: isDoc ? "mention-doc text-primary inline-flex items-center gap-0.5 font-medium cursor-pointer" : "mention-user text-primary font-medium cursor-pointer" }), isDoc ? label : `@${label}`]
  },
  renderText({ node }: any) {
    const label = node.attrs.label || node.attrs.id
    return node.attrs.mentionType === "doc" ? label : `@${label}`
  },
  addNodeView() { return VueNodeViewRenderer(MentionNodeView) },
  addProseMirrorPlugins() {
    return [Suggestion({
      pluginKey: MentionPluginKey, editor: this.editor, char: "@", allowSpaces: false,
      items: ({ query }: { query: string }) => { mentionSetQuery.value?.(query); return mentionGetItems.value?.() ?? [] },
      render: () => {
        let renderer: any = null; let el: HTMLElement | null = null
        const cleanup = () => { renderer?.destroy(); renderer = null; el?.remove(); el = null }
        const position = (rect: DOMRect) => {
          if (!el) return
          computePosition({ getBoundingClientRect: () => rect } as any, el, { placement: "bottom-start", middleware: [offset(6), flip(), shift({ padding: 8 })] })
            .then(({ x, y }: { x: number; y: number }) => { if (el) { el.style.left = `${x}px`; el.style.top = `${y}px` } })
        }
        return {
          onStart(p: any) {
            renderer = new VueRenderer(MentionDropdownComp, { props: { items: p.items, command: (item: any) => { cleanup(); if (item.type === "label" || item.type === "separator") return; mentionOnSelect.value?.(p.editor, p.range, item) } }, editor: p.editor })
            el = document.createElement("div"); el.style.cssText = "position:fixed;z-index:9999;pointer-events:auto"; document.body.appendChild(el)
            if (renderer.element) el.appendChild(renderer.element)
            const rect = p.clientRect?.(); if (rect) position(rect)
          },
          onUpdate(p: any) {
            renderer?.updateProps({ items: p.items, command: (item: any) => { cleanup(); if (item.type === "label" || item.type === "separator") return; mentionOnSelect.value?.(p.editor, p.range, item) } })
            const rect = p.clientRect?.(); if (rect) position(rect)
          },
          onKeyDown({ event }: any) { if (event.key === "Escape") { cleanup(); return true } return renderer?.ref?.onKeyDown?.({ event }) ?? false },
          onExit() { cleanup() },
        }
      },
    })]
  },
} as any)
;(MentionWithHref as any).config.markdownTokenName = "mention"
;(MentionWithHref as any).config.markdownTokenizer = {
  name: "mention", level: "inline", start: ":",
  tokenize(src: string) {
    const match = /^:mention(\{[^}]*\})/.exec(src); if (!match) return undefined
    const rawProps = match[1] ?? ""; const get = (key: string) => rawProps.match(new RegExp(`${key}="([^"]*)"`))?.[1] ?? ""
    return { type: "mention", raw: match[0]!, mentionId: get("id"), mentionType: get("mentionType") || get("type") || "user", mentionLabel: get("label"), mentionHref: get("href"), mentionLinkStyle: get("linkStyle") || "mention", mentionBtnColor: get("btnColor") || "primary", mentionBtnVariant: get("btnVariant") || "solid" }
  },
}
;(MentionWithHref as any).config.parseMarkdown = function (token: any, helpers: any) {
  if (token.type !== "mention") return null
  return helpers.createNode("mention", { id: token.mentionId, label: token.mentionLabel || token.mentionId, mentionType: token.mentionType || "user", href: token.mentionHref || (token.mentionType !== "doc" ? `/@${token.mentionLabel}` : ""), linkStyle: token.mentionLinkStyle || "mention", btnColor: token.mentionBtnColor || "primary", btnVariant: token.mentionBtnVariant || "solid", mentionSuggestionChar: "@" })
}
;(MentionWithHref as any).config.renderMarkdown = function (node: any) {
  const { label, id, mentionType: type, href, linkStyle, btnColor, btnVariant } = node.attrs ?? {}
  return `:mention{mentionType="${type ?? "user"}" type="${type ?? "user"}" id="${id ?? ""}" label="${label ?? ""}" href="${href ?? ""}" linkStyle="${linkStyle ?? "mention"}" btnColor="${btnColor ?? "primary"}" btnVariant="${btnVariant ?? "solid"}"}`
}

const InlineElement = Node.create({
  name: "inlineElement", group: "inline", inline: true, atom: true,
  addOptions() { return { HTMLAttributes: {} } },
  addAttributes() {
    return { tag: { default: "badge" }, content: { default: "" }, props: { default: {}, parseHTML: (el: HTMLElement) => { try { return JSON.parse(el.getAttribute("data-props") ?? "{}") } catch { return {} } }, renderHTML: (attrs: Record<string, any>) => ({ "data-props": JSON.stringify(attrs.props ?? {}) }) } }
  },
  parseHTML() { return [{ tag: "span[data-mdc-inline]" }] },
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) { return ["span", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-mdc-inline": HTMLAttributes.tag })] },
  addNodeView() { return VueNodeViewRenderer(InlineElementView) },
} as any)
;(InlineElement as any).config.markdownTokenName = "inlineElement"
;(InlineElement as any).config.markdownTokenizer = {
  name: "inlineElement", level: "inline", start: ":",
  tokenize(src: string) {
    const match = MDC_INLINE_RE.exec(src); if (!match || match.index !== 0 || match[1] === "mention") return undefined
    return { type: "inlineElement", raw: match[0]!, tag: match[1]!, content: match[2] ?? "", rawProps: match[3] ?? "" }
  },
}
;(InlineElement as any).config.parseMarkdown = function (token: any, helpers: any) {
  if (token.type !== "inlineElement") return null
  const nodeProps: Record<string, string> = {}; const re = /(\w+)="([^"]*)"/g; let m
  while ((m = re.exec(token.rawProps ?? "")) !== null) nodeProps[m[1]!] = m[2]!
  return helpers.createNode("inlineElement", { tag: token.tag, content: token.content, props: nodeProps })
}
;(InlineElement as any).config.renderMarkdown = function (node: any) {
  const { tag, content, props: p } = node.attrs ?? {}
  const propsStr = Object.entries(p ?? {}).filter(([, v]) => v).map(([k, v]) => `${k}="${v}"`).join(" ")
  return `:${tag}${content ? `[${content}]` : ""}${propsStr ? `{${propsStr}}` : ""}`
}

const lowlight = createLowlight(common)
const CodeBlockWithLanguage = CodeBlockLowlight.configure({ lowlight }).extend({
  addAttributes() { return { ...this.parent?.(), filename: { default: null } } },
  addNodeView() { return VueNodeViewRenderer(CodeBlockView) },
  addKeyboardShortcuts() {
    return { ...this.parent?.(), Enter: ({ editor }: { editor: Editor }) => {
      const { state } = editor; const { $from, empty } = state.selection
      if (!empty || $from.parent.type.name !== "codeBlock") return false
      if ($from.parentOffset !== $from.parent.content.size) return false
      if (!$from.parent.textContent.endsWith("\n\n")) return false
      const { tr } = state; tr.delete($from.pos - 2, $from.pos)
      const after = $from.after(); tr.insert(after - 2, state.schema.nodes.paragraph!.create())
      tr.setSelection((state.selection.constructor as any).near(tr.doc.resolve(after - 1))); editor.view.dispatch(tr); return true
    }}
  },
} as any)
;(CodeBlockWithLanguage as any).config.markdownTokenName = "code"
;(CodeBlockWithLanguage as any).config.parseMarkdown = function (token: any, helpers: any) {
  if (token.type !== "code") return null
  const langStr = token.lang ?? ""; const filenameMatch = langStr.match(/^(\S*)\s*\[([^\]]+)\]/)
  return helpers.createNode("codeBlock", { language: filenameMatch ? filenameMatch[1] || null : langStr || null, filename: filenameMatch ? filenameMatch[2] : null }, [helpers.createTextNode(token.text ?? "")])
}
;(CodeBlockWithLanguage as any).config.renderMarkdown = function (node: any) {
  const lang = node.attrs?.language ?? ""; const filename = node.attrs?.filename ?? ""
  let code = ""; node.content?.forEach((child: any) => { if (child.type === "text") code += child.text ?? "" })
  return `\`\`\`${filename ? `${lang} [${filename}]` : lang}\n${code}\n\`\`\``
}

const Slot = Node.create({
  name: "slot", group: "block", content: "block+", defining: true, isolating: true,
  addOptions() { return { HTMLAttributes: {} } },
  addAttributes() { return { name: { default: "default" } } },
  parseHTML() { return [{ tag: "div[data-mdc-slot]" }] },
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) { return ["div", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-mdc-slot": HTMLAttributes.name }), 0] },
  addNodeView() { return VueNodeViewRenderer(EditorSlotComp) },
  addKeyboardShortcuts() {
    return { Enter: ({ editor }: { editor: Editor }) => {
      const { state } = editor; const { $from, empty } = state.selection; if (!empty) return false
      const d = $from.depth - 1; if (d < 0) return false; const parent = $from.node(d)
      if (parent.type.name !== "slot") return false
      if ($from.index(d) !== parent.childCount - 1 || $from.parentOffset !== $from.parent.content.size) return false
      const elementDepth = d - 1; if (elementDepth < 0) return false; const element = $from.node(elementDepth)
      if (element.type.name !== "element") return false; if ($from.index(elementDepth) < element.childCount - 1) return false
      const after = $from.after(elementDepth); const { tr } = state
      tr.insert(after, state.schema.nodes.paragraph!.create()); tr.setSelection((state.selection.constructor as any).near(tr.doc.resolve(after + 1))); editor.view.dispatch(tr); return true
    }}
  },
} as any)
;(Slot as any).config.markdownTokenName = "slot"
;(Slot as any).config.markdownOptions = { indentsContent: false }
;(Slot as any).config.parseMarkdown = function (token: any, helpers: any) {
  if (token.type !== "slot") return null
  const parsedContent = token.tokens?.length ? helpers.parseBlockChildren(token.tokens) : [helpers.createNode("paragraph")]
  return helpers.createNode("slot", { name: token.name }, parsedContent.length ? parsedContent : [helpers.createNode("paragraph")])
}
;(Slot as any).config.renderMarkdown = function (node: any, h: any) {
  const name = node.attrs?.name ?? "default"
  return name === "default" ? h.renderChildren(node, "\n\n") : `#${name}\n${h.renderChildren(node, "\n\n")}`
}

const Element = Node.create({
  name: "element", group: "block", content: "block+", defining: true, isolating: true,
  addOptions() { return { HTMLAttributes: {} } },
  addAttributes() {
    return { tag: { default: "callout" }, props: { default: {}, parseHTML: (el: HTMLElement) => { try { return JSON.parse(el.getAttribute("data-props") ?? "{}") } catch { return {} } }, renderHTML: (attrs: Record<string, any>) => ({ "data-props": JSON.stringify(attrs.props ?? {}) }) } }
  },
  parseHTML() { return [{ tag: "div[data-mdc-element]" }] },
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) { return ["div", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-mdc-element": HTMLAttributes.tag }), 0] },
  addNodeView() { return VueNodeViewRenderer(EditorElementComp) },
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }: { editor: Editor }) => {
        const { state } = editor; const { $from, empty } = state.selection; if (!empty) return false
        const d = $from.depth - 1; if (d < 0) return false; const parent = $from.node(d)
        if (parent.type.name !== "element") return false
        if ($from.index(d) !== parent.childCount - 1 || $from.parentOffset !== $from.parent.content.size) return false
        const after = $from.after(d); const { tr } = state
        tr.insert(after, state.schema.nodes.paragraph!.create()); tr.setSelection((state.selection.constructor as any).near(tr.doc.resolve(after + 1))); editor.view.dispatch(tr); return true
      },
      Backspace: ({ editor }: { editor: Editor }) => {
        const { state } = editor; const { $from, empty } = state.selection; if (!empty) return false
        const d = $from.depth - 1; if (d < 0) return false; const parent = $from.node(d)
        if (parent.type.name !== "element") return false
        if ($from.index(d) !== 0 || $from.parentOffset !== 0) return false
        if (parent.childCount !== 1 || parent.firstChild?.content.size !== 0) return false
        return editor.chain().focus().deleteNode("element").run()
      },
    }
  },
  addProseMirrorPlugins() {
    return [new Plugin({ appendTransaction(_trs: any, _old: any, newState: any) {
      const { doc, schema, tr } = newState; if (!schema.nodes.element) return null
      const toDelete: number[] = []
      doc.forEach((node: any, pos: number) => { if (node.type.name === "element" && node.attrs.tag === "card-group") { const slot = node.childCount > 0 ? node.child(0) : null; if (!slot || !slot.childCount) toDelete.unshift(pos) } })
      if (!toDelete.length) return null
      let transaction = tr
      for (const pos of toDelete) { const node = transaction.doc.nodeAt(pos); if (node) transaction = transaction.delete(pos, pos + node.nodeSize) }
      return transaction
    }})]
  },
} as any)
;(Element as any).config.markdownTokenName = "element"
;(Element as any).config.markdownOptions = { indentsContent: true }
;(Element as any).config.markdownTokenizer = {
  name: "element", level: "block", start: "::",
  tokenize(src: string, _tokens: unknown[], helpers: { blockTokens: (s: string) => unknown[] }) {
    const match = MDC_BLOCK_RE.exec(src); if (!match) return undefined
    return { type: "element", raw: match[0]!, tag: match[2]!, rawProps: match[3] ?? "", slots: parseSlots(match[4] ?? "", helpers) }
  },
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
  const fence = ":".repeat((context?.level ?? 0) + 2); const header = propsStr ? `${fence}${tag}${propsStr}` : `${fence}${tag}`
  return `${header}\n${h.renderChildren(node, "\n\n")}\n${fence}`
}

// ── MathBlock ──────────────────────────────────────────────────────────────────
const MATH_BLOCK_INLINE_RE = /^\$\$([^\n]*)\$\$[ \t]*(?:\n|$)/
const MATH_BLOCK_FENCED_RE = /^\$\$([^\n]*)(?:\n([\s\S]*?))?\n\$\$[ \t]*(?:\n|$)/
const MathBlock = Node.create({
  name: "mathBlock", group: "block", atom: true, selectable: true, draggable: true,
  addOptions() { return { HTMLAttributes: {} } },
  addAttributes() { return { formula: { default: "" } } },
  parseHTML() { return [{ tag: "div[data-math-block]" }] },
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) { return ["div", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-math-block": HTMLAttributes.formula ?? "" })] },
  addNodeView() { return VueNodeViewRenderer(MathBlockView) },
  addKeyboardShortcuts() {
    return { Backspace: ({ editor }: { editor: Editor }) => {
      const { state } = editor; const { $from, empty } = state.selection; if (!empty) return false
      if ($from.parent.type.name !== "mathBlock") return false
      return editor.chain().focus().deleteNode("mathBlock").run()
    }}
  },
} as any)
;(MathBlock as any).config.markdownTokenName = "mathBlock"
;(MathBlock as any).config.markdownTokenizer = {
  name: "mathBlock", level: "block", start: "$$",
  tokenize(src: string) {
    const inlineMatch = MATH_BLOCK_INLINE_RE.exec(src)
    if (inlineMatch) return { type: "mathBlock", raw: inlineMatch[0]!, formula: (inlineMatch[1] ?? "").trim() }
    const fencedMatch = MATH_BLOCK_FENCED_RE.exec(src); if (!fencedMatch) return undefined
    const sameLine = (fencedMatch[1] ?? "").trim(); const bodyLines = (fencedMatch[2] ?? "").trim()
    const formula = sameLine && bodyLines ? `${sameLine}\n${bodyLines}` : sameLine || bodyLines
    return { type: "mathBlock", raw: fencedMatch[0]!, formula: formula.trim() }
  },
}
;(MathBlock as any).config.parseMarkdown = function (token: any, helpers: any) {
  if (token.type !== "mathBlock") return null
  return helpers.createNode("mathBlock", { formula: (token.formula ?? "").replace(/\\\\(?=[a-zA-Z{}[\]|])/g, "\\") })
}
;(MathBlock as any).config.renderMarkdown = function (node: any) { return `$$\n${node.attrs?.formula ?? ""}\n$$` }

// ── MathInline ─────────────────────────────────────────────────────────────────
const MATH_INLINE_RE = /^\$(?!\$)((?:[^$\n])+?)\$(?!\$)/
const MathInline = Node.create({
  name: "mathInline", group: "inline", inline: true, atom: true, selectable: true,
  addOptions() { return { HTMLAttributes: {} } },
  addAttributes() { return { formula: { default: "" } } },
  parseHTML() { return [{ tag: "span[data-math-inline]" }] },
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) { return ["span", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { "data-math-inline": HTMLAttributes.formula ?? "" })] },
  addNodeView() { return VueNodeViewRenderer(MathInlineView) },
} as any)
;(MathInline as any).config.markdownTokenName = "mathInline"
;(MathInline as any).config.markdownTokenizer = {
  name: "mathInline", level: "inline", start: "$",
  tokenize(src: string) { const match = MATH_INLINE_RE.exec(src); if (!match) return undefined; return { type: "mathInline", raw: match[0]!, formula: match[1] ?? "" } },
}
;(MathInline as any).config.parseMarkdown = function (token: any, helpers: any) {
  if (token.type !== "mathInline") return null
  return helpers.createNode("mathInline", { formula: (token.formula ?? "").replace(/\\\\(?=[a-zA-Z{}[\]|])/g, "\\") })
}
;(MathInline as any).config.renderMarkdown = function (node: any) { return `$${node.attrs?.formula ?? ""}$` }

// Patch Link extension for target="_blank" markdown serialization
;(Link as any).config.renderMarkdown = function (node: any, h: any) {
  const href = node.attrs?.href ?? ""; const title = node.attrs?.title ?? ""; const target = node.attrs?.target
  const text = h.renderChildren(node)
  if (target === "_blank") return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`
  return title ? `[${text}](${href} "${title}")` : `[${text}](${href})`
}

const extensions = [
  MentionWithHref, Element, Slot, CodeBlockWithLanguage, InlineElement, MathBlock, MathInline,
  Emoji,
  Table.configure({ resizable: false }),
  TableRow.extend({ renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) { return ["tr", mergeAttributes(HTMLAttributes, { class: "[&:first-child>th:first-child]:rounded-tl-md [&:first-child>th:last-child]:rounded-tr-md [&:last-child>td:first-child]:rounded-bl-md [&:last-child>td:last-child]:rounded-br-md" }), 0] } }),
  TableHeader.extend({ renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) { return ["th", mergeAttributes(HTMLAttributes, { class: "py-3 px-4 font-semibold text-sm border-e border-b first:border-s border-t border-muted text-left" }), 0] } }),
  TableCell.extend({ renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) { return ["td", mergeAttributes(HTMLAttributes, { class: "py-3 px-4 text-sm align-top border-e border-b first:border-s border-muted [&_p]:my-0 [&_p]:leading-6 text-left" }), 0] } }),
]

// ── Toolbar ────────────────────────────────────────────────────────────────────
const imageModalOpen = ref(false)
let _pendingImageEditor: Editor | null = null
function openImageModal(editor: Editor) { _pendingImageEditor = editor; imageModalOpen.value = true }
function onImageInsert(url: string) {
  if (!_pendingImageEditor) return
  _pendingImageEditor.chain().focus().setImage({ src: normalizeImageUrl(url, window.location.origin) }).run()
  _pendingImageEditor = null
}

const linkModalOpen = ref(false)
const linkInitialUrl = ref(""); const linkInitialTarget = ref<"_self" | "_blank">("_self")
let _pendingLinkEditor: Editor | null = null
function openLinkModal(editor: Editor) {
  _pendingLinkEditor = editor; const attrs = editor.getAttributes("link")
  linkInitialUrl.value = attrs.href || ""; linkInitialTarget.value = attrs.target === "_blank" ? "_blank" : "_self"; linkModalOpen.value = true
}
function onLinkInsert({ url, target }: { url: string; target: "_self" | "_blank" }) {
  if (!_pendingLinkEditor) return
  if (!url) { _pendingLinkEditor.chain().focus().unsetLink().run() }
  else { _pendingLinkEditor.chain().focus().setLink({ href: url, target: target === "_blank" ? "_blank" : "_self" }).run() }
  _pendingLinkEditor = null
}
function onLinkRemove() { _pendingLinkEditor?.chain().focus().unsetLink().run(); _pendingLinkEditor = null }

const mermaidModalOpen = ref(false)
let _pendingMermaidEditor: Editor | null = null
function openMermaidModal(editor: Editor) { _pendingMermaidEditor = editor; mermaidModalOpen.value = true }
function onMermaidInsert(code: string) {
  if (!_pendingMermaidEditor) return
  _pendingMermaidEditor.chain().focus().insertContent({ type: "codeBlock", attrs: { language: "mermaid", filename: null }, content: [{ type: "text", text: code }] }).run()
  _pendingMermaidEditor = null
}

const { customHandlers, editorToolbarItems, suggestionItems, editorBaseClass } = useEditorToolbar({ openImageModal, openLinkModal, openMermaidModal })

provide("editorHandlers", computed(() => customHandlers))

// ── Visual editor ref ──────────────────────────────────────────────────────────
const visualEditorRef = ref<any>(null)
const previewPanelRef = ref<any>(null)
const panesRowRef = ref<HTMLElement | null>(null)
const activeEditor = ref<any>(null)

watch(editorMode, (mode) => {
  if (mode !== "visual") activeEditor.value = null
  if (panesRowRef.value) panesRowRef.value.scrollTop = 0
})

// ── Mention insert popover ─────────────────────────────────────────────────────
const mentionInsertOpen = ref(false)
const mentionInsertItem = ref<any>(null)
let _mentionPendingEditor: any = null; let _mentionPendingRange: any = null

mentionOnSelect.value = (e: any, range: any, item: any) => {
  _mentionPendingEditor = e; _mentionPendingRange = range; mentionInsertItem.value = item; mentionInsertOpen.value = true
}

function onMentionConfirm({ label, style, color, variant }: { label: string; style: string; color?: string; variant?: string }) {
  mentionInsertOpen.value = false
  const e = _mentionPendingEditor; const range = _mentionPendingRange; const item = mentionInsertItem.value
  _mentionPendingEditor = null; _mentionPendingRange = null; mentionInsertItem.value = null
  if (!e || !range || !item) return
  e.chain().focus().deleteRange(range).insertContent({ type: "mention", attrs: { ...item, label: label || item.label, linkStyle: style, btnColor: color || "primary", btnVariant: variant || "solid", mentionSuggestionChar: "@" } }).run()
}
function onMentionCancel() { mentionInsertOpen.value = false; _mentionPendingEditor = null; _mentionPendingRange = null; mentionInsertItem.value = null }

// ── LaTeX ──────────────────────────────────────────────────────────────────────
const latexOriginal = ref<string | null>(null)
const latexConversionMode = ref<"visual" | "source" | null>(null)
function dismissLatexBanner() { latexOriginal.value = null; latexConversionMode.value = null }
function undoLatexConversion() {
  if (!latexOriginal.value) return
  if (latexConversionMode.value === "source") { content.value = latexOriginal.value }
  else if (activeEditor.value) { activeEditor.value.commands.setContent(`<pre><code>${latexOriginal.value.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`) }
  latexOriginal.value = null; latexConversionMode.value = null
}

// ── Visual editor paste handler ────────────────────────────────────────────────
const MD_PASTE_RE = /^(\s*#{1,6} |>\s|\*\*|__|\*[^*]|_[^_]|\s*[-*+] |\s*\d+\. |```|~~~|\|.+\|)/m
const visualEditorProps = {
  handlePaste(_view: any, event: ClipboardEvent) {
    if (!event.clipboardData || !activeEditor.value) return false
    const text = event.clipboardData.getData("text/plain"); if (!text) return false
    if (isLatexDocument(text)) {
      const markdown = convertLatexToMarkdown(text)
      activeEditor.value.commands.insertContent(markdown, { contentType: "markdown" })
      latexOriginal.value = text; latexConversionMode.value = "visual"; return true
    }
    const vscodeData = event.clipboardData.getData("vscode-editor-data")
    if (vscodeData) {
      const normalised = text.replace(/\r\n?/g, "\n")
      if (MD_PASTE_RE.test(normalised)) { activeEditor.value.commands.insertContent(normalised, { contentType: "markdown" }) }
      else { activeEditor.value.commands.insertContent(normalised) }
      return true
    }
    if (MD_PASTE_RE.test(text)) { activeEditor.value.commands.insertContent(text.replace(/\r\n?/g, "\n"), { contentType: "markdown" }); return true }
    return false
  },
}
const emojiItems = gitHubEmojis.filter((e: any) => !e.name.startsWith("regional_indicator_"))

mentionGetItems.value = () => mentionItems.value
mentionSetQuery.value = (q: string) => { mentionSearchTerm.value = q }

// ── Lifecycle ──────────────────────────────────────────────────────────────────
onMounted(() => { window.addEventListener("keydown", handleGlobalKeydown) })
onBeforeUnmount(() => { window.removeEventListener("keydown", handleGlobalKeydown) })

useSeoMeta({ title: () => `Edit: ${props.doc?.title ?? "Doc"}` })

</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden">
    <AppHeader />
    <main class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <!-- Top action bar -->
      <EditorEditDocBar
        :title="meta.title"
        :base-path="basePath"
        :has-draft="hasDraftLocal"
        :has-unsaved-changes="hasUnsavedChanges"
        :saving="saving"
        :publishing="publishing"
        :focus-mode="focusMode"
        @update:title="meta.title = $event"
        @save="save"
        @publish="publish"
        @toggle-focus-mode="toggleFocusMode"
      />

      <!-- LaTeX conversion notice -->
      <EditorEditDocLatexBanner
        v-if="latexOriginal"
        :original="latexOriginal"
        @undo="undoLatexConversion"
        @dismiss="dismissLatexBanner"
      />

      <!-- Editor + Preview split -->
      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <!-- Shared toolbar — only shown in visual mode -->
        <EditorEditDocVisualToolbar
          v-if="editorMode === 'visual'"
          :editor="activeEditor"
          :toolbar-items="editorToolbarItems"
          :handlers="customHandlers"
          :show-preview="showPreview"
          @toggle-preview="togglePreview"
          @toggle-source="toggleEditorMode"
        />

        <!-- Source mode toolbar -->
        <div
          v-else
          class="border-default bg-default/60 flex shrink-0 items-center justify-between border-b px-3 py-2"
        >
          <span class="text-muted flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase">
            <UIcon name="i-lucide-code" class="h-3 w-3" /> Markdown Source
          </span>
          <div class="flex items-center gap-1">
            <UTooltip text="Switch to visual editor">
              <UButton icon="i-lucide-layout-template" color="neutral" variant="ghost" size="xs" @click="toggleEditorMode" />
            </UTooltip>
            <UButton
              :icon="showPreview ? 'i-lucide-panel-right-close' : 'i-lucide-panel-right-open'"
              :label="showPreview ? 'Close preview' : 'Preview'"
              color="neutral" variant="ghost" size="xs"
              @click="togglePreview"
            />
          </div>
        </div>

        <div
          ref="panesRowRef"
          class="flex flex-1"
          :class="editorMode === 'visual' ? 'overflow-y-auto' : 'min-h-0 overflow-hidden'"
        >
          <EditorEditDocVisualEditor
            v-if="editorMode === 'visual'"
            ref="visualEditorRef"
            v-model="content"
            :extensions="extensions"
            :emoji-items="emojiItems"
            :suggestion-items="suggestionItems"
            :handlers="customHandlers"
            :base-class="editorBaseClass"
            :is-rtl="isRtl"
            :editor-props="visualEditorProps"
            class="flex-1"
            :class="showPreview ? 'w-1/2' : 'w-full'"
            @save="save"
            @editor-ready="activeEditor = $event"
          />

          <EditorEditDocSourceEditor
            v-else
            v-model="content"
            class="min-h-0 w-full flex-1 overflow-hidden"
            :language="props.doc?.language"
            @save="save"
            @latex-pasted="(original) => { latexOriginal = original; latexConversionMode = 'source' }"
          />

          <EditorEditDocPreviewPanel
            v-if="showPreview"
            ref="previewPanelRef"
            :ast="previewAst"
            :parsing="previewParsing"
            :raw-content="content"
            :language="props.doc?.language"
            :is-rtl="isRtl"
            :class="editorMode === 'source' ? 'min-h-0 overflow-y-auto' : ''"
          />
        </div>
      </div>

      <EditorEditDocStatusBar
        :word-count="wordCount"
        :reading-time="readingTime"
        :focus-mode="focusMode"
        @toggle-focus-mode="toggleFocusMode"
      />
    </main>
  </div>

  <!-- Image modal -->
  <EditorEditDocImageModal
    v-model:open="imageModalOpen"
    :fetch-images="() => $fetch<any>(`/api/docs/${props.doc?.id}/images`).then((r: any) => r?.data ?? r)"
    :upload-url="props.doc?.id ? `/api/docs/${props.doc.id}/images` : undefined"
    @insert="onImageInsert"
  />

  <!-- Link modal -->
  <EditorEditDocLinkModal v-model:open="linkModalOpen" :initial-url="linkInitialUrl" :initial-target="linkInitialTarget" @insert="onLinkInsert" @remove="onLinkRemove" />

  <!-- Mermaid picker modal -->
  <EditorMermaidPickerModal v-model:open="mermaidModalOpen" @insert="onMermaidInsert" />

  <!-- Mention style popover -->
  <UModal
    v-model:open="mentionInsertOpen"
    :title="mentionInsertItem ? `Insert mention — ${mentionInsertItem.label}` : 'Insert mention'"
    :ui="{ width: 'max-w-sm' }"
    @close="onMentionCancel"
  >
    <template #body>
      <EditorMentionInsertPopover
        v-if="mentionInsertItem"
        :item="mentionInsertItem"
        @confirm="onMentionConfirm"
        @cancel="onMentionCancel"
      />
    </template>
  </UModal>
</template>
