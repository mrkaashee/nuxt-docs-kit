<script setup lang="ts">
/**
 * DocPreviewBanner — shown at the top of a draft preview page.
 *
 * Props:
 *   docTitle       — title of the doc being previewed
 *   ownerUsername  — author's username (for the "view published" link)
 *   docSlug        — doc slug (for the "view published" link)
 *   publishedPath  — override the full path to the published doc
 *                    (defaults to /@ownerUsername/d/docSlug)
 */
const props = defineProps<{
  docTitle: string
  ownerUsername: string
  docSlug: string
  publishedPath?: string
}>()

const path = computed(() => props.publishedPath ?? `/@${props.ownerUsername}/d/${props.docSlug}`)
</script>

<template>
  <div class="border-warning/30 bg-warning/8 border-b px-4 py-3">
    <div class="mx-auto flex max-w-4xl items-center justify-between gap-4">
      <div class="flex items-center gap-2.5">
        <UIcon name="i-lucide-eye" class="text-warning h-4 w-4 shrink-0" />
        <div>
          <span class="text-warning text-sm font-semibold">Draft Preview</span>
          <span class="text-muted mx-2 text-sm">·</span>
          <span class="text-muted text-sm">
            This is an unpublished preview of
            <strong class="text-default">{{ docTitle }}</strong>.
            Content may change before publication.
          </span>
        </div>
      </div>
      <UButton
        :to="path"
        label="View published"
        color="warning"
        variant="soft"
        size="xs"
        trailing-icon="i-lucide-arrow-right"
      />
    </div>
  </div>
</template>
