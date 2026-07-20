<script lang="ts" setup>
/**
 * EditDocImageModal
 *
 * Modal for inserting images into the editor.
 * Two tabs:
 *   Gallery — browse images returned by fetchImages()
 *   Upload  — POST a file to uploadUrl and insert the returned URL
 *
 * No Qarpeo-specific imports. All IO injected via props.
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
    fetchImages?: () => Promise<DocImage[]>
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

watch(() => props.open, (val) => {
  if (val) { tab.value = "gallery"; loadImages() }
})

function onSelect(url: string) {
  emit("insert", url)
  emit("update:open", false)
}

// ── Upload tab — simple file input ────────────────────────────────────────
const uploading = ref(false)
const uploadError = ref<string | null>(null)

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !props.uploadUrl) return
  uploading.value = true
  uploadError.value = null
  try {
    const form = new FormData()
    form.append("image", file)
    const res: any = await $fetch(props.uploadUrl, { method: "POST", body: form })
    const image: DocImage = res?.data ?? res
    emit("insert", image.url)
    images.value.unshift(image)
    emit("update:open", false)
  } catch (err: any) {
    uploadError.value = err?.data?.message ?? err?.message ?? "Upload failed"
  } finally {
    uploading.value = false
    ;(e.target as HTMLInputElement).value = ""
  }
}
</script>

<template>
  <UModal :open="open" title="Insert Image" :ui="{ width: 'max-w-2xl' }" @update:open="emit('update:open', $event)">
    <template #body>
      <UTabs
        v-model="tab"
        :items="[
          { label: 'Gallery', value: 'gallery', slot: 'gallery' },
          { label: 'Upload', value: 'upload', slot: 'upload' },
        ]"
      >
        <template #gallery>
          <div class="pt-4">
            <EditorGalleryImageGrid
              :images="images"
              :loading="loading"
              :error="error"
              empty-label="No images yet. Upload one first."
              @select="onSelect($event.url)"
              @retry="loadImages"
            >
              <UButton label="Upload" icon="i-lucide-upload" color="primary" variant="soft" size="sm" @click="tab = 'upload'" />
            </EditorGalleryImageGrid>
          </div>
        </template>

        <template #upload>
          <div class="space-y-4 pt-4">
            <p class="text-muted text-sm">Select an image file to upload.</p>

            <div v-if="!uploadUrl" class="text-muted rounded-lg border border-dashed p-6 text-center text-sm">
              No upload URL configured.
            </div>

            <template v-else>
              <label
                class="border-default hover:border-primary/50 flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors"
                :class="uploading ? 'pointer-events-none opacity-60' : ''"
              >
                <UIcon name="i-lucide-upload-cloud" class="text-muted h-10 w-10" />
                <div class="text-center">
                  <p class="text-sm font-medium">Click to select an image</p>
                  <p class="text-muted mt-0.5 text-xs">PNG, JPG, WebP, GIF up to 10 MB</p>
                </div>
                <input type="file" accept="image/*" class="hidden" :disabled="uploading" @change="onFileChange" />
              </label>

              <div v-if="uploading" class="flex items-center gap-2 text-sm">
                <UIcon name="i-lucide-loader-circle" class="text-primary h-4 w-4 animate-spin" />
                <span class="text-muted">Uploading…</span>
              </div>

              <UAlert v-if="uploadError" icon="i-lucide-circle-x" color="error" variant="subtle" :title="uploadError" />
            </template>
          </div>
        </template>
      </UTabs>
    </template>
  </UModal>
</template>
