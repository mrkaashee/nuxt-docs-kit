<script setup lang="ts">
import { NodeViewWrapper, NodeViewContent } from "@tiptap/vue-3"

const props = defineProps<{
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
  selected: boolean
  deleteNode: () => void
  getPos: () => number
  editor: any
}>()

const slotName = computed(() => (props.node.attrs.name as string) || "default")
const isDefault = computed(() => slotName.value === "default")

// Check the parent element tag directly from the tiptap document.
// provide/inject doesn't work across tiptap node view boundaries since each
// node view is mounted independently — we walk up the doc tree instead.
const isInsideCallout = computed(() => {
  const pos = props.getPos()
  if (pos === undefined || !props.editor) return false
  const { doc } = props.editor.state
  const $pos = doc.resolve(pos)
  const parent = $pos.parent
  if (parent.type.name !== "element") return false
  const t = parent.attrs?.tag
  return (
    t === "callout" ||
    t === "note" ||
    t === "card" ||
    t === "card-group" ||
    t === "steps" ||
    t === "badge" ||
    t === "tabs" ||
    t === "tabs-item"
  )
})

// ── Sibling slot info (for guard + rename) ────────────────────────────────────

/** All slot nodes that are siblings of this slot inside the parent element */
const siblingSlots = computed(() => {
  if (!props.editor) return []
  const pos = props.getPos()
  if (pos === undefined) return []
  const { doc } = props.editor.state
  const $pos = doc.resolve(pos)
  const parent = $pos.parent
  if (parent.type.name !== "element") return []
  const slots: string[] = []
  parent.forEach((child: any) => {
    if (child.type.name === "slot") slots.push(child.attrs.name ?? "default")
  })
  return slots
})

const isLastSlot = computed(() => siblingSlots.value.length <= 1)

// ── Rename ────────────────────────────────────────────────────────────────────

const renaming = ref(false)
const renameValue = ref("")

function startRename() {
  renameValue.value = slotName.value
  renaming.value = true
  nextTick(() => {
    const input = document.querySelector<HTMLInputElement>("[data-slot-rename]")
    input?.focus()
    input?.select()
  })
}

function applyRename() {
  const name = renameValue.value.trim().toLowerCase().replace(/\s+/g, "-")
  if (name && name !== slotName.value) {
    props.updateAttributes({ name })
  }
  renaming.value = false
}

function cancelRename() {
  renaming.value = false
}

// ── Safe delete (guarded) ─────────────────────────────────────────────────────

function safeDelete() {
  if (isLastSlot.value) return // never delete the last slot
  props.deleteNode()
}
</script>

<template>
  <NodeViewWrapper :class="isInsideCallout ? '' : 'my-1'">
    <!-- When inside a callout: render content bare, no wrapper chrome -->
    <template v-if="isInsideCallout">
      <NodeViewContent class="outline-none" />
    </template>

    <template v-else>
      <!-- Slot label — only shown for named (non-default) slots -->
      <div
        v-if="!isDefault"
        class="border-default bg-muted/30 flex items-center gap-1.5 rounded-t-md border border-b-0 px-3 py-1"
        contenteditable="false"
      >
        <UIcon name="i-lucide-hash" class="text-muted h-3 w-3 shrink-0" />

        <!-- Rename input -->
        <input
          v-if="renaming"
          v-model="renameValue"
          data-slot-rename
          class="text-foreground bg-transparent font-mono text-xs font-semibold outline-none"
          @keydown.enter.prevent="applyRename"
          @keydown.escape.prevent="cancelRename"
          @blur="applyRename"
        />
        <!-- Slot name (click to rename) -->
        <span
          v-else
          class="text-muted hover:text-foreground cursor-pointer font-mono text-xs font-semibold transition-colors"
          :title="'Click to rename'"
          @click.stop="startRename"
        >
          {{ slotName }}
        </span>

        <div class="ml-auto flex items-center gap-1">
          <!-- Rename button -->
          <UTooltip text="Rename slot">
            <UButton
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              size="xs"
              :padded="false"
              class="h-5 w-5"
              @click.stop="startRename"
            />
          </UTooltip>
          <!-- Delete — disabled when this is the last slot -->
          <UTooltip :text="isLastSlot ? 'Cannot delete the last slot' : 'Delete slot'">
            <UButton
              icon="i-lucide-trash-2"
              :color="isLastSlot ? 'neutral' : 'error'"
              variant="ghost"
              size="xs"
              :padded="false"
              :disabled="isLastSlot"
              class="h-5 w-5"
              @click.stop="safeDelete"
            />
          </UTooltip>
        </div>
      </div>

      <!-- Editable slot content -->
      <div
        class="border-default px-4 py-2"
        :class="isDefault ? 'rounded-b-lg border border-t-0' : 'rounded-b-md border border-t-0'"
      >
        <NodeViewContent class="outline-none" />
      </div>
    </template>
  </NodeViewWrapper>
</template>
