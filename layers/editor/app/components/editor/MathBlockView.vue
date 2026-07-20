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
const isHovered = ref(false)
const isEditing = ref(false)
const draft = ref("")

const formula = computed(() => (props.node.attrs.formula as string) ?? "")

// ── KaTeX render ──────────────────────────────────────────────────────────────

// Single computed for the saved formula — returns { html, error }
const formulaResult = computed(() => {
  const src = formula.value.trim()
  if (!src) return { html: "", error: false }
  try {
    return {
      html: katex.renderToString(src, { displayMode: true, throwOnError: false, output: "html" }),
      error: false,
    }
  } catch {
    return { html: "", error: true }
  }
})

// Single computed for the draft (edit panel live preview) — returns { html, error }
const draftResult = computed(() => {
  const src = draft.value.trim()
  if (!src) return { html: "", error: false }
  try {
    return {
      html: katex.renderToString(src, { displayMode: true, throwOnError: false, output: "html" }),
      error: false,
    }
  } catch {
    return { html: "", error: true }
  }
})

// ── Edit mode ─────────────────────────────────────────────────────────────────
function startEdit() {
  draft.value = formula.value
  isEditing.value = true
  nextTick(() => {
    const ta = document.querySelector<HTMLTextAreaElement>("[data-math-block-input]")
    ta?.focus()
    ta?.select()
  })
}

function applyEdit() {
  props.updateAttributes({ formula: draft.value.trim() })
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    applyEdit()
  } else if (e.key === "Escape") {
    e.preventDefault()
    cancelEdit()
  }
}

// ── Copy ──────────────────────────────────────────────────────────────────────
const copied = ref(false)
function copyFormula() {
  navigator.clipboard.writeText(formula.value).then(() => {
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  })
}

// ── Auto-open edit on new empty block; load KaTeX CSS ────────────────────────
onMounted(() => {
  import("katex/dist/katex.min.css")
  if (!formula.value.trim()) startEdit()
})

const showControls = computed(() => isHovered.value || props.selected || isEditing.value)
</script>

<template>
  <NodeViewWrapper
    class="group relative"
    :class="{ 'ring-primary/40 rounded-xl ring-2 ring-offset-1': selected && !isEditing }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- ── Edit mode ── -->
    <div v-if="isEditing" class="border-default bg-default overflow-hidden rounded-xl border">
      <!-- Header -->
      <div
        class="border-default flex items-center gap-2 border-b px-3 py-2"
        contenteditable="false"
      >
        <UIcon name="i-lucide-sigma" class="text-muted h-3.5 w-3.5 shrink-0" />
        <span class="text-muted text-xs font-semibold tracking-wider uppercase">LaTeX formula</span>
        <div class="ml-auto flex items-center gap-1">
          <UTooltip text="Cancel (Esc)">
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="xs"
              :padded="false"
              class="h-6 w-6"
              @click.stop="cancelEdit"
            />
          </UTooltip>
        </div>
      </div>

      <!-- Two-panel: source + live preview -->
      <div class="flex min-h-[120px]" contenteditable="false">
        <!-- Source textarea -->
        <div class="border-default flex w-1/2 flex-col border-r">
          <label class="text-muted px-3 pt-2 pb-1 text-[10px] font-medium tracking-wider uppercase">
            Source
          </label>
          <textarea
            v-model="draft"
            data-math-block-input
            class="text-foreground placeholder:text-muted/50 flex-1 resize-none bg-transparent px-3 pb-3 font-mono text-sm outline-none"
            placeholder="\frac{a}{b} = c"
            spellcheck="false"
            @keydown="onKeydown"
            @mousedown.stop
          />
        </div>

        <!-- Live KaTeX preview -->
        <div class="flex w-1/2 flex-col">
          <label class="text-muted px-3 pt-2 pb-1 text-[10px] font-medium tracking-wider uppercase">
            Preview
          </label>
          <div class="flex flex-1 items-center justify-center px-4 pb-3">
            <div
              v-if="draft.trim()"
              class="[&_.katex-display]:my-0"
              :class="draftResult.error ? 'text-error text-sm' : ''"
              v-html="draftResult.html || (draftResult.error ? '⚠ Syntax error' : '')"
            />
            <span v-else class="text-muted/50 text-sm italic">Enter LaTeX above</span>
          </div>
        </div>
      </div>

      <!-- Footer actions -->
      <div
        class="border-default flex items-center justify-between border-t px-3 py-2"
        contenteditable="false"
      >
        <span class="text-muted text-[10px]">
          <kbd class="bg-muted rounded px-1 py-0.5 font-mono">⌘Enter</kbd> to apply ·
          <kbd class="bg-muted rounded px-1 py-0.5 font-mono">Esc</kbd> to cancel
        </span>
        <div class="flex items-center gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            size="xs"
            @click.stop="cancelEdit"
          />
          <UButton label="Apply" color="primary" size="xs" @click.stop="applyEdit" />
        </div>
      </div>
    </div>

    <!-- ── Preview mode ── -->
    <div v-else class="group relative my-5">
      <!-- Empty state — only shown when there's no formula yet -->
      <div
        v-if="!formula.trim()"
        class="border-default text-muted flex cursor-pointer flex-col items-center gap-2 rounded-md border px-4 py-6 text-sm"
        @click.stop="startEdit"
      >
        <UIcon name="i-lucide-sigma" class="h-7 w-7 opacity-40" />
        <span class="opacity-60">Click to add a formula</span>
      </div>

      <template v-else>
        <!-- Copy button — matches ProseMath position exactly -->
        <UButton
          :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
          color="neutral"
          variant="outline"
          size="sm"
          class="absolute top-[11px] right-[11px] z-10 opacity-0 transition group-hover:opacity-100"
          :class="{ 'opacity-100': showControls }"
          tabindex="-1"
          contenteditable="false"
          @click.stop="copyFormula"
        />

        <!-- Rendered KaTeX — matches ProseMath base classes exactly -->
        <div
          class="border-muted bg-muted overflow-x-auto rounded-md border px-4 py-3 font-mono text-sm/6"
          :class="[
            formulaResult.error ? 'text-error' : '',
            { 'ring-primary/40 ring-2 ring-offset-1': selected },
          ]"
          @dblclick.stop="startEdit"
        >
          <div
            v-if="!formulaResult.error"
            class="[&_.katex-display]:my-0"
            v-html="formulaResult.html"
          />
          <span v-else class="font-mono text-xs">⚠ Syntax error in formula</span>
        </div>

        <!-- Edit / delete controls — fade in on hover/select -->
        <div
          class="absolute top-[11px] right-[70px] flex items-center gap-1 transition-opacity duration-150"
          :class="showControls ? 'opacity-100' : 'pointer-events-none opacity-0'"
          contenteditable="false"
        >
          <UTooltip text="Edit formula">
            <UButton
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              size="xs"
              :padded="false"
              class="h-6 w-6"
              @click.stop="startEdit"
            />
          </UTooltip>
          <UTooltip text="Delete">
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="xs"
              :padded="false"
              class="h-6 w-6"
              @click.stop="deleteNode()"
            />
          </UTooltip>
        </div>
      </template>
    </div>
  </NodeViewWrapper>
</template>
