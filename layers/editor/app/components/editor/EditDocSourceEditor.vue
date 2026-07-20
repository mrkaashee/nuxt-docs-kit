<script lang="ts" setup>
/**
 * EditDocSourceEditor
 *
 * Raw Markdown source editing panel (CodeMirror).
 * Shown when the user switches to "source" mode.
 * The toolbar is rendered by the parent page (shared full-width bar).
 */
defineProps<{
  modelValue: string
  language?: string | null
}>()

const emit = defineEmits<{
  "update:modelValue": [value: string]
  save: []
  "latex-pasted": [original: string]
}>()
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
    <ClientOnly>
      <EditorCodeMirrorEditor
        :model-value="modelValue"
        :language="language"
        class="min-h-0 flex-1"
        @update:model-value="emit('update:modelValue', $event)"
        @save="emit('save')"
        @latex-pasted="emit('latex-pasted', $event)"
      />
    </ClientOnly>
  </div>
</template>
