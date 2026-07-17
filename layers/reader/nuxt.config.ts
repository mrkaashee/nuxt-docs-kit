// nuxt-docs-kit — reader layer
// Provides: DocReader, DocPageTocSidebar, gate components, prose components,
// useReadingStats, useActiveHeading
//
// Peer dependencies: @nuxt/ui, @vueuse/nuxt, @comark/nuxt, katex

export default defineNuxtConfig({
  modules: ["@vueuse/nuxt", "@comark/nuxt"],
  components: [{ path: "./components", prefix: "" }],
})
