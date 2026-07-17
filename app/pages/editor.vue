<script lang="ts" setup>
/**
 * editor.vue — nuxt-doc-kit editor layer demo
 *
 * Shows how to wire useDocEditor with your own save/publish callbacks.
 * All data is hardcoded — no API calls in this demo page.
 */
definePageMeta({ layout: false })

// ── Hardcoded demo doc ─────────────────────────────────────────────────────
const INITIAL_CONTENT = `# Getting Started

Edit this document. Try the toolbar or type **/** for slash commands.

## Features

- Visual editor (TipTap)
- Source (Markdown) editor
- Live preview pane
- Math: $E = mc^2$
- MDC components: ::callout{icon="i-lucide-info" color="info"}\nThis is a callout.\n::
`

const doc = ref({
  id: "doc_demo_1",
  title: "Getting Started with nuxt-doc-kit",
  description: "A complete guide to integrating the reader and editor layers.",
  status: "draft",
  seo: {},
  tags: ["nuxt", "docs"],
  // seed initial content here so useDocEditor picks it up on init
  draftBody: INITIAL_CONTENT,
})

// ── Editor state (from the editor layer) ──────────────────────────────────
const editor = useDocEditor({
  doc,

  // onSave — host calls its own API here, kit just tracks state
  onSave: async (content, meta) => {
    console.log("[demo] save called", { chars: content.length, title: meta.title })
    // In a real app: await $fetch(`/api/docs/${doc.value.id}`, { method: "PATCH", body: { ...meta, body: content } })
    await new Promise((r) => setTimeout(r, 600)) // simulate network
  },

  // onPublish — host calls its own publish endpoint
  onPublish: async () => {
    console.log("[demo] publish called")
    await new Promise((r) => setTimeout(r, 600))
    doc.value.status = "published"
  },

  // onAutoSave — called 30s after last keystroke, body-only
  onAutoSave: async (content) => {
    console.log("[demo] autosave", content.length, "chars")
  },

  // onMentionSearch — return items for the @ mention dropdown
  onMentionSearch: async (query) => {
    // In a real app: return await $fetch(`/api/accounts/search?q=${query}`)
    return [
      { id: "u1", label: "alice", description: "Alice Smith", mentionType: "user" },
      { id: "u2", label: "bob", description: "Bob Jones", mentionType: "user" },
    ].filter((u) => u.label.includes(query.toLowerCase()))
  },
})

// ── Toolbar config ─────────────────────────────────────────────────────────
// Image/link/mermaid modals — manage open state here, pass handlers to toolbar
const imageModalOpen = ref(false)
const linkModalOpen = ref(false)
const mermaidModalOpen = ref(false)
let _pendingEditor: any = null

const { customHandlers, editorToolbarItems, suggestionItems, editorBaseClass } = useEditorToolbar({
  openImageModal: (e) => { _pendingEditor = e; imageModalOpen.value = true },
  openLinkModal: (e) => { _pendingEditor = e; linkModalOpen.value = true },
  openMermaidModal: (e) => { _pendingEditor = e; mermaidModalOpen.value = true },
})

provide("editorHandlers", computed(() => customHandlers))

// ── Active editor ref (visual editor exposes it up) ────────────────────────
const activeEditor = ref<any>(null)

// ── Global keyboard shortcuts ──────────────────────────────────────────────
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
        icon="i-lucide-save"
        label="Save"
        size="xs"
        color="primary"
        :variant="editor.hasUnsavedChanges.value ? 'solid' : 'soft'"
        :loading="editor.saving.value"
        :disabled="!editor.hasUnsavedChanges.value"
        @click="editor.save"
      />
      <UButton
        icon="i-lucide-globe"
        label="Publish"
        size="xs"
        color="success"
        variant="solid"
        :loading="editor.publishing.value"
        :disabled="editor.hasUnsavedChanges.value || editor.publishing.value"
        @click="editor.publish"
      />
    </header>

    <!-- Editor body -->
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <!-- Toolbar (visual mode) -->
      <div v-if="editor.editorMode.value === 'visual'" class="border-default bg-default/60 flex shrink-0 items-center border-b backdrop-blur-sm">
        <UEditorToolbar
          v-if="activeEditor"
          :editor="activeEditor"
          :items="editorToolbarItems"
          :handlers="customHandlers"
          class="flex-1 overflow-x-auto px-4 py-2"
        />
        <div v-else class="flex-1 px-4 py-2"><div class="bg-muted h-7 w-48 animate-pulse rounded" /></div>
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
          <UIcon name="i-lucide-code" class="size-3" />Markdown Source
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
      <div class="flex flex-1" :class="editor.editorMode.value === 'visual' ? 'overflow-y-auto' : 'min-h-0 overflow-hidden'">
        <!-- Visual editor -->
        <UEditor
          v-if="editor.editorMode.value === 'visual'"
          v-slot="{ editor: tiptap }"
          v-model="editor.content.value"
          content-type="markdown"
          :starter-kit="{ codeBlock: false }"
          :handlers="customHandlers"
          :ui="{ base: editorBaseClass }"
          class="flex flex-1 flex-col"
          :class="editor.showPreview.value ? 'w-1/2' : 'w-full'"
          @keydown.ctrl.s.prevent="editor.save"
          @keydown.meta.s.prevent="editor.save"
          @vue:mounted="(e: any) => { activeEditor = tiptap }"
        >
          <UEditorSuggestionMenu :editor="tiptap" :items="suggestionItems" />
        </UEditor>

        <!-- Source editor — simple textarea fallback for demo -->
        <textarea
          v-else
          v-model="editor.content.value"
          class="bg-default text-foreground min-h-0 w-full flex-1 resize-none p-8 font-mono text-sm outline-none"
          placeholder="Write Markdown here…"
          spellcheck="false"
        />

        <!-- Preview pane -->
        <div v-if="editor.showPreview.value" class="border-default relative w-1/2 overflow-y-auto border-l">
          <article class="doc-content mx-auto max-w-3xl p-8">
            <DocReader
              v-if="editor.previewAst.value"
              :page="{ body: editor.previewAst.value, rawBody: editor.content.value }"
            />
            <p v-else-if="!editor.previewParsing.value" class="text-muted text-sm italic">Nothing to preview yet.</p>
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
        <UIcon name="i-lucide-eye" class="size-3" />View reader demo
      </NuxtLink>
    </div>
  </div>
</template>
