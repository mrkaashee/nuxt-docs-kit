<script lang="ts" setup>
interface DocImage {
  id: string
  url: string
  caption?: string | null
  createdAt?: string | null
}

interface Props {
  images: DocImage[]
  loading?: boolean
  error?: string | null
  canDelete?: boolean
  canSetCover?: boolean
  emptyLabel?: string
  page?: number
  pageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  canDelete: false,
  canSetCover: false,
  emptyLabel: "No images yet.",
  page: 1,
  pageSize: 50,
})

const emit = defineEmits<{
  (e: "delete", imageId: string): void
  (e: "select", image: DocImage): void
  (e: "copy", url: string): void
  (e: "set-cover", url: string): void
  (e: "retry"): void
  (e: "update:page", page: number): void
}>()

// ── Lightbox ──────────────────────────────────────────────────────────────────
const lightboxImage = ref<DocImage | null>(null)
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

function openLightbox(image: DocImage, index: number) {
  lightboxImage.value = image
  lightboxIndex.value = index
  lightboxOpen.value = true
  emit("select", image)
}

function closeLightbox() {
  lightboxOpen.value = false
  lightboxImage.value = null
}

function prevImage() {
  const newIdx = (lightboxIndex.value - 1 + props.images.length) % props.images.length
  lightboxIndex.value = newIdx
  lightboxImage.value = props.images[newIdx]!
}

function nextImage() {
  const newIdx = (lightboxIndex.value + 1) % props.images.length
  lightboxIndex.value = newIdx
  lightboxImage.value = props.images[newIdx]!
}

watch(lightboxOpen, (val) => {
  if (!val) lightboxImage.value = null
})

// ── Keyboard nav in lightbox ──────────────────────────────────────────────────
function onKeydown(e: KeyboardEvent) {
  if (!lightboxOpen.value) return
  if (e.key === "ArrowLeft") prevImage()
  else if (e.key === "ArrowRight") nextImage()
  else if (e.key === "Escape") closeLightbox()
}

onMounted(() => window.addEventListener("keydown", onKeydown))
onUnmounted(() => window.removeEventListener("keydown", onKeydown))

// ── Copy URL ──────────────────────────────────────────────────────────────────
const { copy, copied } = useClipboard()

