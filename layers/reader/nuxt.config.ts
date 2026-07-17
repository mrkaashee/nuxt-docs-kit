// nuxt-docs-kit — reader layer
// Provides: DocReader, DocPageTocSidebar, gate components, prose components,
// useReadingStats, useActiveHeading
//
// Peer dependencies: @nuxt/ui, @vueuse/nuxt, comark, @comark/vue, katex

export default defineNuxtConfig({
  modules: ["@vueuse/nuxt"],
  components: [{ path: "./components", prefix: "" }],
})
