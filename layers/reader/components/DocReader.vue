<script lang="ts" setup>
import { sanitizeComarkAst } from "../shared/utils/docs"

/**
 * DocReader — renders a doc body using ComarkRenderer (preferred) or Comark fallback.
 *
 * Props:
 *   page.body    — parsed Comark AST (from server)
 *   page.rawBody — raw markdown string (fallback / editor autosave)
 *   page.title   — doc title (used by some prose components)
 *   language     — ISO language code (e.g. "ar", "ur" → RTL)
 *
 * Peer deps: comark, @comark/vue, @nuxt/ui (prose components)
 */

const props = defineProps<{
  page: { body?: any; rawBody?: string; title?: string }
  language?: string
}>()

const body = computed(() => props.page?.rawBody ?? "")

// Sanitize AST — strips attribute names containing "=" or spaces which crash
// Vue's vdom setAttribute call on the client side.
const ast = computed(() => {
  const tree = props.page?.body ?? null
  if (!tree) return null
  if (Array.isArray(tree.nodes)) return { ...tree, nodes: sanitizeComarkAst(tree.nodes) }
  return tree
})

/**
 * Component map passed to ComarkRenderer / Comark.
 *
 * Prose components (h1-h4, p, a, ul, ol, li, blockquote, hr, img, code, pre)
 * are resolved from the host app's global component registry — they must be
 * registered by the host (standard with @nuxt/ui content:true).
 *
 * math and mermaid use async imports from nuxt-docs-kit's own prose components.
 */
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
  math: defineAsyncComponent(() => import("./prose/ProseMath.vue")),
  mermaid: defineAsyncComponent(() => import("./prose/ProseMermaid.vue")),
  mention: defineAsyncComponent(() => import("./prose/ProseMention.vue")),
  "u-button": resolveComponent("UButton"),
  "u-badge": resolveComponent("UBadge"),
  "u-card": resolveComponent("UCard"),
  "u-page-card": resolveComponent("UPageCard"),
  "u-kbd": resolveComponent("UKbd"),
}
</script>

<template>
  <ComarkRenderer v-if="ast" :tree="ast" :components="comarkComponents" />
  <Comark v-else :markdown="body" :components="comarkComponents" />
</template>
