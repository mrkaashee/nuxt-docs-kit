<script lang="ts" setup>
/**
 * EditDocStatusBar
 *
 * Bottom status bar for the doc editor. Shows word count, reading time, and
 * focus-mode controls. Fades when focus mode is active; opaque on hover.
 */
defineProps<{
  wordCount: number
  readingTime: number
  focusMode: boolean
}>()

const emit = defineEmits<{
  "toggle-focus-mode": []
}>()
</script>

<template>
  <div
    class="border-default bg-muted/20 flex shrink-0 items-center justify-between border-t px-4 py-1 transition-opacity duration-200"
    :style="focusMode ? 'opacity:0.4;' : 'opacity:1;'"
    @mouseenter="
      focusMode && ($event.currentTarget as HTMLElement).style.setProperty('opacity', '1')
    "
    @mouseleave="
      focusMode && ($event.currentTarget as HTMLElement).style.setProperty('opacity', '0.4')
    "
  >
    <span class="text-muted flex items-center gap-3 text-xs tabular-nums">
      <span>{{ wordCount.toLocaleString() }} {{ wordCount === 1 ? "word" : "words" }}</span>
      <span class="text-muted/50">·</span>
      <span>{{ readingTime }} min read</span>
    </span>

    <!-- Focus mode exit controls -->
    <div v-if="focusMode" class="flex items-center gap-2">
      <span class="text-muted text-xs">Focus mode — press Esc to exit</span>
      <UButton
        icon="i-lucide-minimize-2"
        color="neutral"
        variant="ghost"
        size="xs"
        @click="emit('toggle-focus-mode')"
      />
    </div>
  </div>
</template>
