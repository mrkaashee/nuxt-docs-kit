<script lang="ts" setup>
/**
 * DocPageTocSidebar — right sidebar for doc reader pages.
 *
 * Shows:
 *  - UContentToc with highlighted active link (when headings exist)
 *  - Save / My saves / More by author actions (non-owners, logged in)
 *  - Falls back to plain action list when no headings
 *
 * The host app is responsible for passing the correct auth state via props.
 * This component does NOT call useUserSession() directly.
 */

const props = defineProps<{
  tocLinks: any[]
  basePath: string
  username: string
  docSlug: string
  /** Logged-in user's own username — for /saves link */
  loggedInUsername?: string
  editPath?: string
  isOwner?: boolean
  loggedIn?: boolean
  isSaved?: boolean
}>()

const emit = defineEmits<{ save: [] }>()

const libraryPath = computed(() =>
  props.loggedInUsername ? `/@${props.loggedInUsername}/saves` : `/@${props.username}/saves`,
)
</script>

<template>
  <!-- With TOC headings -->
  <UContentToc
    v-if="tocLinks.length"
    title="On this page"
    highlight
    highlight-color="primary"
    highlight-variant="circuit"
    :links="tocLinks"
  >
    <template #bottom>
      <USeparator type="dashed" class="my-3" />
      <div class="space-y-0.5">
        <UButton
          v-if="loggedIn && !isOwner"
          :icon="isSaved ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark'"
          :label="isSaved ? 'Saved' : 'Save'"
          :color="isSaved ? 'warning' : 'neutral'"
          variant="ghost"
          size="xs"
          class="w-full justify-start"
          @click="emit('save')"
        />
        <UButton
          v-if="loggedIn && !isOwner"
          icon="i-lucide-folder-bookmark"
          label="My saves"
          color="neutral"
          variant="ghost"
          size="xs"
          class="w-full justify-start"
          :to="libraryPath"
        />
        <UButton
          v-if="!isOwner"
          icon="i-lucide-library"
          :label="`More by @${username}`"
          color="neutral"
          variant="ghost"
          size="xs"
          class="w-full justify-start"
          :to="`/@${username}/docs`"
        />
      </div>
    </template>
  </UContentToc>

  <!-- No headings — minimal actions only -->
  <div v-else class="space-y-1 pt-4">
    <p class="text-muted mb-3 px-2 text-xs font-semibold uppercase tracking-widest">Actions</p>
    <UButton
      v-if="loggedIn && !isOwner"
      :icon="isSaved ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark'"
      :label="isSaved ? 'Saved' : 'Save'"
      :color="isSaved ? 'warning' : 'neutral'"
      variant="ghost"
      size="xs"
      class="w-full justify-start"
      @click="emit('save')"
    />
    <UButton
      v-if="loggedIn && !isOwner"
      icon="i-lucide-folder-bookmark"
      label="My saves"
      color="neutral"
      variant="ghost"
      size="xs"
      class="w-full justify-start"
      :to="libraryPath"
    />
    <UButton
      v-if="!isOwner"
      icon="i-lucide-library"
      :label="`More by @${username}`"
      color="neutral"
      variant="ghost"
      size="xs"
      class="w-full justify-start"
      :to="`/@${username}/docs`"
    />
  </div>
</template>
