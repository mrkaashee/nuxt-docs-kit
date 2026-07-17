// nuxt-docs-kit — editor layer
// Provides: useDocEditor, useEditorToolbar
//
// Peer dependencies: @nuxt/ui, @vueuse/nuxt, @comark/nuxt, comark, shiki

export default defineNuxtConfig({
  modules: ["@vueuse/nuxt", "@comark/nuxt"],
  components: [{ path: "./components", prefix: "" }],
})
