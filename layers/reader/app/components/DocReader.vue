<script lang="ts" setup>
import { sanitizeComarkAst } from "#layers/reader/shared/utils/comark"

/**
 * DocReader — renders a parsed Comark AST (or raw markdown) as HTML.
 *
 * Fully prop-driven, zero API calls. Drop into any Nuxt project.
 *
 * Props:
 *   page.body    — parsed Comark AST (optional; renders faster than raw markdown)
 *   page.rawBody — raw markdown string (fallback when no AST)
 *   page.title   — used only for a11y (no visual output)
 *   language     — BCP 47 language tag for dir="rtl" detection
 *
 * Mention hover data:
 *   The host app should provide a resolver via:
 *     provide('resolveMentionHover', async (type, id, label, href) => HoverData | null)
 *   If not provided, mentions still render as links — hover cards show a minimal fallback.
 */
const props = defineProps<{
  page: {
    body?: any
    rawBody?: string
    title?: string
  }
  language?: string
}>()

const rawBody = computed(() => props.page?.rawBody ?? "")

const ast = computed(() => {
  const tree = props.page?.body ?? null
  if (!tree) return null
  if (Array.isArray(tree.nodes)) {
    return { ...tree, nodes: sanitizeComarkAst(tree.nodes) }
  }
  return tree
})

// ── Comark component map ────────────────────────────────────────────────────
// Use defineAsyncComponent for ProseMath/ProseMermaid/ProseMention to avoid
// resolveComponent returning undefined during SSR when layers load order varies.
const comarkComponents = {
  h1: resolveComponent("ProseH1"),
  h2: resolveComponent("ProseH2"),
  h3: resolveComponent("ProseH3"),
  h4: resolveComponent("ProseH4"),
  p: resolveComponent("ProseP"),
  a: resolveComponent("ProseA"),
  strong: resolveComponent("ProseStrong"),
  em: resolveComponent("ProseEm"),
  ul: resolveComponent("ProseUl"),
  ol: resolveComponent("ProseOl"),
  li: resolveComponent("ProseLi"),
  blockquote: resolveComponent("ProseBlockquote"),
  hr: resolveComponent("ProseHr"),
  img: resolveComponent("ProseImg"),
  code: resolveComponent("ProseCode"),
  pre: resolveComponent("ProsePre"),
  math: defineAsyncComponent(() => import("#layers/reader/app/components/prose/ProseMath.vue")),
  mermaid: defineAsyncComponent(() => import("#layers/reader/app/components/prose/ProseMermaid.vue")),
  mention: defineAsyncComponent(() => import("#layers/reader/app/components/prose/ProseMention.vue")),
  "u-button": resolveComponent("UButton"),
  "u-badge": resolveComponent("UBadge"),
  "u-card": resolveComponent("UCard"),
  "u-page-card": resolveComponent("UPageCard"),
  "u-kbd": resolveComponent("UKbd"),
}
</script>

<template>
  <ComarkRenderer v-if="ast" :tree="ast" :components="comarkComponents" />
  <Comark v-else :markdown="rawBody" :components="comarkComponents" />
</template>
