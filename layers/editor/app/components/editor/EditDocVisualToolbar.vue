<script lang="ts" setup>
/**
 * EditDocVisualToolbar
 *
 * Full-width toolbar bar shared between the visual editor and the preview pane.
 * Sits above both panes so the layout is symmetrical when preview is open.
 */
import type { EditorCustomHandlers, EditorToolbarItem } from "@nuxt/ui"
import type { Editor } from "@tiptap/vue-3"

const props = defineProps<{
  editor: Editor | null
  toolbarItems: EditorToolbarItem[][]
  handlers: EditorCustomHandlers
  showPreview: boolean
}>()

const emit = defineEmits<{
  "toggle-preview": []
  "toggle-source": []
}>()
</script>

<template>
  <div class="border-default bg-default/60 flex shrink-0 items-center border-b backdrop-blur-sm">
    <!-- UEditorToolbar needs a live editor instance -->
    <UEditorToolbar
      v-if="editor"
      :editor="editor"
      :items="toolbarItems"
      :handlers="handlers"
      class="flex-1 overflow-x-auto px-4 py-2"
    />
    <!-- Skeleton spacer while editor mounts -->
    <div v-else class="flex-1 px-4 py-2">
      <div class="bg-muted h-7 w-48 animate-pulse rounded" />
    </div>

    <!-- Right-side mode controls -->
    <div class="border-default flex shrink-0 items-center gap-1 border-l px-2 py-2">
      <UTooltip text="Switch to Markdown source">
        <UButton
          icon="i-lucide-code"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="emit('toggle-source')"
        />
      </UTooltip>
      <UButton
        :icon="showPreview ? 'i-lucide-panel-right-close' : 'i-lucide-panel-right-open'"
        :label="showPreview ? 'Close preview' : 'Preview'"
        color="neutral"
        variant="ghost"
        size="xs"
        @click="emit('toggle-preview')"
      />
    </div>
  </div>
</template>
