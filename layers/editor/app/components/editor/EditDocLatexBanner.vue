<script lang="ts" setup>
/**
 * EditDocLatexBanner
 *
 * Shown after a LaTeX document is auto-converted on paste.
 * Offers "View original" (modal) and "Undo conversion" actions.
 */
const props = defineProps<{
  original: string
}>()

const emit = defineEmits<{
  undo: []
  dismiss: []
}>()

const modalOpen = ref(false)

const { copy, copied } = useClipboard()
</script>

<template>
  <div
    class="border-warning/30 bg-warning/8 flex shrink-0 items-center gap-2 border-b px-3 py-2 text-xs"
  >
    <UIcon name="i-lucide-info" class="text-warning h-3.5 w-3.5 shrink-0" />
    <span class="text-warning font-medium">LaTeX converted to Markdown</span>
    <span class="text-muted hidden sm:inline"
      >— math formulas and text formatting were preserved</span
    >

    <div class="ml-auto flex items-center gap-1">
      <!-- View original -->
      <UButton
        label="View original"
        icon="i-lucide-file-code"
        color="warning"
        variant="ghost"
        size="xs"
        @click="modalOpen = true"
      />

      <!-- Undo -->
      <UButton
        label="Undo"
        icon="i-lucide-undo-2"
        color="warning"
        variant="ghost"
        size="xs"
        @click="emit('undo')"
      />

      <!-- Dismiss -->
      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        size="xs"
        :padded="false"
        class="h-6 w-6"
        @click="emit('dismiss')"
      />
    </div>
  </div>

  <!-- Original LaTeX modal -->
  <UModal v-model:open="modalOpen" title="Original LaTeX source" :ui="{ body: 'p-0' }">
    <template #body>
      <div class="relative">
        <UButton
          :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
          color="neutral"
          variant="ghost"
          size="xs"
          class="absolute top-2 right-2 z-10"
          @click="copy(props.original)"
        />
        <pre
          class="text-foreground max-h-[60vh] overflow-auto px-4 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap"
          >{{ props.original }}</pre
        >
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          label="Undo conversion"
          icon="i-lucide-undo-2"
          color="warning"
          variant="soft"
          @click="
            () => {
              emit('undo')
              modalOpen = false
            }
          "
        />
        <UButton
          label="Keep converted"
          color="primary"
          @click="
            () => {
              emit('dismiss')
              modalOpen = false
            }
          "
        />
      </div>
    </template>
  </UModal>
</template>
