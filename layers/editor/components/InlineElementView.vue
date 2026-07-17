<script setup lang="ts">
import { NodeViewWrapper } from "@tiptap/vue-3"

const props = defineProps<{
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
  selected: boolean
  deleteNode: () => void
}>()

const tag = computed(() => props.node.attrs.tag as string)
const content = computed(() => props.node.attrs.content as string)
const nodeProps = computed(() => (props.node.attrs.props ?? {}) as Record<string, string>)

const chipColor = computed(() => (nodeProps.value.color as any) ?? "primary")
const chipVariant = computed(() => (nodeProps.value.variant as any) ?? "subtle")

const INLINE_TAGS: Record<string, { icon: string }> = {
  badge: { icon: "i-lucide-tag" },
  "u-badge": { icon: "i-lucide-tag" },
  "u-kbd": { icon: "i-lucide-keyboard" },
  "u-icon": { icon: "i-lucide-image" },
}
const tagConfig = computed(() => INLINE_TAGS[tag.value] ?? { icon: "i-lucide-component" })

// ── Popover ───────────────────────────────────────────────────────────────────
const popoverOpen = ref(false)
const editingContent = ref("")
const editingColor = ref("primary")
const editingVariant = ref("subtle")

function openPopover() {
  editingContent.value = content.value
  editingColor.value = nodeProps.value.color ?? "primary"
  editingVariant.value = nodeProps.value.variant ?? "subtle"
  popoverOpen.value = true
}

function applyEdit() {
  const newProps: Record<string, string> = { ...nodeProps.value }
  if (editingColor.value) newProps.color = editingColor.value
  if (editingVariant.value) newProps.variant = editingVariant.value
  props.updateAttributes({ content: editingContent.value.trim(), props: newProps })
  popoverOpen.value = false
}

const COLORS = ["primary", "secondary", "info", "success", "warning", "error", "neutral"]
const VARIANTS = ["solid", "outline", "soft", "subtle"]

const isBadge = computed(() => tag.value === "badge" || tag.value === "u-badge")
</script>

<template>
  <NodeViewWrapper as="span" class="inline">
    <UPopover :ui="{ content: 'focus:outline-none' }">
      <!-- Chip preview -->
      <UBadge
        v-if="isBadge"
        :color="chipColor"
        :variant="chipVariant"
        class="cursor-pointer align-middle select-none"
        :class="{ 'ring-primary ring-2 ring-offset-1': selected }"
        @click.stop="openPopover"
      >
        {{ content || tag }}
      </UBadge>
      <UKbd
        v-else-if="tag === 'u-kbd'"
        class="cursor-pointer align-middle select-none"
        :class="{ 'ring-primary ring-2 ring-offset-1': selected }"
        @click.stop="openPopover"
      >
        {{ content || "⌘K" }}
      </UKbd>
      <UBadge
        v-else
        color="neutral"
        variant="subtle"
        class="cursor-pointer align-middle font-mono select-none"
        :class="{ 'ring-primary ring-2 ring-offset-1': selected }"
        @click.stop="openPopover"
      >
        <UIcon :name="tagConfig.icon" class="mr-0.5 h-3 w-3" />
        {{ content || tag }}
      </UBadge>

      <template #content>
        <div class="w-60 space-y-3 p-3" @mousedown.stop @click.stop>
          <div class="flex items-center justify-between">
            <p class="font-mono text-[10px] font-semibold tracking-wider uppercase">:{{ tag }}</p>
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="xs"
              :padded="false"
              @click="deleteNode()"
            />
          </div>

          <!-- Content -->
          <div class="space-y-1">
            <label class="text-muted block text-[10px] font-medium tracking-wider uppercase"
              >Text</label
            >
            <UInput
              v-model="editingContent"
              placeholder="Badge text"
              size="xs"
              class="w-full"
              autofocus
            />
          </div>

          <!-- Color + Variant visual picker (badges only) -->
          <template v-if="isBadge">
            <div class="space-y-1">
              <label class="text-muted block text-[10px] font-medium tracking-wider uppercase"
                >Style</label
              >
              <div class="space-y-1.5">
                <div v-for="variant in VARIANTS" :key="variant" class="flex items-center gap-1.5">
                  <span class="text-muted w-12 text-[10px]">{{ variant }}</span>
                  <div class="flex flex-wrap gap-1">
                    <UBadge
                      v-for="color in COLORS"
                      :key="color"
                      :color="color as any"
                      :variant="variant as any"
                      class="cursor-pointer text-[10px]"
                      :class="
                        editingColor === color && editingVariant === variant
                          ? 'ring-primary ring-2 ring-offset-1'
                          : ''
                      "
                      @click="
                        () => {
                          editingColor = color
                          editingVariant = variant
                        }
                      "
                    >
                      {{ editingContent || "Aa" }}
                    </UBadge>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <div class="flex justify-end gap-2 border-t pt-2">
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="popoverOpen = false"
            />
            <UButton label="Apply" color="primary" size="xs" @click="applyEdit" />
          </div>
        </div>
      </template>
    </UPopover>
  </NodeViewWrapper>
</template>
