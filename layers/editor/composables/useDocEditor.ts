/**
 * useDocEditor — pure editor state for nuxt-doc-kit.
 *
 * No API calls. The host app provides save/publish/mentionSearch callbacks
 * and receives events back via those same callbacks (or through returned refs).
 *
 * Usage:
 *
 *   const editor = useDocEditor({
 *     doc,
 *     initialContent: rawBody,
 *     onSave: async (content, meta) => { await $fetch('/api/docs/...', ...) },
 *     onPublish: async () => { await $fetch('/api/docs/.../publish', ...) },
 *     onMentionSearch: async (query) => fetchMentionResults(query),
 *   })
 */
import type { Ref } from "vue"

// Inline reading stats — avoids a cross-layer import
// (same logic as reader/composables/useReadingStats.ts)
const WORDS_PER_MINUTE = 238
function _computeStats(rawText: string) {
  const clean = rawText
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const words = clean.length === 0 ? 0 : clean.split(/\s+/).filter(Boolean).length
  const mins = Math.floor(Math.round((words / WORDS_PER_MINUTE) * 60) / 60)
  return { words, readingTimeMin: mins }
}

export interface DocEditorMeta {
  title: string
  description: string
  seoTitle: string
  seoDescription: string
  noIndex: boolean
  tags: string[]
}

export interface DocEditorOptions {
  /** Resolved doc object (reactive) — used to seed meta fields */
  doc: Ref<any>
  /**
   * Called when user clicks Save (full save: body + metadata).
   * Receives current content string and metadata object.
   * Should return a promise. On 409 conflict throw with status 409.
   */
  onSave: (content: string, meta: DocEditorMeta) => Promise<void>
  /**
   * Called when user clicks Publish.
   * Should return a promise. On 409 (already published) throw with status 409.
   */
  onPublish: () => Promise<void>
  /**
   * Called by autosave (body-only, debounced 30s).
   * Receives current content string.
   * Return null on 409 conflict so the user can be warned.
   */
  onAutoSave?: (content: string) => Promise<void>
  /**
   * Called when user types @mentions (debounced 300ms).
   * Return an array of mention items for the suggestion dropdown.
   * If not provided, mention search is disabled.
   */
  onMentionSearch?: (query: string) => Promise<any[]>
}

