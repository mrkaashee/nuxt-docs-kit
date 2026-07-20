<script setup lang="ts">
import { Mermaid as ComarkMermaid } from "@comark/vue/plugins/mermaid"
import { useClipboard } from "@vueuse/core"
import { useAppConfig } from "#imports"

const { copy, copied } = useClipboard()
const appConfig = useAppConfig()

defineProps<{
  content: string
  __node?: any
}>()
</script>

<template>
  <div class="group relative my-5">
    <UButton
      :icon="copied ? appConfig.ui.icons.copyCheck : appConfig.ui.icons.copy"
      color="neutral" variant="outline" size="sm"
      class="absolute top-[11px] right-[11px] lg:opacity-0 lg:group-hover:opacity-100 transition"
      tabindex="-1"
      @click="copy(content ?? '')"
    />
    <div class="group font-mono text-sm/6 border border-muted bg-muted rounded-md px-4 py-3 whitespace-pre-wrap wrap-break-word overflow-x-auto focus:outline-none flex justify-center">
      <ComarkMermaid :content="content" :__node="__node" />
    </div>
  </div>
</template>
