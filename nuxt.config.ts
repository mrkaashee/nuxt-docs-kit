// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: ["./layers/reader", "./layers/editor"],
  modules: ["@nuxt/ui", "@nuxthub/core", "@comark/nuxt"],
  css: ["~/assets/css/main.css"],
  compatibilityDate: "2026-07-13",
  devtools: { enabled: true, timeline: { enabled: true } },
  experimental: {
    typedPages: true,
    writeEarlyHints: true,
    defaults: { nuxtLink: { trailingSlash: "remove" } },
    viteEnvironmentApi: true,
    typescriptPlugin: true,
    extractAsyncDataHandlers: true,
  },
})
