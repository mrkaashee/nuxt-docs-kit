<script lang="ts" setup>
/**
 * EditDocVisualEditor
 *
 * The UEditor-based visual editing panel. Owns:
 *  - Bubble toolbar (text selection)
 *  - Table bubble toolbar (cursor inside table cell)
 *  - Slash-command suggestion menu
 *  - Emoji menu
 *  - Drag handle with block move / duplicate / delete
 *
 * The fixed toolbar is rendered by the parent (EditDocVisualToolbar) so it
 * spans the full width above both the editor and preview panes.
 */
import type { EditorCustomHandlers } from "@nuxt/ui"
import type { Editor } from "@tiptap/vue-3"

const props = defineProps<{
  modelValue: string
  extensions: any[]
  emojiItems: any[]
  suggestionItems: any[]
  handlers: EditorCustomHandlers
  baseClass: string
  isRtl: boolean
  editorProps?: Record<string, any>
}>()

const emit = defineEmits<{
  "update:modelValue": [value: string]
  save: []
  "editor-ready": [editor: any]
}>()

const selectedNode = ref<{ node: any; pos: number } | null>(null)

// Bubble toolbar items (text selection popup)
const bubbleItems = [
  [
    { kind: "mark", mark: "bold", icon: "i-lucide-bold", tooltip: { text: "Bold" } },
    { kind: "mark", mark: "italic", icon: "i-lucide-italic", tooltip: { text: "Italic" } },
    { kind: "mark", mark: "underline", icon: "i-lucide-underline", tooltip: { text: "Underline" } },
    {
      kind: "mark",
      mark: "strike",
      icon: "i-lucide-strikethrough",
      tooltip: { text: "Strikethrough" },
    },
    { kind: "mark", mark: "code", icon: "i-lucide-code", tooltip: { text: "Code" } },
  ],
  [{ kind: "link", icon: "i-lucide-link", tooltip: { text: "Link" } }],
  [
    {
      icon: "i-lucide-type",
      tooltip: { text: "Turn into" },
      content: { align: "start" },
      items: [
        { kind: "paragraph", icon: "i-lucide-type", label: "Paragraph" },
        { kind: "heading", level: 1, icon: "i-lucide-heading-1", label: "Heading 1" },
        { kind: "heading", level: 2, icon: "i-lucide-heading-2", label: "Heading 2" },
        { kind: "heading", level: 3, icon: "i-lucide-heading-3", label: "Heading 3" },
        { kind: "blockquote", icon: "i-lucide-quote", label: "Blockquote" },
        { kind: "codeBlock", icon: "i-lucide-square-code", label: "Code Block" },
      ],
    },
  ],
]

// ── Table toolbar ─────────────────────────────────────────────────────────────
// Shown as a floating toolbar whenever the cursor is inside a table cell.
// Uses UEditorToolbar layout="bubble" with a custom shouldShow that checks
// for table context instead of a text selection.
function makeTableItems(editor: any) {
  return [
    [
      {
        icon: "i-lucide-table",
        tooltip: { text: "Table" },
        content: { align: "start" },
        items: [
          {
            label: "Add column before",
            icon: "i-lucide-between-horizontal-start",
            onSelect: () => editor.chain().focus().addColumnBefore().run(),
          },
          {
            label: "Add column after",
            icon: "i-lucide-between-horizontal-end",
            onSelect: () => editor.chain().focus().addColumnAfter().run(),
          },
          {
            label: "Delete column",
            icon: "i-lucide-columns-3",
            onSelect: () => editor.chain().focus().deleteColumn().run(),
          },
        ],
      },
    ],
    [
      {
        icon: "i-lucide-rows-3",
        tooltip: { text: "Row" },
        content: { align: "start" },
        items: [
          {
            label: "Add row above",
            icon: "i-lucide-between-vertical-start",
            onSelect: () => editor.chain().focus().addRowBefore().run(),
          },
          {
            label: "Add row below",
            icon: "i-lucide-between-vertical-end",
            onSelect: () => editor.chain().focus().addRowAfter().run(),
          },
          {
            label: "Delete row",
            icon: "i-lucide-trash",
            onSelect: () => editor.chain().focus().deleteRow().run(),
          },
        ],
      },
    ],
    [
      {
        icon: "i-lucide-x",
        tooltip: { text: "Delete table" },
        content: { align: "start" },
        items: [
          {
            label: "Delete table",
            icon: "i-lucide-trash-2",
            color: "error" as const,
            onSelect: () => editor.chain().focus().deleteTable().run(),
          },
        ],
      },
    ],
  ]
}

// Expose the UEditor component ref so the parent can access editor via uEditorRef.editor
const uEditorRef = ref<{ editor: any } | null>(null)

// Watch for the editor becoming available and emit it up
watch(
  () => uEditorRef.value?.editor,
  (e) => emit("editor-ready", e ?? null),
  { immediate: true },
)

defineExpose({ uEditorRef })
</script>

