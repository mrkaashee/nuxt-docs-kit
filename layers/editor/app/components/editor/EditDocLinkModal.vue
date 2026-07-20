<script lang="ts" setup>
/**
 * EditDocLinkModal
 *
 * Modal for inserting / editing a hyperlink in the editor.
 * Emits `insert` with the chosen URL and target when confirmed,
 * and `remove` when the user wants to unset the current link.
 */
const props = withDefaults(
  defineProps<{
    open: boolean
    initialUrl?: string
    initialTarget?: "_self" | "_blank"
  }>(),
  { open: false },
)

const emit = defineEmits<{
  "update:open": [value: boolean]
  insert: [payload: { url: string; target: "_self" | "_blank" }]
  remove: []
}>()

const url = ref(props.initialUrl ?? "")
const target = ref<"_self" | "_blank">(props.initialTarget ?? "_self")

// Sync when the modal opens with fresh values from the editor
watch(
  () => props.open,
  (val) => {
    if (val) {
      url.value = props.initialUrl ?? ""
      target.value = props.initialTarget ?? "_self"
    }
  },
)

function confirm() {
  emit("insert", { url: url.value.trim(), target: target.value })
  emit("update:open", false)
}

function remove() {
  emit("remove")
  emit("update:open", false)
}
</script>

<template>
  <UModal :open="open" title="Insert Link" @update:open="emit('update:open', $event)">
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField label="URL" required>
          <UInput
            v-model="url"
            placeholder="https://example.com"
            class="w-full"
            autofocus
            @keydown.enter="confirm"
          />
        </UFormField>
        <UFormField label="Open in">
          <div class="flex gap-2">
            <UButton
              label="Same tab"
              icon="i-lucide-arrow-right"
              size="sm"
              :color="target === '_self' ? 'primary' : 'neutral'"
              :variant="target === '_self' ? 'soft' : 'ghost'"
              @click="target = '_self'"
            />
            <UButton
              label="New tab"
              icon="i-lucide-external-link"
              size="sm"
              :color="target === '_blank' ? 'primary' : 'neutral'"
              :variant="target === '_blank' ? 'soft' : 'ghost'"
              @click="target = '_blank'"
            />
          </div>
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          @click="emit('update:open', false)"
        />
        <UButton
          v-if="url.trim()"
          label="Remove Link"
          color="error"
          variant="ghost"
          @click="remove"
        />
        <UButton
          label="Insert"
          icon="i-lucide-link"
          color="primary"
          :disabled="!url.trim()"
          @click="confirm"
        />
      </div>
    </template>
  </UModal>
</template>
