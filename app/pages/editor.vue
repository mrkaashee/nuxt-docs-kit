<script lang="ts" setup>
definePageMeta({ layout: false })

/**
 * editor.vue — nuxt-doc-kit editor layer demo
 *
 * Shows DocEditor with hardcoded content.
 * In a real app: fetch your doc, pass props, handle emits.
 */

const doc = ref({
  id: "doc_demo_1",
  title: "Getting Started with nuxt-doc-kit",
  description: "A complete guide to integrating the reader and editor layers.",
  slug: "getting-started",
  status: "draft",
  language: "en",
  seo: {},
  tags: ["nuxt", "docs"],
})

const rawBody = ref(`# Getting Started

Welcome to **nuxt-doc-kit** — drop-in Nuxt layers for reading and editing markdown documents.

## Installation

\`\`\`ts
export default defineNuxtConfig({
  extends: [
    "github:mrkaashee/nuxt-docs-kit/layers/editor",
    "github:mrkaashee/nuxt-docs-kit/layers/reader",
  ],
  ui: { content: true },
})
\`\`\`

## Usage

\`\`\`vue
<DocEditor
  :doc="doc"
  :raw-body="rawBody"
  :has-draft="false"
  base-path="/my-doc"
  :resolve-mention-search="mySearch"
  @save="handleSave"
  @publish="handlePublish"
/>
\`\`\`

## Math

Inline: $E = mc^2$

Block:
$$
\\frac{d}{dx}\\left(\\int_{a}^{x} f(t)\\,dt\\right) = f(x)
$$
`)

const hasDraft = ref(false)
const basePath = "/editor"

const toast = useToast()

// ── Optional: provide mention search results ──────────────────────────────
async function resolveMentionSearch(query: string) {
  // Demo: return static results filtered by query
  return [
    { id: "u1", label: "alice", description: "Alice Smith", mentionType: "user", href: "/@alice" },
    { id: "u2", label: "bob", description: "Bob Jones", mentionType: "user", href: "/@bob" },
    { id: "d1", label: "Getting Started", description: "Doc", icon: "i-lucide-book-open", mentionType: "doc", href: "/reader" },
  ].filter((r) => r.label.toLowerCase().includes(query.toLowerCase()))
}

// ── Handle save — called by DocEditor via emit:save ───────────────────────
async function handleSave(payload: { content: string; meta: any }) {
  // Simulate save
  await new Promise((r) => setTimeout(r, 400))
  rawBody.value = payload.content
  doc.value.title = payload.meta.title || doc.value.title
  hasDraft.value = true
  toast.add({ title: "Saved", icon: "i-lucide-check-circle", color: "primary" })
}

// ── Handle publish ─────────────────────────────────────────────────────────
async function handlePublish() {
  await new Promise((r) => setTimeout(r, 400))
  doc.value.status = "published"
  hasDraft.value = false
  toast.add({ title: "Published", icon: "i-lucide-globe", color: "success" })
}
</script>

<template>
  <DocEditor
    :doc="doc"
    :raw-body="rawBody"
    :has-draft="hasDraft"
    :base-path="basePath"
    :resolve-mention-search="resolveMentionSearch"
    @save="handleSave"
    @publish="handlePublish"
  />
</template>
