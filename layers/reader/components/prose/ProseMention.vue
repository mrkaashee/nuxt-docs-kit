<script setup lang="ts">
/**
 * ProseMention — renders :mention{...} nodes in doc content.
 *
 * linkStyle controls display:
 *   mention   → hover-card chip (default)
 *   link      → plain link
 *   code-link → inline code link
 *   button    → UButton
 *
 * Hover data is fetched lazily from /api/users/:username and /api/docs/:slug.
 * The host app must expose these endpoints.
 */
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
const resolvedHref = computed(() => { if (props.href && props.href !== "#") return props.href; if (!isDoc.value && props.label) return `/@${props.label}`; return "#" })
const style = computed(() => props.linkStyle || "mention")

const hoverData = ref<any>(null)
const hoverLoading = ref(false)
const hoverFetched = ref(false)

async function onHover() {
  if (style.value !== "mention") return
  if (hoverFetched.value || hoverLoading.value) return
  hoverLoading.value = true
  try {
    if (!isDoc.value) {
      const res = await $fetch<any>(`/api/users/${encodeURIComponent(props.label || props.id)}`)
      hoverData.value = (res as any)?.data ?? res
    } else {
      const match = resolvedHref.value.match(/^\/@([^/]+)\/d\/([^/?#]+)/)
      if (match) {
        const res = await $fetch<any>(`/api/docs/${match[2]}?owner=${match[1]}`)
        hoverData.value = (res as any)?.data ?? res
      }
    }
    hoverFetched.value = true
  } catch { hoverFetched.value = true } finally { hoverLoading.value = false }
}
</script>

<template>
  <span class="inline-flex items-center">
    <UButton v-if="style === 'button'" :label="displayLabel" :to="resolvedHref" :color="btnColor || 'primary'" :variant="btnVariant || 'solid'" size="sm" />
    <NuxtLink v-else-if="style === 'code-link'" :to="resolvedHref" class="no-underline hover:underline"><code class="text-primary bg-muted/60 rounded px-1 py-0.5 text-sm">{{ displayLabel }}</code></NuxtLink>
    <NuxtLink v-else-if="style === 'link'" :to="resolvedHref" class="text-primary no-underline hover:underline">{{ displayLabel }}</NuxtLink>
    <UPopover v-else mode="hover" :open-delay="400" :close-delay="150" @update:open="(v) => v && onHover()">
      <NuxtLink :to="resolvedHref" class="text-primary inline-flex items-center gap-0.5 rounded px-0.5 font-medium no-underline hover:underline">
        <UIcon v-if="isDoc" name="i-lucide-book-open" class="h-3 w-3 shrink-0 opacity-70" />
        <span>{{ isDoc ? displayLabel : `@${displayLabel}` }}</span>
      </NuxtLink>
      <template #content>
        <div class="bg-default/95 border-default relative w-72 overflow-hidden rounded-xl border p-4 shadow-2xl backdrop-blur-md">
          <div v-if="hoverLoading" class="space-y-3 py-1">
            <div class="flex items-center gap-3"><USkeleton class="h-10 w-10 rounded-full" /><div class="flex-1 space-y-1.5"><USkeleton class="h-4 w-2/3 rounded" /><USkeleton class="h-3 w-1/3 rounded" /></div></div>
            <div class="space-y-1.5 pt-2"><USkeleton class="h-3 w-full rounded" /><USkeleton class="h-3 w-4/5 rounded" /></div>
            <div class="pt-2"><USkeleton class="h-7 w-full rounded-lg" /></div>
          </div>
          <template v-else-if="hoverData">
            <div v-if="!isDoc">
              <div class="from-primary/15 via-info/10 to-secondary/15 border-default/30 absolute top-0 right-0 left-0 h-14 border-b bg-gradient-to-r" />
              <div class="relative pt-4">
                <div class="flex items-end gap-3.5"><UAvatar :src="hoverData.avatar || undefined" :alt="hoverData.username" size="md" /><div class="min-w-0 flex-1"><p class="text-default truncate text-sm font-bold leading-tight">{{ hoverData.name || hoverData.username }}</p><p class="text-muted mt-0.5 truncate font-mono text-xs">@{{ hoverData.username }}</p></div></div>
                <p v-if="hoverData?.bio" class="text-muted mt-3 line-clamp-2 text-xs leading-relaxed">{{ hoverData.bio }}</p>
                <div class="border-default/60 mt-4 border-t pt-3"><UButton :to="resolvedHref" label="View profile" color="neutral" variant="soft" size="xs" icon="i-lucide-user" class="w-full justify-center" /></div>
              </div>
            </div>
            <div v-else>
              <div class="from-primary/15 via-success/10 to-info/15 border-default/30 absolute top-0 right-0 left-0 h-14 border-b bg-gradient-to-r" />
              <div class="relative pt-4">
                <div class="mb-3.5 flex items-start gap-3">
                  <div class="bg-primary/10 border-primary/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"><UIcon name="i-lucide-book-open" class="text-primary h-5 w-5" /></div>
                  <div class="min-w-0 flex-1"><p class="text-default truncate text-sm font-bold leading-snug">{{ hoverData?.title || displayLabel }}</p><p v-if="hoverData?.description" class="text-muted mt-1 line-clamp-2 text-xs">{{ hoverData.description }}</p></div>
                </div>
                <div class="border-default/60 mt-4 flex gap-2 border-t pt-3">
                  <UButton :to="resolvedHref" label="Open doc" color="primary" variant="solid" size="xs" icon="i-lucide-book-open" class="flex-1 justify-center" />
                  <UButton v-if="hoverData?.ownerUsername" :to="`/@${hoverData.ownerUsername}`" label="Profile" color="neutral" variant="soft" size="xs" icon="i-lucide-user" class="flex-1 justify-center" />
                </div>
              </div>
            </div>
          </template>
        </div>
      </template>
    </UPopover>
  </span>
</template>