async function copyUrl(url: string) {
  await copy(url)
  emit("copy", url)
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// ── Pagination ────────────────────────────────────────────────────────────────
const PAGINATION_THRESHOLD = 50
const showPagination = computed(() => props.images.length > PAGINATION_THRESHOLD)
</script>

<template>
  <div class="space-y-6">
    <!-- Loading skeleton -->
    <div
      v-if="loading"
      class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    >
      <div v-for="n in 12" :key="n" class="bg-muted aspect-square animate-pulse rounded-lg" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex flex-col items-center gap-3 py-16 text-center">
      <div class="bg-error/10 rounded-full p-4">
        <UIcon name="i-lucide-image-off" class="text-error h-8 w-8" />
      </div>
      <div>
        <p class="text-foreground font-medium">Failed to load images</p>
        <p class="text-muted mt-1 text-sm">{{ error }}</p>
      </div>
      <UButton
        label="Try again"
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="soft"
        size="sm"
        @click="emit('retry')"
      />
    </div>

    <!-- Empty state -->
    <div v-else-if="images.length === 0" class="flex flex-col items-center gap-3 py-16 text-center">
      <div class="bg-muted rounded-full p-4">
        <UIcon name="i-lucide-images" class="text-muted h-8 w-8" />
      </div>
      <div>
        <p class="text-foreground font-medium">No images yet</p>
        <p class="text-muted mt-1 text-sm">{{ emptyLabel }}</p>
      </div>
      <slot />
    </div>

    <!-- Image grid -->
    <template v-else>
      <!-- Count -->
      <p class="text-muted text-sm">
        {{ images.length }} {{ images.length === 1 ? "image" : "images" }}
      </p>

      <div
        class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      >
        <div
          v-for="(image, idx) in images"
          :key="image.id"
          class="group hover:border-primary/40 focus-visible:ring-primary relative cursor-pointer overflow-hidden rounded-lg border border-transparent transition-all duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
          tabindex="0"
          :aria-label="`Open ${image.caption || 'image'}`"
          @click="openLightbox(image, idx)"
          @keydown.enter="openLightbox(image, idx)"
        >
          <!-- Thumbnail -->
          <div class="bg-muted aspect-square overflow-hidden">
            <img
              :src="image.url"
              class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              :alt="image.caption || 'Gallery image'"
              loading="lazy"
            />
          </div>

          <!-- Overlay on hover -->
          <div
            class="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/60 via-transparent to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            <!-- Top-right: delete button -->
            <div class="flex justify-end">
              <UButton
                v-if="canDelete"
                icon="i-lucide-trash-2"
                color="error"
                variant="solid"
                size="xs"
                class="shadow"
                @click.stop="emit('delete', image.id)"
              />
            </div>

            <!-- Bottom: caption / date -->
            <div>
              <p
                v-if="image.caption"
                class="truncate text-xs font-medium text-white"
                :title="image.caption"
              >
                {{ image.caption }}
              </p>
              <p v-if="image.createdAt" class="text-xs text-white/70">
                {{ formatDate(image.createdAt) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="showPagination" class="flex justify-center pt-2">
        <UPagination
          :page="page"
          :total="images.length"
          :items-per-page="pageSize"
          color="neutral"
          variant="soft"
          active-color="primary"
          active-variant="solid"
          show-edges
          :sibling-count="1"
          @update:page="emit('update:page', $event)"
        />
      </div>
    </template>

    <!-- Lightbox modal -->
    <UModal v-model:open="lightboxOpen" :ui="{ content: 'max-w-4xl' }" :close="false">
      <template #content>
        <div class="relative flex flex-col">
          <!-- Header bar -->
          <div class="flex items-center justify-between border-b px-4 py-3">
            <p class="text-muted text-sm">{{ lightboxIndex + 1 }} / {{ images.length }}</p>
            <div class="flex items-center gap-1">
              <UButton
                icon="i-lucide-chevron-left"
                color="neutral"
                variant="ghost"
                size="sm"
                :disabled="images.length <= 1"
                aria-label="Previous image"
                @click="prevImage"
              />
              <UButton
                icon="i-lucide-chevron-right"
                color="neutral"
                variant="ghost"
                size="sm"
                :disabled="images.length <= 1"
                aria-label="Next image"
                @click="nextImage"
              />
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="sm"
                aria-label="Close"
                @click="closeLightbox"
              />
            </div>
          </div>

          <!-- Image -->
          <div class="bg-muted/30 flex min-h-[40vh] items-center justify-center p-6">
            <img
              v-if="lightboxImage"
              :src="lightboxImage.url"
              class="max-h-[65vh] max-w-full rounded-lg object-contain shadow-lg"
              :alt="lightboxImage.caption || 'Gallery image'"
            />
          </div>

          <!-- Footer bar -->
          <div v-if="lightboxImage" class="space-y-3 border-t px-4 py-3">
            <!-- Caption + date -->
            <div v-if="lightboxImage.caption || lightboxImage.createdAt">
              <p v-if="lightboxImage.caption" class="text-foreground text-sm font-medium">
                {{ lightboxImage.caption }}
              </p>
              <p v-if="lightboxImage.createdAt" class="text-muted mt-0.5 text-xs">
                {{ formatDate(lightboxImage.createdAt) }}
              </p>
            </div>

            <!-- Actions row -->
            <div class="flex flex-wrap items-center gap-2">
              <!-- URL chip -->
              <code
                class="bg-muted text-muted min-w-0 flex-1 truncate rounded-md px-2 py-1.5 font-mono text-xs"
                :title="lightboxImage.url"
              >
                {{ lightboxImage.url }}
              </code>

              <UButton
                :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
                :label="copied ? 'Copied' : 'Copy URL'"
                :color="copied ? 'success' : 'neutral'"
                variant="soft"
                size="xs"
                @click="copyUrl(lightboxImage.url)"
              />

              <UButton
                v-if="canSetCover"
                icon="i-lucide-image"
                label="Set as cover"
                color="primary"
                variant="soft"
                size="xs"
                @click="
                  () => {
                    emit('set-cover', lightboxImage!.url)
                    closeLightbox()
                  }
                "
              />

              <UButton
                v-if="canDelete"
                icon="i-lucide-trash-2"
                label="Delete"
                color="error"
                variant="soft"
                size="xs"
                @click="
                  () => {
                    emit('delete', lightboxImage!.id)
                    closeLightbox()
                  }
                "
              />
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
