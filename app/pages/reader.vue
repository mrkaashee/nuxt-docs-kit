<script lang="ts" setup>
useSeoMeta({ title: "Reader — nuxt-doc-kit demo" })

// ── Hardcoded demo doc ─────────────────────────────────────────────────────
// In a real app the host fetches this from its own API and passes it in.
const doc = ref({
  id: "doc_demo_1",
  title: "Getting Started with nuxt-doc-kit",
  description: "A complete guide to integrating the reader and editor layers into your Nuxt app.",
  ownerUsername: "demo",
  ownerAvatar: null,
  status: "published",
  publishedAt: "2026-07-13T00:00:00Z",
  tags: ["nuxt", "docs", "guide"],
  visibility: "public",
  viewCount: 1240,
  totalReviews: 3,
  averageRating: 4.7,
  coverImage: null,
})

const rawBody = `# Getting Started

Welcome to **nuxt-doc-kit** — a Nuxt layer that provides a production-ready doc reader and editor for any Nuxt app.

## Installation

Add the reader layer to your \`nuxt.config.ts\`:

\`\`\`ts
export default defineNuxtConfig({
  extends: ["nuxt-doc-kit/layers/reader"],
})
\`\`\`

## Reader layer components

The reader layer exports the following components — all prop-driven, no API calls:

- \`<DocReader>\` — renders a Comark AST or markdown string
- \`<DocPageTocSidebar>\` — TOC + save/actions sidebar
- \`<DocPreviewBanner>\` — draft preview banner
- \`<DocFollowersGate>\` — followers-only access gate
- \`<DocRequestAccessGate>\` — private doc access request gate
- \`<DocQuickActions>\` — share popover with UTM links

## Composables

- \`useReadingStats(rawText)\` — word count + reading time
- \`useActiveHeading(tocLinks)\` — IntersectionObserver TOC tracker

## The contract

The kit owns rendering. Your app owns fetching:

\`\`\`ts
// Your page — you fetch, you pass in:
const { data } = await useFetch('/api/docs/my-doc?include=body')
const doc = computed(() => data.value?.data?.doc)
const body = computed(() => data.value?.data?.body)
\`\`\`

Then pass directly to the components:

\`\`\`vue
<DocReader :page="{ body, rawBody, title: doc.title }" />
\`\`\`
`

// Build a minimal AST from rawBody for the reader demo
// (in production the server returns the parsed AST — here we pass rawBody for Comark fallback)
const page = computed(() => ({ rawBody, title: doc.value.title }))

// TOC built from the headings in rawBody
const tocLinks = [
  { id: "installation", label: "Installation", depth: 2 },
  { id: "reader-layer-components", label: "Reader layer components", depth: 2 },
  { id: "composables", label: "Composables", depth: 2 },
  { id: "the-contract", label: "The contract", depth: 2 },
]

const activeId = useActiveHeading(computed(() => tocLinks))

// Reading stats
const stats = useReadingStats(computed(() => rawBody))

// Save state — in a real app the host calls its API here
const isSaved = ref(false)
function handleSave() { isSaved.value = !isSaved.value }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })
}
</script>

<template>
  <UPage>
    <UPageHeader>
      <template #headline>
        <div class="flex items-center gap-2">
          <NuxtLink to="/" class="text-muted hover:text-primary text-sm transition-colors">nuxt-doc-kit</NuxtLink>
          <UIcon name="i-lucide-chevron-right" class="text-muted/40 size-3" />
          <UBadge label="Demo" color="neutral" variant="subtle" size="xs" class="rounded-full" />
        </div>
      </template>
      <template #title>{{ doc.title }}</template>
      <template #description>{{ doc.description }}</template>
      <template #links>
        <DocQuickActions :doc-url="`http://localhost:3000/reader`" :doc-title="doc.title" />
      </template>
    </UPageHeader>

    <UPageBody>
      <!-- Author + meta card -->
      <UCard variant="subtle" :ui="{ body: 'flex flex-wrap items-center justify-between gap-4' }">
        <UUser
          name="demo"
          description="Author"
          :avatar="{ src: undefined, alt: 'demo' }"
          size="lg"
        />
        <div class="text-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <div class="flex items-center gap-1.5">
            <UIcon name="i-lucide-calendar" class="size-3.5" />
            <span>{{ formatDate(doc.publishedAt) }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <UIcon name="i-lucide-clock" class="size-3.5" />
            <span>{{ stats.readingTimeLabel }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <UIcon name="i-lucide-eye" class="size-3.5" />
            <span>{{ doc.viewCount.toLocaleString() }} views</span>
          </div>
        </div>
      </UCard>

      <!-- Doc body -->
      <article class="doc-content">
        <DocReader :page="page" />
      </article>

      <!-- Tags -->
      <div class="border-default mt-8 flex flex-wrap items-center gap-2 border-t pt-6">
        <UBadge v-for="tag in doc.tags" :key="tag" :label="`#${tag}`" color="neutral" variant="soft" />
      </div>
    </UPageBody>

    <!-- Right sidebar — DocPageTocSidebar from the reader layer -->
    <template #right>
      <DocPageTocSidebar
        :toc-links="tocLinks"
        base-path="/reader"
        username="demo"
        doc-slug="getting-started"
        :logged-in="false"
        :is-owner="false"
        :is-saved="isSaved"
        @save="handleSave"
      />
    </template>
  </UPage>
</template>
