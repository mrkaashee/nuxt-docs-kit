/**
 * useEditorState
 *
 * Pure editor state — no API calls. All IO is delegated to the parent via
 * the returned action callbacks (save, publish) which the parent binds to
 * their own fetch/emit handlers.
 *
 * Used by DocEditor.vue internally and exposed so the parent page can read
 * saving/publishing state for its own UI if needed.
 */

export interface DocEditorMeta {
  title: string
  description: string
  seoTitle: string
  seoDescription: string
  noIndex: boolean
  tags: string[]
}

export interface DocEditorSavePayload {
  content: string
  meta: DocEditorMeta
}

export function useEditorState(options: {
  /** Reactive doc object from the parent */
  doc: Ref<any>
  /** Initial markdown body */
  initialRawBody: Ref<string>
  /** Called by save() — parent handles the actual PATCH */
  onSave: (payload: DocEditorSavePayload) => Promise<void>
  /** Called by publish() — parent handles the actual POST */
  onPublish: () => Promise<void>
}) {
  const { doc, initialRawBody, onSave, onPublish } = options
  const toast = useToast()

  // ── Metadata ────────────────────────────────────────────────────────────────
  const meta = reactive<DocEditorMeta>({
    title: doc.value?.title ?? "",
    description: doc.value?.description ?? "",
    seoTitle: (doc.value?.seo as any)?.title ?? "",
    seoDescription: (doc.value?.seo as any)?.description ?? "",
    noIndex: (doc.value?.seo as any)?.noIndex === true,
    tags: Array.isArray(doc.value?.tags) ? [...doc.value.tags] : [],
  })

  watch(doc, (d) => {
    if (!d) return
    meta.title = d.title ?? ""
    meta.description = d.description ?? ""
    meta.seoTitle = (d.seo as any)?.title ?? ""
    meta.seoDescription = (d.seo as any)?.description ?? ""
    meta.noIndex = (d.seo as any)?.noIndex === true
    meta.tags = Array.isArray(d.tags) ? [...d.tags] : []
  })

  // ── Content ─────────────────────────────────────────────────────────────────
  const content = ref(initialRawBody.value)
  const savedContent = ref(initialRawBody.value)
  const hasUnsavedChanges = computed(() => content.value !== savedContent.value)

  watch(initialRawBody, (val) => {
    if (val !== undefined && val !== content.value) {
      content.value = val
      savedContent.value = val
    }
  })

  // ── Stats ───────────────────────────────────────────────────────────────────
  const wordCount = computed(() => {
    const text = content.value.trim()
    return text ? text.split(/\s+/).filter(Boolean).length : 0
  })
  const readingTime = computed(() => Math.max(1, Math.round(wordCount.value / 200)))

  // ── Save ─────────────────────────────────────────────────────────────────────
  const saving = ref(false)

  async function save() {
    if (saving.value) return
    saving.value = true
    try {
      await onSave({ content: content.value, meta: { ...meta } })
      savedContent.value = content.value
      toast.add({ title: "Saved", icon: "i-lucide-check-circle", color: "primary" })
    } catch (err: any) {
      const status = err?.status ?? err?.data?.statusCode ?? err?.statusCode
      if (status === 409) {
        toast.add({
          title: "Conflict — doc was modified by another editor",
          description: "Your draft is preserved. Refresh to get the latest version.",
          color: "warning",
          icon: "i-lucide-git-merge",
          duration: 8000,
        })
      } else {
        toast.add({
          title: "Save failed",
          description:
            err?.data?.statusText || err?.data?.message || err?.message || "Unknown error",
          color: "error",
        })
      }
    } finally {
      saving.value = false
    }
  }

  // Autosave — body only, 30s debounce
  const autosaving = ref(false)
  watchDebounced(
    content,
    async () => {
      if (!hasUnsavedChanges.value || saving.value || autosaving.value) return
      autosaving.value = true
      try {
        await onSave({ content: content.value, meta: { ...meta } })
        savedContent.value = content.value
      } catch {
        // Silent — user can retry with manual save
      } finally {
        autosaving.value = false
      }
    },
    { debounce: 30_000 },
  )

  // ── Publish ──────────────────────────────────────────────────────────────────
  const publishing = ref(false)

  async function publish() {
    if (publishing.value) return
    publishing.value = true
    try {
      await onPublish()
      toast.add({
        title: "Published",
        description: "Content is now live for all readers.",
        icon: "i-lucide-globe",
        color: "success",
      })
    } catch (err: any) {
      const status = err?.status ?? err?.data?.statusCode ?? err?.statusCode
      if (status === 409) {
        toast.add({
          title: "Already published",
          description: "This doc has no unpublished changes.",
          icon: "i-lucide-check-circle",
          color: "neutral",
        })
      } else {
        toast.add({
          title: "Publish failed",
          description:
            err?.data?.statusText || err?.data?.message || err?.message || "Unknown error",
          color: "error",
        })
      }
    } finally {
      publishing.value = false
    }
  }

  // ── Editor modes ─────────────────────────────────────────────────────────────
  const editorMode = useLocalStorage<"visual" | "source">("qarpeo:editor:mode", "visual")
  function toggleEditorMode() {
    editorMode.value = editorMode.value === "visual" ? "source" : "visual"
  }

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

  // ── Preview ──────────────────────────────────────────────────────────────────
  const showPreview = useLocalStorage<boolean>("qarpeo:editor:preview", false)
  const previewAst = ref<any>(null)
  const previewParsing = ref(false)

  async function buildPreview() {
    previewParsing.value = true
    try {
      const { parse } = await import("comark")
      const mathPlugin = (await import("comark/plugins/math")).default
      const mermaidPlugin = (await import("comark/plugins/mermaid")).default
      const highlightPlugin = (await import("comark/plugins/highlight")).default
      const { sanitizeComarkAst } = await import("#layers/reader/shared/utils/comark")
      const { isLatexDocument, convertLatexToMarkdown } =
        await import("#layers/editor/shared/utils/latex")

      let rawText = content.value || ""
      if (isLatexDocument(rawText)) rawText = convertLatexToMarkdown(rawText)

      const res = await parse(rawText, {
        plugins: [mathPlugin(), mermaidPlugin(), highlightPlugin()],
      })
      if (res && Array.isArray(res.nodes)) res.nodes = sanitizeComarkAst(res.nodes)
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

  // When content first arrives from the fetch (initialRawBody changes) and
  // preview is already open (restored from localStorage), rebuild immediately.
  // The debounced content watcher won't fire for the initial assignment.
  watch(initialRawBody, (val) => {
    if (val?.trim() && showPreview.value) {
      void buildPreview()
    }
  })

  // On mount: if preview was open (restored from localStorage) and content is
  // already available (SSR/await useFetch populated it before mount), build now.
  onMounted(() => {
    if (showPreview.value && content.value.trim()) {
      void buildPreview()
    }
  })

  // ── Mention search ───────────────────────────────────────────────────────────
  // Host app provides a search function via:
  //   provide('resolveMentionSearch', async (query) => MentionItem[])
  // Falls back to an empty result if not provided.
  type MentionItem = {
    id: string
    label: string
    description?: string
    avatar?: any
    icon?: string
    href?: string
    mentionType?: string
  }
  const resolveMentionSearch = inject<((query: string) => Promise<MentionItem[]>) | null>(
    "resolveMentionSearch",
    null,
  )

  const mentionItems = ref<any[]>([{ type: "label", label: "Type 2+ characters to search" }])
  const mentionSearchTerm = ref("")

  watchDebounced(
    mentionSearchTerm,
    async (query) => {
      if (!query || query.length < 2) {
        mentionItems.value = [{ type: "label", label: "Type 2+ characters to search" }]
        return
      }
      if (!resolveMentionSearch) {
        mentionItems.value = [{ type: "label", label: "No search configured" }]
        return
      }
      mentionItems.value = [{ type: "label", label: "Searching…" }]
      try {
        const results = await resolveMentionSearch(query)
        mentionItems.value = results.length
          ? results
          : [{ type: "label", label: `No results for "${query}"` }]
      } catch {
        mentionItems.value = [{ type: "label", label: "Search failed. Try again." }]
      }
    },
    { debounce: 300 },
  )

  return {
    meta,
    content,
    savedContent,
    hasUnsavedChanges,
    wordCount,
    readingTime,
    saving,
    autosaving,
    save,
    publishing,
    publish,
    editorMode,
    toggleEditorMode,
    focusMode,
    toggleFocusMode,
    handleGlobalKeydown,
    showPreview,
    previewAst,
    previewParsing,
    buildPreview,
    togglePreview,
    mentionItems,
    mentionSearchTerm,
  }
}
