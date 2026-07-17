<script setup lang="ts">
import { convertLatexToMarkdown, isLatexDocument } from "#shared/utils/docs"
/**
 * CodeMirror 6 markdown editor.
 * Lazy-loaded — only imports CodeMirror when this component mounts.
 * Supports: markdown syntax highlighting, MDC block highlighting,
 * dark/light theme sync, RTL, find/replace, undo/redo.
 */

const props = defineProps<{
  modelValue: string
  language?: string
  placeholder?: string
  readOnly?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: string]
  save: []
  "latex-pasted": [original: string]
}>()

const containerRef = ref<HTMLDivElement>()
let view: any = null

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === "dark")
const isRtl = computed(() => ["ur", "ar"].includes(props.language?.toLowerCase() || ""))

// ── Build CodeMirror extensions ───────────────────────────────────────────────

async function buildExtensions(dark: boolean) {
  const [
    {
      EditorView,
      keymap,
      lineNumbers,
      highlightActiveLine,
      drawSelection,
      dropCursor,
      rectangularSelection,
      crosshairCursor,
      highlightActiveLineGutter,
    },
    { EditorState },
    { defaultKeymap, history, historyKeymap, indentWithTab },
    { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, indentOnInput },
    { oneDark },
    { search, searchKeymap },
  ] = await Promise.all([
    import("@codemirror/view"),
    import("@codemirror/state"),
    import("@codemirror/commands"),
    import("@codemirror/language"),
    import("@codemirror/theme-one-dark"),
    import("@codemirror/search"),
  ])

  // Load correct language extension dynamically
  let langExtension: any = []
  if (props.language?.toLowerCase() === "json") {
    const { json } = await import("@codemirror/lang-json")
    langExtension = json()
  } else {
    const [{ markdown, markdownLanguage }, { languages }] = await Promise.all([
      import("@codemirror/lang-markdown"),
      import("@codemirror/language-data"),
    ])
    langExtension = markdown({
      base: markdownLanguage,
      codeLanguages: languages,
    })
  }

  // Light theme — matches the app's default background
  const lightTheme = EditorView.theme(
    {
      "&": { backgroundColor: "transparent", height: "100%" },
      ".cm-scroller": {
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: "13px",
        lineHeight: "1.7",
      },
      ".cm-content": { padding: "2rem 2rem" },
      ".cm-line": { padding: "0" },
      ".cm-activeLine": { backgroundColor: "rgba(0,0,0,0.03)" },
      ".cm-activeLineGutter": { backgroundColor: "rgba(0,0,0,0.03)" },
      ".cm-gutters": { backgroundColor: "transparent", border: "none", color: "rgba(0,0,0,0.25)" },
      ".cm-cursor": { borderLeftColor: "var(--ui-primary)" },
      ".cm-selectionBackground": {
        backgroundColor: "rgba(var(--ui-primary-rgb, 99,102,241), 0.15)",
      },
      "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "rgba(var(--ui-primary-rgb, 99,102,241), 0.2)",
      },
      ".cm-searchMatch": {
        backgroundColor: "rgba(255,200,0,0.3)",
        outline: "1px solid rgba(255,200,0,0.5)",
      },
      ".cm-searchMatch.cm-searchMatch-selected": { backgroundColor: "rgba(255,200,0,0.5)" },
    },
    { dark: false },
  )

  const activeLine = props.readOnly ? [] : [highlightActiveLineGutter(), highlightActiveLine()]

  const extensions = [
    lineNumbers(),
    ...activeLine,
    drawSelection(),
    dropCursor(),
    rectangularSelection(),
    crosshairCursor(),
    bracketMatching(),
    indentOnInput(),
    foldGutter(),
    props.readOnly ? [] : history(),
    search({ top: true }),
    langExtension,
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    dark ? oneDark : lightTheme,
    EditorView.lineWrapping,
    EditorState.tabSize.of(2),
    EditorState.readOnly.of(!!props.readOnly),
    EditorView.editable.of(!props.readOnly),
    keymap.of([
      ...(props.readOnly ? [] : [indentWithTab]),
      ...defaultKeymap,
      ...(props.readOnly ? [] : historyKeymap),
      ...searchKeymap,
      // Ctrl/Cmd+S → emit save
      {
        key: "Mod-s",
        run: () => {
          if (!props.readOnly) {
            emit("save")
          }
          return true
        },
      },
    ]),
  ]

  if (!props.readOnly) {
    extensions.push(
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          emit("update:modelValue", update.state.doc.toString())
        }
      }),
      EditorView.domEventHandlers({
        paste(event, view) {
          if (!event.clipboardData) return false
          const text = event.clipboardData.getData("text/plain")
          if (!text) return false

          if (isLatexDocument(text)) {
            event.preventDefault()
            const converted = convertLatexToMarkdown(text)
            const transaction = view.state.replaceSelection(converted)
            view.dispatch(transaction)
            emit("latex-pasted", text)
            return true
          }
          return false
        },
      }),
    )
  }

  extensions.push(EditorView.contentAttributes.of({ dir: isRtl.value ? "rtl" : "ltr" }))

  return extensions
}

// ── Mount / destroy ───────────────────────────────────────────────────────────

async function mount() {
  if (!containerRef.value) return

  const [{ EditorView }, { EditorState }] = await Promise.all([
    import("@codemirror/view"),
    import("@codemirror/state"),
  ])

  const extensions = await buildExtensions(isDark.value)

  view = new EditorView({
    state: EditorState.create({
      doc: props.modelValue,
      extensions,
    }),
    parent: containerRef.value,
  })
}

function destroy() {
  if (view) {
    view.destroy()
    view = null
  }
}

onMounted(mount)
onBeforeUnmount(destroy)

// ── Sync external value changes → editor ─────────────────────────────────────

watch(
  () => props.modelValue,
  (newVal) => {
    if (!view) return
    const current = view.state.doc.toString()
    if (current === newVal) return
    // Replace entire document content
    view.dispatch({
      changes: { from: 0, to: current.length, insert: newVal },
    })
  },
)

// ── Sync theme changes ────────────────────────────────────────────────────────

watch(isDark, async () => {
  if (!view) return
  // Rebuild with new theme
  const { EditorState } = await import("@codemirror/state")
  const extensions = await buildExtensions(isDark.value)
  const doc = view.state.doc.toString()
  const sel = view.state.selection
  view.setState(EditorState.create({ doc, extensions, selection: sel }))
})
</script>

<template>
  <div
    ref="containerRef"
    class="cm-editor-host min-h-0 flex-1 overflow-auto"
    :dir="isRtl ? 'rtl' : 'ltr'"
  />
</template>

<style>
/* Ensure CodeMirror fills its container */
.cm-editor-host .cm-editor {
  height: 100%;
  outline: none;
}
.cm-editor-host .cm-scroller {
  overflow: auto;
}
/* MDC block syntax — highlight :: fences */
.cm-editor-host .cm-line:has(.tok-punctuation):has(.tok-tagName) {
  opacity: 0.85;
}
</style>
