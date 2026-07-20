<script lang="ts" setup>
/**
 * EditDocBar
 *
 * Top action bar for the doc editor. Shows:
 *  - Back button
 *  - Inline title input
 *  - Draft badge
 *  - Focus mode toggle
 *  - Save status indicator
 *  - Save button
 *  - Publish button
 */
const props = defineProps<{
  title: string
  basePath: string
  hasDraft: boolean
  hasUnsavedChanges: boolean
  saving: boolean
  publishing: boolean
  focusMode: boolean
}>()

const emit = defineEmits<{
  "update:title": [value: string]
  save: []
  publish: []
  "toggle-focus-mode": []
}>()
</script>

<template>
  <div
    class="border-default bg-default shrink-0 border-b transition-[opacity,max-height,padding] duration-300 ease-in-out"
    :style="
      focusMode
        ? 'max-height:0;overflow:hidden;opacity:0;border-bottom-width:0;'
        : 'max-height:3rem;opacity:1;'
    "
  >
    <div class="flex items-center gap-2 px-3 py-1.5">
      <!-- Back -->
      <UTooltip text="Back to doc">
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          size="xs"
          class="shrink-0"
          :to="basePath"
        />
      </UTooltip>

      <USeparator orientation="vertical" class="h-4 shrink-0" />

      <!-- Inline title -->
      <input
        :value="title"
        type="text"
        placeholder="Untitled"
        class="text-foreground placeholder:text-muted min-w-0 flex-1 truncate bg-transparent text-sm font-semibold outline-none focus:ring-0"
        @input="emit('update:title', ($event.target as HTMLInputElement).value)"
        @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
      />

      <!-- Draft indicator -->
      <UBadge
        v-if="hasDraft && !hasUnsavedChanges"
        label="Draft"
        color="warning"
        variant="subtle"
        size="xs"
        class="shrink-0"
      />

      <!-- Focus mode toggle -->
      <UTooltip :text="focusMode ? 'Exit focus mode (Esc)' : 'Focus mode (⌘⇧F)'">
        <UButton
          :icon="focusMode ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
          color="neutral"
          variant="ghost"
          size="xs"
          class="shrink-0"
          @click="emit('toggle-focus-mode')"
        />
      </UTooltip>

      <!-- Save state indicator -->
      <Transition
        enter-active-class="transition-all duration-200"
        enter-from-class="opacity-0 scale-95"
        leave-active-class="transition-all duration-150"
        leave-to-class="opacity-0 scale-95"
      >
        <span v-if="saving" class="text-muted shrink-0 text-xs">Saving…</span>
        <span v-else-if="hasUnsavedChanges" class="text-warning shrink-0 text-xs">Unsaved</span>
      </Transition>

      <!-- Save -->
      <UButton
        icon="i-lucide-save"
        label="Save"
        color="primary"
        :variant="hasUnsavedChanges ? 'solid' : 'soft'"
        size="xs"
        :loading="saving"
        :disabled="!hasUnsavedChanges && !saving"
        class="shrink-0 transition-all"
        @click="emit('save')"
      />

      <!-- Publish -->
      <UTooltip
        :text="
          hasUnsavedChanges
            ? 'Save your changes first'
            : hasDraft
              ? 'Publish draft'
              : 'No unpublished changes'
        "
      >
        <UButton
          icon="i-lucide-globe"
          label="Publish"
          color="success"
          variant="solid"
          size="xs"
          :loading="publishing"
          :disabled="hasUnsavedChanges || publishing"
          class="shrink-0 transition-all"
          @click="emit('publish')"
        />
      </UTooltip>
    </div>
  </div>
</template>