export function useDocEditor(options: DocEditorOptions) {
  const { doc, onSave, onPublish, onAutoSave, onMentionSearch } = options
  const toast = useToast()

  // ── Metadata ───────────────────────────────────────────────────────────────
  const meta = reactive<DocEditorMeta>({
    title: doc.value?.title ?? "",
    description: doc.value?.description ?? "",
    seoTitle: (doc.value?.seo as any)?.title ?? "",
    seoDescription: (doc.value?.seo as any)?.description ?? "",
    noIndex: (doc.value?.seo as any)?.noIndex === true,
    tags: Array.isArray((doc.value as any)?.tags) ? [...(doc.value as any).tags] : [],
  })

  watch(doc, (d) => {
    if (!d) return
    meta.title = d.title ?? ""
    meta.description = d.description ?? ""
    meta.seoTitle = (d.seo as any)?.title ?? ""
    meta.seoDescription = (d.seo as any)?.description ?? ""
    meta.noIndex = (d.seo as any)?.noIndex === true
    meta.tags = Array.isArray((d as any).tags) ? [...(d as any).tags] : []
  })

  // ── Content ────────────────────────────────────────────────────────────────
  const content = ref(doc.value?.draftBody ?? doc.value?.body ?? "")
  const savedContent = ref(content.value)
  const hasUnsavedChanges = computed(() => content.value !== savedContent.value)

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = computed(() => _computeStats(content.value))
  const wordCount = computed(() => stats.value.words)
  const readingTime = computed(() => stats.value.readingTimeMin)

  // ── Save ───────────────────────────────────────────────────────────────────
  const saving = ref(false)

  async function autoSaveBody() {
    if (!hasUnsavedChanges.value || saving.value || !onAutoSave) return
    saving.value = true
    try {
      await onAutoSave(content.value)
      savedContent.value = content.value
    } catch (err: any) {
      const status = err?.status ?? err?.statusCode
      if (status === 409) {
        toast.add({
          title: "Conflict — doc was modified by another editor",
          description: "Your draft is preserved. Refresh to get the latest version.",
          color: "warning",
          duration: 8000,
        })
      }
    } finally {
      saving.value = false
    }
  }

  async function save() {
    saving.value = true
    try {
      await onSave(content.value, { ...meta })
      savedContent.value = content.value
      toast.add({ title: "Saved", icon: "i-lucide-check-circle", color: "primary" })
    } catch (err: any) {
      const status = err?.status ?? err?.statusCode
      if (status === 409) {
        toast.add({
          title: "Conflict — doc was modified by another editor",
          description: "Refresh to get the latest version.",
          color: "warning",
          duration: 8000,
        })
      } else {
        toast.add({
          title: "Save failed",
          description: err?.data?.statusText || err?.message || "Unknown error",
          color: "error",
        })
      }
    } finally {
      saving.value = false
    }
  }

  // ── Publish ────────────────────────────────────────────────────────────────
  const publishing = ref(false)

  async function publish() {
    publishing.value = true
    try {
      await onPublish()
      toast.add({
        title: "Published",
        description: "Content is now live.",
        icon: "i-lucide-globe",
        color: "success",
      })
    } catch (err: any) {
      const status = err?.status ?? err?.statusCode
      if (status === 409) {
        toast.add({
          title: "Already published",
          description: "No unpublished changes.",
          color: "neutral",
        })
      } else {
        toast.add({
          title: "Publish failed",
          description: err?.data?.statusText || err?.message || "Unknown error",
          color: "error",
        })
      }
    } finally {
      publishing.value = false
    }
  }

  // ── Editor mode ────────────────────────────────────────────────────────────
  const editorMode = useLocalStorage<"visual" | "source">("nuxt-doc-kit:editor:mode", "visual")
  function toggleEditorMode() {
    editorMode.value = editorMode.value === "visual" ? "source" : "visual"
  }

  // ── Focus mode ─────────────────────────────────────────────────────────────
  const focusMode = ref(false)
  function toggleFocusMode() {
    focusMode.value = !focusMode.value
  }
  function handleGlobalKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "f") {
      e.preventDefault()
      toggleFocusMode()
    }
    if (e.key === "Escape" && focusMode.value) focusMode.value = false
  }

  // ── Preview ────────────────────────────────────────────────────────────────
  const showPreview = useLocalStorage<boolean>("nuxt-doc-kit:editor:preview", false)
  const previewAst = ref<any>(null)
  const previewParsing = ref(false)

  async function buildPreview() {
    previewParsing.value = true
    try {
      const { parse } = await import("comark")
      const mathPlugin = (await import("comark/plugins/math")).default
      const mermaidPlugin = (await import("comark/plugins/mermaid")).default
      const highlightPlugin = (await import("comark/plugins/highlight")).default
      const res = await parse(content.value || "", {
        plugins: [mathPlugin(), mermaidPlugin(), highlightPlugin()],
      })
      previewAst.value = res
    } catch {
      previewAst.value = null
    } finally {
      previewParsing.value = false
    }
  }

  watchDebounced(
    content,
    () => {
      if (showPreview.value) void buildPreview()
    },
    { debounce: 400 },
  )
  function togglePreview() {
    showPreview.value = !showPreview.value
    if (showPreview.value) void buildPreview()
  }

  // Also build on mount if preview was already open (persisted localStorage)
  onMounted(() => {
    if (showPreview.value && content.value) void buildPreview()
  })

  // Autosave — 30s debounce after last keystroke
  if (onAutoSave) {
    watchDebounced(content, () => autoSaveBody(), { debounce: 30_000 })
  }

  // ── Mention search ─────────────────────────────────────────────────────────
  const mentionItems = ref<any[]>([
    {
      type: "label",
      label: onMentionSearch ? "Type 2+ characters to search" : "Mentions disabled",
    },
  ])
  const mentionSearchTerm = ref("")

  if (onMentionSearch) {
    watchDebounced(
      mentionSearchTerm,
      async (query) => {
        if (!query || query.length < 2) {
          mentionItems.value = [{ type: "label", label: "Type 2+ characters to search" }]
          return
        }
        mentionItems.value = [{ type: "label", label: "Searching…" }]
        try {
          const results = await onMentionSearch(query)
          mentionItems.value = results.length
            ? results
            : [{ type: "label", label: `No results for "${query}"` }]
        } catch {
          mentionItems.value = [{ type: "label", label: "Search failed. Try again." }]
        }
      },
      { debounce: 300 },
    )
  }

  return {
    // metadata
    meta,
    // content
    content,
    savedContent,
    hasUnsavedChanges,
    // stats
    wordCount,
    readingTime,
    // save / publish
    saving,
    publishing,
    save,
    autoSaveBody,
    publish,
    // modes
    editorMode,
    toggleEditorMode,
    focusMode,
    toggleFocusMode,
    handleGlobalKeydown,
    // preview
    showPreview,
    previewAst,
    previewParsing,
    buildPreview,
    togglePreview,
    // mention
    mentionItems,
    mentionSearchTerm,
  }
}
