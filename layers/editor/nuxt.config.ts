// nuxt-docs-kit — editor layer
// Provides: useDocEditor, useEditorToolbar
//
// Peer dependencies: @nuxt/ui, @vueuse/nuxt, comark

export default defineNuxtConfig({
  modules: ["@vueuse/nuxt"],
  components: [{ path: "./components", prefix: "" }],
})