<template>
  <UEditor
    ref="uEditorRef"
    v-slot="{ editor }"
    :model-value="modelValue"
    content-type="markdown"
    :extensions="extensions"
    :starter-kit="{
      codeBlock: false,
      link: { HTMLAttributes: { target: null, rel: null, class: null } },
    }"
    :mention="false"
    :placeholder="{
      placeholder: 'Start writing… (type / for commands)',
      mode: 'firstLine',
    }"
    :text-direction="isRtl ? 'rtl' : 'ltr'"
    :handlers="handlers"
    :editor-props="editorProps"
    :ui="{ base: baseClass }"
    class="flex flex-col"
    @update:model-value="emit('update:modelValue', $event)"
    @keydown.ctrl.s.prevent="emit('save')"
    @keydown.meta.s.prevent="emit('save')"
  >
    <!-- Slash-command menu -->
    <UEditorSuggestionMenu :editor="editor" :items="suggestionItems" />

    <!-- Bubble toolbar (text selection) -->
    <UEditorToolbar
      :editor="editor"
      layout="bubble"
      :should-show="
        ({ editor: e, view, state }) => {
          const { selection } = state
          return view.hasFocus() && !selection.empty && !e.isActive('image')
        }
      "
      :items="bubbleItems"
    />

    <!-- Table bubble toolbar — shown whenever cursor is inside a table cell -->
    <UEditorToolbar
      :editor="editor"
      layout="bubble"
      :should-show="({ editor: e }) => e.isActive('tableCell') || e.isActive('tableHeader')"
      :items="makeTableItems(editor)"
    />

    <!-- Emoji menu -->
    <UEditorEmojiMenu :editor="editor" :items="emojiItems" />

    <!-- Drag handle -->
    <UEditorDragHandle
      v-slot="{ ui, onClick }"
      :editor="editor"
      :options="{ flip: false }"
      @node-change="selectedNode = $event"
    >
      <!-- Plus button — inserts a new paragraph after the block -->
      <UButton
        icon="i-lucide-plus"
        color="neutral"
        variant="ghost"
        size="sm"
        :class="ui.handle()"
        tabindex="-1"
        @mousedown.prevent
        @pointerdown.prevent
        @dblclick.stop.prevent
        @click.stop="
          () => {
            const sel = onClick()
            if (sel)
              editor
                .chain()
                .focus()
                .insertContentAt(sel.pos + (editor.state.doc.nodeAt(sel.pos)?.nodeSize ?? 1), {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '/' }],
                })
                .run()
          }
        "
      />

      <!-- Grip button — block context menu -->
      <UDropdownMenu
        v-slot="{ open }"
        :modal="false"
        :content="{ side: 'left' }"
        :ui="{ content: 'w-44', label: 'text-xs' }"
        :items="
          selectedNode
            ? [
                [{ type: 'label', label: selectedNode.node?.type ?? 'Block' }],
                [
                  {
                    label: 'Move up',
                    icon: 'i-lucide-arrow-up',
                    disabled: (() => {
                      if (!selectedNode) return true
                      const $p = editor.state.doc.resolve(selectedNode.pos)
                      return $p.index() === 0
                    })(),
                    onSelect: () => {
                      if (!selectedNode) return
                      const node = editor.state.doc.nodeAt(selectedNode.pos)
                      if (!node) return
                      const $p = editor.state.doc.resolve(selectedNode.pos)
                      const idx = $p.index()
                      if (idx === 0) return
                      editor
                        .chain()
                        .focus()
                        .deleteRange({
                          from: selectedNode.pos,
                          to: selectedNode.pos + node.nodeSize,
                        })
                        .insertContentAt(
                          selectedNode.pos - $p.parent.child(idx - 1).nodeSize,
                          node.toJSON(),
                        )
                        .run()
                    },
                  },
                  {
                    label: 'Move down',
                    icon: 'i-lucide-arrow-down',
                    disabled: (() => {
                      if (!selectedNode) return true
                      const $p = editor.state.doc.resolve(selectedNode.pos)
                      return $p.index() >= $p.parent.childCount - 1
                    })(),
                    onSelect: () => {
                      if (!selectedNode) return
                      const node = editor.state.doc.nodeAt(selectedNode.pos)
                      if (!node) return
                      const $p = editor.state.doc.resolve(selectedNode.pos)
                      const idx = $p.index()
                      if (idx >= $p.parent.childCount - 1) return
                      editor
                        .chain()
                        .focus()
                        .deleteRange({
                          from: selectedNode.pos,
                          to: selectedNode.pos + node.nodeSize,
                        })
                        .insertContentAt(
                          selectedNode.pos + $p.parent.child(idx + 1).nodeSize,
                          node.toJSON(),
                        )
                        .run()
                    },
                  },
                ],
                [
                  {
                    label: 'Duplicate',
                    icon: 'i-lucide-copy',
                    onSelect: () => {
                      if (!selectedNode) return
                      const node = editor.state.doc.nodeAt(selectedNode.pos)
                      if (!node) return
                      editor
                        .chain()
                        .focus()
                        .insertContentAt(selectedNode.pos + node.nodeSize, node.toJSON())
                        .run()
                    },
                  },
                  {
                    label: 'Delete',
                    icon: 'i-lucide-trash',
                    color: 'error' as const,
                    onSelect: () => {
                      if (!selectedNode) return
                      const node = editor.state.doc.nodeAt(selectedNode.pos)
                      if (!node) return
                      editor
                        .chain()
                        .focus()
                        .deleteRange({
                          from: selectedNode.pos,
                          to: selectedNode.pos + node.nodeSize,
                        })
                        .run()
                    },
                  },
                ],
              ]
            : []
        "
        @update:open="editor.chain().setMeta('lockDragHandle', $event).run()"
      >
        <UButton
          color="neutral"
          variant="ghost"
          active-variant="soft"
          size="sm"
          icon="i-lucide-grip-vertical"
          :active="open"
          :class="ui.handle()"
          tabindex="-1"
          @focus="(e: any) => e.target.blur()"
          @dblclick.stop.prevent
        />
      </UDropdownMenu>
    </UEditorDragHandle>
  </UEditor>
</template>
