<script lang="ts" setup>
import { useClipboard } from "@vueuse/core"
/**
 * DocQuickActions — share popover with UTM-tagged platform links.
 *
 * Props:
 *   docUrl   — full canonical URL of the doc (host builds this)
 *   docTitle — used in toast messages
 */
const props = defineProps<{
  docUrl: string
  docTitle?: string
}>()

const toast = useToast()
const { copy, copied } = useClipboard()
const shareOpen = ref(false)

function utmUrl(platform: string) {
  const url = new URL(props.docUrl)
  url.searchParams.set("utm_source", platform)
  url.searchParams.set("utm_medium", "social")
  url.searchParams.set("utm_campaign", "share")
  return url.toString()
}

const platforms = [
  { name: "X / Twitter", icon: "i-simple-icons-x", source: "twitter" },
  { name: "WhatsApp", icon: "i-simple-icons-whatsapp", source: "whatsapp" },
  { name: "LinkedIn", icon: "i-simple-icons-linkedin", source: "linkedin" },
  { name: "Telegram", icon: "i-simple-icons-telegram", source: "telegram" },
  { name: "Facebook", icon: "i-simple-icons-facebook", source: "facebook" },
  { name: "Reddit", icon: "i-simple-icons-reddit", source: "reddit" },
]

const copiedSource = ref<string | null>(null)

async function copyForPlatform(source: string) {
  try {
    await copy(utmUrl(source))
    copiedSource.value = source
    toast.add({ title: `Link copied for ${source}`, icon: "i-lucide-check", color: "success" })
    setTimeout(() => {
      copiedSource.value = null
    }, 2000)
  } catch {
    toast.add({ title: "Failed to copy", color: "error" })
  }
}

async function copyLink() {
  try {
    await copy(props.docUrl)
    toast.add({ title: "Link copied", icon: "i-lucide-check", color: "success" })
  } catch {
    toast.add({ title: "Failed to copy", color: "error" })
  }
}
</script>

<template>
  <UPopover v-model:open="shareOpen" :ui="{ content: 'w-72 p-3' }">
    <UButton icon="i-lucide-share-2" label="Share" size="sm" color="neutral" variant="outline" />
    <template #content>
      <p class="text-muted mb-2 px-1 text-xs font-medium tracking-wide uppercase">Copy link for</p>
      <div class="grid grid-cols-2 gap-1.5">
        <UButton
          v-for="platform in platforms"
          :key="platform.source"
          :icon="copiedSource === platform.source ? 'i-lucide-check' : platform.icon"
          :label="platform.name"
          :color="copiedSource === platform.source ? 'success' : 'neutral'"
          variant="ghost"
          size="sm"
          class="justify-start"
          @click="copyForPlatform(platform.source)"
        />
      </div>
      <div class="border-default mt-3 border-t pt-3">
        <UButton
          :icon="copied ? 'i-lucide-check' : 'i-lucide-link'"
          :label="copied ? 'Copied!' : 'Copy plain link'"
          :color="copied ? 'success' : 'neutral'"
          variant="outline"
          size="sm"
          class="w-full"
          @click="copyLink"
        />
      </div>
    </template>
  </UPopover>
</template>
