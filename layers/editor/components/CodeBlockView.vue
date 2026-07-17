<script setup lang="ts">
import { Mermaid as ComarkMermaid } from "@comark/vue/plugins/mermaid"
import { NodeViewWrapper, NodeViewContent } from "@tiptap/vue-3"

const props = defineProps<{
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
  selected: boolean
  editor: any
}>()

const LANGUAGES = [
  { label: "Plain text", value: "__none__" },
  { label: "Bash / Shell", value: "bash" },
  { label: "CSS", value: "css" },
  { label: "Diff", value: "diff" },
  { label: "Docker", value: "dockerfile" },
  { label: "Go", value: "go" },
  { label: "GraphQL", value: "graphql" },
  { label: "HTML", value: "html" },
  { label: "Java", value: "java" },
  { label: "JavaScript", value: "javascript" },
  { label: "JSON", value: "json" },
  { label: "Kotlin", value: "kotlin" },
  { label: "Markdown", value: "markdown" },
  { label: "MDC", value: "mdc" },
  { label: "Mermaid", value: "mermaid" },
  { label: "PHP", value: "php" },
  { label: "Python", value: "python" },
  { label: "Ruby", value: "ruby" },
  { label: "Rust", value: "rust" },
  { label: "SQL", value: "sql" },
  { label: "Swift", value: "swift" },
  { label: "TOML", value: "toml" },
  { label: "TypeScript", value: "typescript" },
  { label: "Vue", value: "vue" },
  { label: "XML", value: "xml" },
  { label: "YAML", value: "yaml" },
]

const currentLanguage = computed(() => props.node.attrs.language ?? "__none__")
const currentFilename = computed(() => props.node.attrs.filename ?? "")
const isMermaid = computed(() => props.node.attrs.language === "mermaid")

// Raw text content of the code block (for mermaid rendering + copy)
const codeContent = computed(() => {
  let text = ""
  props.node.content?.forEach((child: any) => {
    if (child.type.name === "text") text += child.text ?? ""
  })
  return text
})

const languageLabel = computed(() => {
  if (!props.node.attrs.language) return null
  return (
    LANGUAGES.find((l) => l.value === props.node.attrs.language)?.label ?? props.node.attrs.language
  )
})

// ── Mermaid: edit vs preview toggle ──────────────────────────────────────────
// Mermaid blocks default to preview (rendered) mode; click "Edit source" to edit.
const mermaidEditMode = ref(false)

function enterMermaidEdit() {
  mermaidEditMode.value = true
}

function exitMermaidEdit() {
  mermaidEditMode.value = false
}

// ── Copy ──────────────────────────────────────────────────────────────────────
const copied = ref(false)
function copyCode() {
  navigator.clipboard.writeText(codeContent.value).then(() => {
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  })
}

// ── Settings popover ──────────────────────────────────────────────────────────
const isHovered = ref(false)
const popoverOpen = ref(false)
const editingLanguage = ref("__none__")
const editingFilename = ref("")

function openPopover() {
  editingLanguage.value = currentLanguage.value
  editingFilename.value = currentFilename.value
  popoverOpen.value = true
}

function applyEdit() {
  const lang = editingLanguage.value === "__none__" ? null : editingLanguage.value
  props.updateAttributes({
    language: lang,
    filename: editingFilename.value.trim() || null,
  })
  // If switching away from mermaid, leave edit mode
  if (lang !== "mermaid") mermaidEditMode.value = false
  popoverOpen.value = false
}

function cancelEdit() {
  popoverOpen.value = false
}

const showControls = computed(() => isHovered.value || popoverOpen.value || props.selected)
</script>

