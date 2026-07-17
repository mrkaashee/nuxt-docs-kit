<script setup lang="ts">
import { NodeViewWrapper } from "@tiptap/vue-3"

const props = defineProps<{
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
  selected: boolean
  deleteNode: () => void
  editor: any
}>()

const isDoc = computed(() => props.node.attrs.mentionType === "doc")
const label = computed(() => props.node.attrs.label || props.node.attrs.id || "")
const href = computed(() => props.node.attrs.href || "")
const linkStyle = computed(() => props.node.attrs.linkStyle || "mention")
const btnColor = computed(() => props.node.attrs.btnColor || "primary")
const btnVariant = computed(() => props.node.attrs.btnVariant || "solid")

// ── Hover state ───────────────────────────────────────────────────────────────
const isHovered = ref(false)

// ── Edit popover ──────────────────────────────────────────────────────────────
const popoverOpen = ref(false)

function openEdit() {
  popoverOpen.value = true
}

function applyEdit({
  label: newLabel,
  style,
  color,
  variant,
}: {
  label: string
  style: string
  color?: string
  variant?: string
}) {
  // Always update attrs in place — never replace the node
  props.updateAttributes({
    label: newLabel || label.value,
    linkStyle: style,
    btnColor: color || "primary",
    btnVariant: variant || "solid",
  })
  popoverOpen.value = false
}
</script>

<template>
  <NodeViewWrapper
    as="span"
    class="inline select-none"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- ── Chip rendering based on linkStyle ─────────────────────────────── -->

    <!-- Mention chip (default) -->
    <span
      v-if="linkStyle === 'mention'"
      class="group border-default bg-muted/30 hover:bg-muted/60 inline-flex cursor-pointer items-center gap-1.5 rounded-full border py-0.5 pr-1.5 pl-2 align-middle text-sm transition-all duration-200"
      :class="selected ? 'ring-primary border-primary/40 bg-primary/5 ring-2 ring-offset-1' : ''"
    >
      <UIcon
        v-if="isDoc"
        name="i-lucide-book-open"
        class="text-primary h-3.5 w-3.5 shrink-0 opacity-80"
      />
      <UIcon v-else name="i-lucide-at-sign" class="text-primary h-3.5 w-3.5 shrink-0 opacity-80" />
      <span class="text-primary font-semibold">{{ label }}</span>
      <button
        type="button"
        class="text-muted hover:text-default hover:bg-default flex items-center rounded-full p-0.5 opacity-0 transition-all duration-200 group-hover:opacity-100 focus-visible:opacity-100"
        :class="{ 'opacity-100': selected }"
        title="Edit mention"
        @pointerdown.prevent.stop="openEdit"
      >
        <UIcon name="i-lucide-pencil" class="h-3 w-3" />
      </button>
    </span>

    <!-- Link style -->
    <span
      v-else-if="linkStyle === 'link'"
      class="group inline-flex cursor-pointer items-center gap-1 align-middle"
      :class="
        selected ? 'ring-primary bg-primary/5 rounded px-1.5 py-0.5 ring-2 ring-offset-1' : ''
      "
    >
      <span class="text-primary cursor-pointer font-medium underline">{{ label }}</span>
      <button
        type="button"
        class="text-muted hover:text-default hover:bg-muted flex items-center rounded-full p-0.5 opacity-0 transition-all duration-200 group-hover:opacity-100 focus-visible:opacity-100"
        :class="{ 'opacity-100': selected }"
        title="Edit mention"
        @pointerdown.prevent.stop="openEdit"
      >
        <UIcon name="i-lucide-pencil" class="h-3 w-3" />
      </button>
    </span>

    <!-- Code-link style -->
    <span
      v-else-if="linkStyle === 'code-link'"
      class="group inline-flex cursor-pointer items-center gap-1 align-middle"
      :class="selected ? 'ring-primary bg-primary/5 rounded ring-2 ring-offset-1' : ''"
    >
      <code
        class="text-primary bg-muted/60 rounded px-1.5 py-0.5 font-mono text-xs font-medium underline"
        >{{ label }}</code
      >
      <button
        type="button"
        class="text-muted hover:text-default hover:bg-muted flex items-center rounded-full p-0.5 opacity-0 transition-all duration-200 group-hover:opacity-100 focus-visible:opacity-100"
        :class="{ 'opacity-100': selected }"
        title="Edit mention"
        @pointerdown.prevent.stop="openEdit"
      >
        <UIcon name="i-lucide-pencil" class="h-3 w-3" />
      </button>
    </span>

    <!-- Button style -->
    <span
      v-else-if="linkStyle === 'button'"
      class="group inline-flex items-center gap-1.5 align-middle"
      :class="selected ? 'ring-primary rounded ring-2 ring-offset-1' : ''"
    >
      <UButton
        :label="label"
        :color="btnColor"
        :variant="btnVariant"
        size="xs"
        tabindex="-1"
        class="pointer-events-none"
      />
      <button
        type="button"
        class="text-muted hover:text-default hover:bg-muted flex items-center rounded-full p-1 opacity-0 transition-all duration-200 group-hover:opacity-100 focus-visible:opacity-100"
        :class="{ 'opacity-100': selected }"
        title="Edit mention"
        @pointerdown.prevent.stop="openEdit"
      >
        <UIcon name="i-lucide-pencil" class="h-3.5 w-3.5" />
      </button>
    </span>

    <!-- Edit Modal -->
    <UModal v-model:open="popoverOpen" title="Edit Mention" :ui="{ width: 'max-w-sm' }">
      <template #body>
        <EditorMentionInsertPopover
          :item="{
            id: node.attrs.id,
            label: label,
            href: href,
            mentionType: node.attrs.mentionType || 'user',
            initialStyle: linkStyle,
            initialColor: btnColor,
            initialVariant: btnVariant,
          }"
          @confirm="applyEdit"
          @cancel="popoverOpen = false"
        />
      </template>
    </UModal>
  </NodeViewWrapper>
</template>
