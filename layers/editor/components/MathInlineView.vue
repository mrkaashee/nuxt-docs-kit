<script setup lang="ts">
import { NodeViewWrapper } from "@tiptap/vue-3"
import katex from "katex"

const props = defineProps<{
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
  selected: boolean
  deleteNode: () => void
}>()

// ── State ─────────────────────────────────────────────────────────────────────
const popoverOpen = ref(false)
const draft = ref("")

const formula = computed(() => (props.node.attrs.formula as string) ?? "")

onMounted(() => {
  import("katex/dist/katex.min.css")
  if (!formula.value.trim()) openPopover()
})

// ── KaTeX render ──────────────────────────────────────────────────────────────
const rendered = computed(() => {
  const src = formula.value.trim()
  if (!src) return ""
  try {
    return katex.renderToString(src, { displayMode: false, throwOnError: false, output: "html" })
  } catch {
    return ""
  }
})

// Single computed for the draft live preview — returns { html, error }
const draftResult = computed(() => {
  const src = draft.value.trim()
  if (!src) return { html: "", error: false }
  try {
    return {
      html: katex.renderToString(src, { displayMode: false, throwOnError: false, output: "html" }),
      error: false,
    }
  } catch {
    return { html: "", error: true }
  }
})

// ── Popover ───────────────────────────────────────────────────────────────────
function openPopover() {
  draft.value = formula.value
  popoverOpen.value = true
  nextTick(() => {
    const input = document.querySelector<HTMLInputElement>("[data-math-inline-input]")
    input?.focus()
    input?.select()
  })
}

function applyEdit() {
  const trimmed = draft.value.trim()
  if (trimmed) {
    props.updateAttributes({ formula: trimmed })
  } else {
    props.deleteNode()
  }
  popoverOpen.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault()
    applyEdit()
  } else if (e.key === "Escape") {
    e.preventDefault()
    popoverOpen.value = false
  }
}

// Auto-open for new empty nodes — handled in the merged onMounted above
</script>

<template>
  <NodeViewWrapper as="span" class="inline">
    <!-- Clickable inline math — pure span, no button wrapper affecting line height -->
    <span
      class="cursor-pointer select-none"
      :class="[
        selected || popoverOpen
          ? 'ring-primary bg-primary/8 rounded ring-2 ring-offset-1'
          : 'hover:bg-primary/8 rounded',
      ]"
      @click.stop="openPopover"
    >
      <span v-if="formula.trim()" class="math pointer-events-none inline" v-html="rendered" />
      <span v-else class="text-muted bg-primary/8 rounded font-mono text-xs italic">math</span>
    </span>

    <!-- Popover anchored to the node view wrapper, triggered programmatically -->
    <UPopover v-model:open="popoverOpen" :ui="{ content: 'focus:outline-none' }">
      <!-- Zero-size invisible anchor so UPopover has a trigger element -->
      <span class="sr-only" aria-hidden="true" />

      <template #content>
        <div class="w-72 space-y-3 p-3" @mousedown.stop @click.stop>
          <!-- Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <UIcon name="i-lucide-sigma" class="text-muted h-3.5 w-3.5" />
              <p class="font-mono text-[10px] font-semibold tracking-wider uppercase">
                Inline math
              </p>
            </div>
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="xs"
              :padded="false"
              @click="deleteNode()"
            />
          </div>

          <!-- LaTeX input -->
          <div class="space-y-1">
            <label class="text-muted block text-[10px] font-medium tracking-wider uppercase">
              LaTeX
            </label>
            <UInput
              v-model="draft"
              data-math-inline-input
              placeholder="e.g. E = mc^2"
              size="sm"
              class="w-full font-mono"
              :ui="{ base: 'font-mono' }"
              @keydown="onKeydown"
            />
          </div>

          <!-- Live preview -->
          <div
            v-if="draft.trim()"
            class="border-default bg-muted/40 min-h-8 rounded-md border px-3 py-2 text-center text-sm"
            :class="draftResult.error ? 'text-error' : ''"
          >
            <span v-if="!draftResult.error" class="katex-inline-wrap" v-html="draftResult.html" />
            <span v-else class="font-mono text-xs">⚠ Syntax error</span>
          </div>

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