<template>
  <NodeViewWrapper
    class="group relative my-5"
    :class="{ 'ring-primary/40 rounded-md ring-2 ring-offset-1': selected }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- ── Mermaid: rendered diagram ── -->
    <template v-if="isMermaid && !mermaidEditMode">
      <!-- Matches ProseMermaid exactly -->
      <UButton
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        color="neutral"
        variant="outline"
        size="sm"
        class="absolute top-[11px] right-[11px] z-10 opacity-0 transition group-hover:opacity-100"
        :class="{ 'opacity-100': showControls }"
        tabindex="-1"
        contenteditable="false"
        @click.stop="copyCode"
      />

      <div
        class="border-muted bg-muted flex justify-center overflow-x-auto rounded-md border px-4 py-3 font-mono text-sm/6"
        contenteditable="false"
      >
        <ComarkMermaid v-if="codeContent.trim()" :content="codeContent" />
        <span v-else class="text-muted/50 italic">Empty diagram</span>
      </div>

      <!-- Floating controls -->
      <div
        class="absolute top-[11px] right-[70px] z-10 flex items-center gap-1 transition-opacity duration-150"
        :class="showControls ? 'opacity-100' : 'pointer-events-none opacity-0'"
        contenteditable="false"
      >
        <UTooltip text="Edit source">
          <UButton
            icon="i-lucide-pencil"
            color="neutral"
            variant="ghost"
            size="xs"
            :padded="false"
            class="h-6 w-6"
            @click.stop="enterMermaidEdit"
          />
        </UTooltip>
        <UTooltip text="Delete block">
          <UButton
            icon="i-lucide-trash"
            color="error"
            variant="ghost"
            size="xs"
            :padded="false"
            class="h-6 w-6"
            @click.stop="editor.chain().focus().deleteNode('codeBlock').run()"
          />
        </UTooltip>
      </div>
    </template>

    <!-- ── Mermaid: source edit mode ── -->
    <template v-else-if="isMermaid && mermaidEditMode">
      <!-- Header bar with "back to preview" -->
      <div
        class="border-muted bg-default flex items-center gap-2 rounded-t-md border border-b-0 px-3 py-2"
        contenteditable="false"
      >
        <UBadge label="mermaid" color="neutral" variant="subtle" size="sm" class="font-mono" />
        <span class="text-muted ml-1 text-xs">Edit diagram source</span>
        <div class="ml-auto flex items-center gap-1">
          <UTooltip text="Delete block">
            <UButton
              icon="i-lucide-trash"
              color="error"
              variant="ghost"
              size="xs"
              :padded="false"
              class="h-6 w-6"
              @click.stop="editor.chain().focus().deleteNode('codeBlock').run()"
            />
          </UTooltip>
          <UTooltip text="Back to preview">
            <UButton
              icon="i-lucide-eye"
              color="primary"
              variant="soft"
              size="xs"
              :padded="false"
              class="h-6 w-6"
              @click.stop="exitMermaidEdit"
            />
          </UTooltip>
        </div>
      </div>
      <!-- Editable source -->
      <pre
        class="border-muted bg-muted rounded-t-none rounded-b-md border px-4 py-3 font-mono text-sm/6"
      ><NodeViewContent as="code" /></pre>
    </template>

    <!-- ── Regular code block ── -->
    <template v-else>
      <!-- Copy button — matches ProsePre -->
      <UButton
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        color="neutral"
        variant="outline"
        size="sm"
        class="absolute top-[11px] right-[11px] z-10 opacity-0 transition group-hover:opacity-100"
        :class="{ 'opacity-100': showControls }"
        tabindex="-1"
        contenteditable="false"
        @click.stop="copyCode"
      />

      <!-- Filename header (when set) — matches ProsePre header slot -->
      <div
        v-if="currentFilename"
        class="border-muted bg-default flex items-center gap-1.5 rounded-t-md border border-b-0 px-4 py-3"
        contenteditable="false"
      >
        <UIcon name="i-lucide-file-code" class="text-muted h-4 w-4 shrink-0" />
        <span class="text-default text-sm/6">{{ currentFilename }}</span>
      </div>

      <!-- Code — matches ProsePre base class -->
      <pre
        class="border-muted bg-muted overflow-x-auto border px-4 py-3 font-mono text-sm/6 wrap-break-word whitespace-pre-wrap outline-none"
        :class="currentFilename ? 'rounded-t-none rounded-b-md' : 'rounded-md'"
      ><NodeViewContent as="code" /></pre>

      <!-- Settings control (bottom-right, only on hover) -->
      <div
        class="absolute top-[11px] right-[82px] z-10 flex items-center gap-1 transition-opacity duration-150"
        :class="showControls ? 'opacity-100' : 'pointer-events-none opacity-0'"
        contenteditable="false"
      >
        <UTooltip text="Delete block">
          <UButton
            icon="i-lucide-trash"
            color="error"
            variant="ghost"
            size="xs"
            :padded="false"
            class="h-6 w-6"
            @click.stop="editor.chain().focus().deleteNode('codeBlock').run()"
          />
        </UTooltip>

        <UPopover v-model:open="popoverOpen" :ui="{ content: 'focus:outline-none' }">
          <UTooltip text="Set language & filename">
            <UButton
              icon="i-lucide-settings-2"
              color="neutral"
              variant="ghost"
              size="xs"
              :padded="false"
              class="h-6 w-6"
              @click.stop="openPopover"
            />
          </UTooltip>

          <template #content>
            <div class="w-64 space-y-3 p-3" @mousedown.stop @click.stop>
              <p class="text-xs font-semibold">Code block settings</p>

              <div class="space-y-1">
                <label class="text-muted block text-[10px] font-medium tracking-wider uppercase">
                  Language
                </label>
                <USelect
                  v-model="editingLanguage"
                  :items="LANGUAGES"
                  value-key="value"
                  label-key="label"
                  size="sm"
                  class="w-full"
                />
              </div>

              <div class="space-y-1">
                <label class="text-muted block text-[10px] font-medium tracking-wider uppercase">
                  Filename <span class="normal-case opacity-60">(optional)</span>
                </label>
                <UInput
                  v-model="editingFilename"
                  placeholder="e.g. utils.ts"
                  size="sm"
                  class="w-full"
                  @keydown.enter.prevent="applyEdit"
                  @keydown.escape.prevent="cancelEdit"
                />
              </div>

              <div class="flex justify-end gap-2 border-t pt-2">
                <UButton
                  label="Cancel"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  @click="cancelEdit"
                />
                <UButton label="Apply" color="primary" size="xs" @click="applyEdit" />
              </div>
            </div>
          </template>
        </UPopover>
      </div>
    </template>
  </NodeViewWrapper>
</template>
