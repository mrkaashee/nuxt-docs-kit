<script lang="ts" setup>
/**
 * EditDocImageModal
 *
 * Modal for inserting images into the editor. Two tabs:
 *  - Gallery — browse images already uploaded to this doc
 *  - Upload  — upload a new image and immediately insert it
 *
 * All API calls are injected via props — no hardcoded endpoints.
 * The host app passes:
 *   fetchImages  — async () => DocImage[]
 *   uploadUrl    — URL string for the upload endpoint
 */
export interface DocImage {
  id: string
  url: string
  caption?: string | null
  createdAt?: string | null
}

const props = withDefaults(
  defineProps<{
    open: boolean
    /** Async function that returns the gallery images — provided by the host */
    fetchImages?: () => Promise<DocImage[]>
    /** Upload endpoint URL — provided by the host */
    uploadUrl?: string
  }>(),
  { open: false },
)

const emit = defineEmits<{
  "update:open": [value: boolean]
  insert: [url: string]
}>()

const tab = ref<"gallery" | "upload">("gallery")
const images = ref<DocImage[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

async function loadImages() {
  if (!props.fetchImages) return
  loading.value = true
  error.value = null
  try {
    images.value = await props.fetchImages()
  } catch (err: any) {
    error.value = err?.data?.message ?? err?.message ?? "Failed to load images"
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  (val) => {
    if (val) { tab.value = "gallery"; loadImages() }
  },
)

function onSelect(url: string) {
  emit("insert", url)
  emit("update:open", false)
}

function onUploaded(img: DocImage) {
  emit("insert", img.url)
  images.value.unshift(img)
}
</script>

<template>
  <UModal :open="open" title="Insert Image" :ui="{ width: 'max-w-2xl' }" @update:open="emit('update:open', $event)">
    <template #body>
      <UTabs
        v-model="tab"
        :items="[
          { label: 'Doc Gallery', value: 'gallery', slot: 'gallery' },
          { label: 'Upload New', value: 'upload', slot: 'upload' },
        ]"
      >
        <template #gallery>
          <div class="pt-4">
            <DocGalleryImageGrid
              :images="images"
              :loading="loading"
              :error="error"
              empty-label="No images in this doc's gallery yet."
              @select="onSelect($event.url)"
              @retry="loadImages"
            >
              <UButton label="Upload New" icon="i-lucide-upload" color="primary" variant="soft" size="sm" @click="tab = 'upload'" />
            </DocGalleryImageGrid>
          </div>
        </template>
        <template #upload>
          <div class="pt-4">
            <ClientOnly>
              <DocGalleryUpload v-if="uploadUrl" :upload-url="uploadUrl" @uploaded="onUploaded" />
              <p v-else class="text-muted text-sm">No upload URL configured.</p>
            </ClientOnly>
          </div>
        </template>
      </UTabs>
    </template>
  </UModal>
</template>
