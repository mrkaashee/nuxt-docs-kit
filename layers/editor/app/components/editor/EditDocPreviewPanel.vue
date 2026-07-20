<script lang="ts" setup>
/**
 * EditDocPreviewPanel
 *
 * Live preview panel rendered alongside the editor.
 * No header bar — the shared toolbar above handles mode switching.
 */
defineProps<{
  ast: any
  parsing: boolean
  rawContent: string
  language?: string | null
  isRtl: boolean
}>()
</script>

<template>
  <div class="border-default relative w-1/2 border-l">
    <article class="doc-content mx-auto max-w-3xl p-8 sm:px-12" :dir="isRtl ? 'rtl' : 'ltr'">
      <DocReader v-if="ast" :page="{ body: ast, rawBody: rawContent }" :language="language" />
      <p v-else-if="!parsing" class="text-muted text-sm italic">Nothing to preview yet.</p>
    </article>
    <!-- Subtle parsing spinner pinned inside the panel -->
    <div v-if="parsing" class="pointer-events-none absolute top-3 right-4">
      <UIcon name="i-lucide-loader-circle" class="text-muted h-4 w-4 animate-spin" />
    </div>
  </div>
</template>
