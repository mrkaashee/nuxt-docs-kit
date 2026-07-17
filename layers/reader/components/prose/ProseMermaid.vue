<script setup lang="ts">
import { Mermaid as ComarkMermaid } from "@comark/vue/plugins/mermaid"
import { useClipboard } from "@vueuse/core"

const { copy, copied } = useClipboard()

const props = defineProps<{ content: string; __node?: any }>()
</script>

<template>
  <div class="group relative my-5">
    <UButton :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'" color="neutral" variant="outline" size="sm" class="absolute top-[11px] right-[11px] lg:opacity-0 lg:group-hover:opacity-100 transition" tabindex="-1" @click="copy(props.content ?? '')" />
    <div class="border-muted bg-muted overflow-x-auto rounded-md border px-4 py-3 whitespace-pre-wrap font-mono text-sm/6 flex justify-center">
      <ComarkMermaid :content="content" :__node="__node" />
    </div>
  </div>
</template>
