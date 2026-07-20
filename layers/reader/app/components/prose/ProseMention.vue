<script setup lang="ts">
/**
 * ProseMention — renders :mention{...} MDC nodes.
 *
 * Hover data is resolved via an injected `resolveMentionHover` function.
 * Projects provide this via:
 *
 *   provide('resolveMentionHover', async (type, id, label, href) => {
 *     // return { name, description, avatar, href } or null
 *   })
 *
 * If not provided, hovering shows a minimal chip with no data card.
 */

export type MentionHoverData = {
  name?: string
  description?: string
  avatar?: string
  href?: string
  /** 'user' | 'doc' */
  type?: string
  [key: string]: any
}

type ResolveMentionHover = (
  type: "user" | "doc",
  id: string,
  label: string,
  href: string,
) => Promise<MentionHoverData | null>

const resolveMentionHover = inject<ResolveMentionHover>("resolveMentionHover", async () => null)

const props = defineProps<{
  type?: "user" | "doc"
  mentionType?: "user" | "doc"
  id: string
  label?: string
  href?: string
  linkStyle?: "mention" | "link" | "code-link" | "button"
  btnColor?: string
  btnVariant?: string
}>()

const isDoc = computed(() => (props.mentionType || props.type) === "doc")
const displayLabel = computed(() => props.label || props.id)
const resolvedHref = computed(() => {
  if (props.href && props.href !== "#") return props.href
  if (!isDoc.value && props.label) return `/@${props.label}`
  return "#"
})
const style = computed(() => props.linkStyle || "mention")

// ── Hover data ─────────────────────────────────────────────────────────────
const hoverData = ref<MentionHoverData | null>(null)
const hoverLoading = ref(false)
const hoverFetched = ref(false)

async function onHover() {
  if (style.value !== "mention") return
  if (hoverFetched.value || hoverLoading.value) return
  hoverLoading.value = true
  try {
    hoverData.value = await resolveMentionHover(
      isDoc.value ? "doc" : "user",
      props.id,
      props.label || props.id,
      resolvedHref.value,
    )
    hoverFetched.value = true
  } catch {
    hoverFetched.value = true
  } finally {
    hoverLoading.value = false
  }
}
</script>

<template>
  <span class="prose-mention-wrapper inline-flex items-center">
    <!-- Button style -->
    <UButton
      v-if="style === 'button'"
      :label="displayLabel"
      :to="resolvedHref"
      :color="btnColor || 'primary'"
      :variant="btnVariant || 'solid'"
      size="sm"
    />

    <!-- Code-link style -->
    <NuxtLink v-else-if="style === 'code-link'" :to="resolvedHref" class="no-underline hover:underline">
      <code class="text-primary bg-muted/60 rounded px-1 py-0.5 text-sm">{{ displayLabel }}</code>
    </NuxtLink>

    <!-- Plain link style -->
    <NuxtLink
      v-else-if="style === 'link'"
      :to="resolvedHref"
      class="text-primary no-underline hover:underline"
    >{{ displayLabel }}</NuxtLink>

    <!-- Mention chip with hover card (default) -->
    <UPopover v-else mode="hover" :open-delay="400" :close-delay="150" @update:open="(v) => v && onHover()">
      <NuxtLink
        :to="resolvedHref"
        class="text-primary inline-flex items-center gap-0.5 rounded px-0.5 font-medium no-underline hover:underline"
      >
        <UIcon v-if="isDoc" name="i-lucide-book-open" class="h-3 w-3 shrink-0 opacity-70" />
        <span>{{ isDoc ? displayLabel : `@${displayLabel}` }}</span>
      </NuxtLink>

      <template #content>
        <div class="bg-default/95 border-default relative w-76 overflow-hidden rounded-xl border p-4 shadow-2xl backdrop-blur-md">
          <!-- Loading skeleton -->
          <div v-if="hoverLoading" class="space-y-3 py-1">
            <div class="flex items-center gap-3">
              <USkeleton class="h-10 w-10 rounded-full" />
              <div class="flex-1 space-y-1.5">
                <USkeleton class="h-4 w-2/3 rounded" />
                <USkeleton class="h-3 w-1/3 rounded" />
              </div>
            </div>
            <div class="space-y-1.5 pt-2">
              <USkeleton class="h-3 w-full rounded" />
              <USkeleton class="h-3 w-4/5 rounded" />
            </div>
          </div>

          <!-- Data card — provided by host via resolveMentionHover -->
          <div v-else-if="hoverData">
            <div class="from-primary/15 via-info/10 to-secondary/15 border-default/30 absolute top-0 right-0 left-0 h-14 border-b bg-gradient-to-r" />
            <div class="relative pt-4">
              <div class="flex items-end gap-3.5">
                <UAvatar
                  :src="hoverData.avatar || undefined"
                  :alt="hoverData.name || displayLabel"
                  size="md"
                  class="ring-default border-default-bg -mt-3 shrink-0 border-2 ring-2 ring-offset-1"
                />
                <div class="min-w-0 flex-1">
                  <p class="text-default truncate text-sm leading-tight font-bold">{{ hoverData.name || displayLabel }}</p>
                  <p v-if="hoverData.description" class="text-muted mt-0.5 truncate text-xs leading-tight">{{ hoverData.description }}</p>
                </div>
              </div>
              <div class="border-default/60 mt-4 border-t pt-3">
                <UButton
                  :to="hoverData.href || resolvedHref"
                  :label="isDoc ? 'Open doc' : 'View profile'"
                  :icon="isDoc ? 'i-lucide-book-open' : 'i-lucide-user'"
                  color="neutral" variant="soft" size="xs"
                  class="w-full justify-center rounded-lg font-semibold"
                />
              </div>
            </div>
          </div>

          <!-- No data / not provided -->
          <div v-else-if="hoverFetched">
            <div class="flex items-center gap-3">
              <UAvatar :alt="displayLabel" size="sm" />
              <p class="text-default truncate text-sm font-semibold">
                {{ isDoc ? displayLabel : `@${displayLabel}` }}
              </p>
            </div>
            <div class="border-default/60 mt-3 border-t pt-3">
              <UButton :to="resolvedHref" label="Open" color="neutral" variant="soft" size="xs" class="w-full justify-center" />
            </div>
          </div>
        </div>
      </template>
    </UPopover>
  </span>
</template>
