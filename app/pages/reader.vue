<script lang="ts" setup>
useSeoMeta({ title: "Reader — nuxt-doc-kit demo" })

const rawBody = `# Getting Started with nuxt-doc-kit

Welcome to **nuxt-doc-kit** — a Nuxt layer that provides a production-ready doc reader and editor for any Nuxt app.

## Installation

Add the reader layer to your \`nuxt.config.ts\`:

\`\`\`ts
export default defineNuxtConfig({
  extends: ["github:mrkaashee/nuxt-docs-kit/layers/reader"],
  ui: { content: true },
})
\`\`\`

## Reader layer components

All prop-driven, zero API calls:

- \`<DocReader>\` — renders a Comark AST or raw markdown string
- \`<ProseMath>\` — KaTeX math renderer
- \`<ProseMermaid>\` — Mermaid diagram renderer
- \`<ProseMention>\` — @mention chip with hover card

## Composables

- \`useReadingStats(rawText)\` — word count + reading time label
- \`useActiveHeading(tocLinks)\` — IntersectionObserver TOC tracker

## The contract

The layer owns rendering. Your app owns fetching:

\`\`\`ts
const { data } = await useFetch('/api/docs/my-doc?include=body')
const page = computed(() => data.value?.data)
\`\`\`

\`\`\`vue
<DocReader :page="page" />
\`\`\`

## Math example

Inline math: $E = mc^2$

Block math:

$$
\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$
`

const page = computed(() => ({ rawBody }))

const stats = useReadingStats(computed(() => rawBody))
</script>

<template>
  <UMain>
    <UContainer class="py-10">
      <div class="mx-auto max-w-3xl">
        <!-- Header -->
        <div class="mb-2 flex items-center gap-2">
          <NuxtLink to="/" class="text-muted hover:text-primary text-sm transition-colors">nuxt-doc-kit</NuxtLink>
          <UIcon name="i-lucide-chevron-right" class="text-muted/40 size-3" />
          <UBadge label="Reader demo" color="primary" variant="subtle" size="xs" />
        </div>
        <h1 class="mb-1 text-3xl font-black tracking-tight">Getting Started</h1>
        <p class="text-muted mb-6 text-sm">{{ stats.readingTimeLabel }} · {{ stats.words }} words</p>

        <!-- Doc body -->
        <article class="doc-content">
          <DocReader :page="page" />
        </article>
      </div>
    </UContainer>
  </UMain>
</template>
