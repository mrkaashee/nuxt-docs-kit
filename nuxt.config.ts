// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxt/ui", "@nuxthub/core", "@comark/nuxt", "@vueuse/nuxt"],
  ui: { content: true },
  css: ["~/assets/css/main.css"],
  compatibilityDate: "2026-07-13",
  devtools: { enabled: true, timeline: { enabled: true } },
  vite: {
    resolve: {
      dedupe: [
        "@tiptap/core",
        "@tiptap/pm",
        "@tiptap/vue-3",
        "@tiptap/starter-kit",
        "prosemirror-model",
        "prosemirror-state",
        "prosemirror-view",
        "prosemirror-transform",
      ],
    },
  },
  experimental: {
    typedPages: true,
    writeEarlyHints: true,
    defaults: { nuxtLink: { trailingSlash: "remove" } },
    viteEnvironmentApi: true,
    typescriptPlugin: true,
    extractAsyncDataHandlers: true,
  },
})
