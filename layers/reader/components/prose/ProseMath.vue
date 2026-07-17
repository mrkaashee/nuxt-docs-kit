<script setup lang="ts">
import { useClipboard } from "@vueuse/core"
import katex from "katex"

const { copy, copied } = useClipboard()

onMounted(() => { import("katex/dist/katex.min.css").catch(() => {}) })

const props = defineProps<{ content: string; class?: string; __node?: any }>()

const isInline = computed(() => props.class?.includes("inline"))
const containerRef = ref<HTMLElement | null>(null)

function renderToEl(el: HTMLElement | null, src: string) {
  if (!el) return
  if (!src?.trim()) { el.innerHTML = ""; return }
  try {
    el.innerHTML = katex.renderToString(src, { displayMode: !isInline.value, throwOnError: false, strict: false, output: "html" })
  } catch { el.textContent = src }
}

watch([containerRef, () => props.content, isInline], () => nextTick(() => renderToEl(containerRef.value, props.content)), { immediate: true })
</script>

<template>
  <div v-if="!isInline" class="group relative my-5">
    <UButton :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'" color="neutral" variant="outline" size="sm" class="absolute top-[11px] right-[11px] opacity-0 transition group-hover:opacity-100" tabindex="-1" @click="copy(props.content ?? '')" />
    <div class="border-muted bg-muted overflow-x-auto rounded-md border px-4 py-3 font-mono text-sm/6">
      <div ref="containerRef" class="[&_.katex-display]:my-0" />
    </div>
  </div>
  <span v-else ref="containerRef" class="math inline" />
</template>
