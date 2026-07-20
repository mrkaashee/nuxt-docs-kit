<script setup lang="ts">
import { NodeViewWrapper, NodeViewContent } from "@tiptap/vue-3"

const props = defineProps<{
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
  selected: boolean
  editor: any
  deleteNode: () => void
  getPos: () => number
}>()

const tag = computed(() => props.node.attrs.tag as string)
const nodeProps = computed(() => (props.node.attrs.props ?? {}) as Record<string, string>)

// ── Card group: add a new card child ─────────────────────────────────────────
function addCard() {
  if (!props.editor) return
  const { state } = props.editor
  const nodePos = props.getPos()
  if (nodePos === undefined) return

  const { doc, tr, schema } = state

  // card-group: element(card-group) → slot(default) → [card...]
  // The slot starts at nodePos+1 (skip element open token).
  // Insert before slot's closing token = slotStart + slotSize - 1.
  const firstChild = props.node.firstChild
  let insertPos: number
  if (firstChild && firstChild.type.name === "slot") {
    const slotStart = nodePos + 1 // slot is first child, offset 0 inside element
    insertPos = slotStart + firstChild.nodeSize - 1
  } else {
    // Flat structure fallback: insert before element closing token
    insertPos = nodePos + props.node.nodeSize - 1
  }

  if (insertPos < 0 || insertPos > doc.content.size) return

  const newSlot = (schema.nodes as any).slot.create({ name: "default" }, [
    schema.nodes.paragraph!.create(null, schema.text("Card content here.")),
  ])
  const cardNode = schema.nodes.element!.create(
    { tag: "card", props: { title: "New card", icon: "i-lucide-star" } },
    [newSlot],
  )
  props.editor.view.dispatch(tr.insert(insertPos, cardNode))
}

// ── Component definitions ─────────────────────────────────────────────────────

interface PropField {
  key: string
  label: string
  type: "text" | "select" | "boolean"
  options?: string[]
  placeholder?: string
}

interface ComponentDef {
  label: string
  icon: string
  fields: PropField[]
  slots?: string[]
  noContent?: boolean
}

const COLORS = ["primary", "secondary", "info", "success", "warning", "error", "neutral"]
const VARIANTS = ["solid", "outline", "soft", "subtle", "ghost", "link"]
const SIZES = ["xs", "sm", "md", "lg", "xl"]
const ICONS = [
  "i-lucide-info",
  "i-lucide-triangle-alert",
  "i-lucide-circle-check",
  "i-lucide-circle-x",
  "i-lucide-star",
  "i-lucide-bolt",
  "i-lucide-book-open",
  "i-lucide-lightbulb",
  "i-lucide-flame",
  "i-lucide-zap",
  "i-lucide-heart",
  "i-lucide-rocket",
  "i-lucide-shield",
  "i-lucide-globe",
  "i-lucide-code",
  "i-lucide-terminal",
  "i-lucide-layers",
  "i-lucide-cpu",
  "i-lucide-database",
]

const COMPONENTS: Record<string, ComponentDef> = {
  // ── Prose components (from @nuxt/ui content) ──────────────────────────────
  badge: {
    label: "Badge",
    icon: "i-lucide-tag",
    fields: [],
  },
  callout: {
    label: "Callout",
    icon: "i-lucide-info",
    fields: [
      { key: "icon", label: "Icon", type: "select", options: ICONS },
      { key: "color", label: "Color", type: "select", options: COLORS },
      { key: "to", label: "Link URL", type: "text", placeholder: "https://..." },
      { key: "target", label: "Target", type: "select", options: ["_blank", "_self"] },
    ],
  },
  card: {
    label: "Card (prose)",
    icon: "i-lucide-square",
    slots: ["title"],
    fields: [
      { key: "title", label: "Title", type: "text", placeholder: "Card title" },
      { key: "description", label: "Description", type: "text", placeholder: "Card description" },
      { key: "icon", label: "Icon", type: "select", options: ICONS },
      { key: "color", label: "Color", type: "select", options: COLORS },
      { key: "to", label: "Link URL", type: "text", placeholder: "https://..." },
      { key: "target", label: "Target", type: "select", options: ["_blank", "_self"] },
    ],
  },
  "card-group": {
    label: "Card Group",
    icon: "i-lucide-layout-grid",
    fields: [],
  },
  steps: {
    label: "Steps",
    icon: "i-lucide-list-ordered",
    fields: [],
  },
  tabs: {
    label: "Tabs",
    icon: "i-lucide-panel-top",
    fields: [],
  },
  // ── Nuxt UI components ────────────────────────────────────────────────────
  "u-button": {
    label: "Button",
    icon: "i-lucide-mouse-pointer-click",
    noContent: true,
    fields: [
      { key: "label", label: "Label", type: "text", placeholder: "Click me" },
      { key: "color", label: "Color", type: "select", options: COLORS },
      { key: "variant", label: "Variant", type: "select", options: VARIANTS },
      { key: "size", label: "Size", type: "select", options: SIZES },
      { key: "icon", label: "Icon", type: "select", options: ICONS },
      { key: "trailing-icon", label: "Trailing icon", type: "select", options: ICONS },
      { key: "to", label: "Link URL", type: "text", placeholder: "https://..." },
      { key: "target", label: "Target", type: "select", options: ["_blank", "_self"] },
      { key: "disabled", label: "Disabled", type: "boolean" },
      { key: "block", label: "Block", type: "boolean" },
    ],
  },
  "u-card": {
    label: "Card (UCard)",
    icon: "i-lucide-credit-card",
    slots: ["header", "title", "description", "footer"],
    fields: [
      { key: "title", label: "Title", type: "text", placeholder: "Card title" },
      { key: "description", label: "Description", type: "text", placeholder: "Card description" },
      {
        key: "variant",
        label: "Variant",
        type: "select",
        options: ["solid", "outline", "soft", "subtle", "ghost"],
      },
    ],
  },
  "u-page-card": {
    label: "Card (UPageCard)",
    icon: "i-lucide-layout-panel-top",
    slots: ["header", "leading", "body", "title", "description", "footer"],
    fields: [
      { key: "title", label: "Title", type: "text", placeholder: "Card title" },
      { key: "description", label: "Description", type: "text", placeholder: "Card description" },
      { key: "icon", label: "Icon", type: "select", options: ICONS },
      {
        key: "orientation",
        label: "Orientation",
        type: "select",
        options: ["vertical", "horizontal"],
      },
      {
        key: "variant",
        label: "Variant",
        type: "select",
        options: ["solid", "outline", "soft", "subtle", "ghost"],
      },
      { key: "to", label: "Link URL", type: "text", placeholder: "https://..." },
      { key: "target", label: "Target", type: "select", options: ["_blank", "_self"] },
      { key: "highlight", label: "Highlight", type: "boolean" },
      { key: "spotlight", label: "Spotlight", type: "boolean" },
      { key: "reverse", label: "Reverse", type: "boolean" },
    ],
  },
  "u-alert": {
    label: "Alert",
    icon: "i-lucide-bell",
    noContent: true,
    fields: [
      { key: "title", label: "Title", type: "text", placeholder: "Alert title" },
      { key: "description", label: "Description", type: "text", placeholder: "Alert description" },
      { key: "icon", label: "Icon", type: "select", options: ICONS },
      { key: "color", label: "Color", type: "select", options: COLORS },
      {
        key: "variant",
        label: "Variant",
        type: "select",
        options: ["solid", "outline", "soft", "subtle"],
      },
    ],
  },
  "u-badge": {
    label: "Badge (UBadge)",
    icon: "i-lucide-tag",
    noContent: true,
    fields: [
      { key: "label", label: "Label", type: "text", placeholder: "Badge text" },
      { key: "color", label: "Color", type: "select", options: COLORS },
      {
        key: "variant",
        label: "Variant",
        type: "select",
        options: ["solid", "outline", "soft", "subtle"],
      },
      { key: "size", label: "Size", type: "select", options: SIZES },
      { key: "icon", label: "Icon", type: "select", options: ICONS },
    ],
  },
  "u-avatar": {
    label: "Avatar",
    icon: "i-lucide-user-circle",
    noContent: true,
    fields: [
      { key: "src", label: "Image URL", type: "text", placeholder: "https://..." },
      { key: "alt", label: "Alt text", type: "text", placeholder: "User name" },
      {
        key: "size",
        label: "Size",
        type: "select",
        options: ["3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl"],
      },
      { key: "icon", label: "Fallback icon", type: "select", options: ICONS },
    ],
  },
  "u-kbd": {
    label: "Kbd",
    icon: "i-lucide-keyboard",
    fields: [
      { key: "value", label: "Key", type: "text", placeholder: "⌘K" },
      { key: "size", label: "Size", type: "select", options: SIZES },
    ],
  },
  "u-separator": {
    label: "Separator",
    icon: "i-lucide-minus",
    noContent: true,
    fields: [
      { key: "label", label: "Label", type: "text", placeholder: "or" },
      { key: "icon", label: "Icon", type: "select", options: ICONS },
      { key: "color", label: "Color", type: "select", options: COLORS },
      { key: "type", label: "Type", type: "select", options: ["solid", "dashed", "dotted"] },
      {
        key: "orientation",
        label: "Orientation",
        type: "select",
        options: ["horizontal", "vertical"],
      },
    ],
  },
  "u-progress": {
    label: "Progress",
    icon: "i-lucide-loader",
    noContent: true,
    fields: [
      { key: "value", label: "Value (0-100)", type: "text", placeholder: "75" },
      { key: "color", label: "Color", type: "select", options: COLORS },
      { key: "size", label: "Size", type: "select", options: SIZES },
      {
        key: "animation",
        label: "Animation",
        type: "select",
        options: ["carousel", "carousel-inverse", "swing", "elastic"],
      },
    ],
  },
  "u-collapsible": {
    label: "Collapsible",
    icon: "i-lucide-chevrons-up-down",
    slots: ["default", "content"],
    fields: [{ key: "default-open", label: "Open by default", type: "boolean" }],
  },
  "u-accordion": {
    label: "Accordion",
    icon: "i-lucide-chevrons-up-down",
    fields: [
      { key: "color", label: "Color", type: "select", options: COLORS },
      {
        key: "variant",
        label: "Variant",
        type: "select",
        options: ["solid", "outline", "soft", "subtle", "ghost"],
      },
      { key: "size", label: "Size", type: "select", options: SIZES },
    ],
  },
  "u-carousel": {
    label: "Carousel",
    icon: "i-lucide-gallery-horizontal",
    fields: [
      { key: "arrows", label: "Show arrows", type: "boolean" },
      { key: "dots", label: "Show dots", type: "boolean" },
      {
        key: "orientation",
        label: "Orientation",
        type: "select",
        options: ["horizontal", "vertical"],
      },
    ],
  },
  "u-timeline": {
    label: "Timeline",
    icon: "i-lucide-git-branch",
    fields: [
      { key: "color", label: "Color", type: "select", options: COLORS },
      { key: "size", label: "Size", type: "select", options: SIZES },
    ],
  },
  "u-user": {
    label: "User",
    icon: "i-lucide-user",
    noContent: true,
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "John Doe" },
      { key: "description", label: "Description", type: "text", placeholder: "Software Engineer" },
      { key: "to", label: "Link URL", type: "text", placeholder: "https://..." },
    ],
  },
  "u-empty": {
    label: "Empty State",
    icon: "i-lucide-inbox",
    slots: ["icon", "title", "description"],
    fields: [
      { key: "icon", label: "Icon", type: "select", options: ICONS },
      { key: "title", label: "Title", type: "text", placeholder: "No results" },
      {
        key: "description",
        label: "Description",
        type: "text",
        placeholder: "Try adjusting your search",
      },
    ],
  },
  "u-banner": {
    label: "Banner",
    icon: "i-lucide-megaphone",
    fields: [
      { key: "icon", label: "Icon", type: "select", options: ICONS },
      { key: "color", label: "Color", type: "select", options: COLORS },
      { key: "to", label: "Link URL", type: "text", placeholder: "https://..." },
      { key: "close", label: "Closable", type: "boolean" },
    ],
  },
  // ── Marketing / page components ───────────────────────────────────────────
  "u-page-section": {
    label: "Page Section",
    icon: "i-lucide-layout-template",
    slots: ["headline", "title", "description", "links"],
    fields: [
      { key: "headline", label: "Headline", type: "text", placeholder: "Features" },
      { key: "title", label: "Title", type: "text", placeholder: "Section title" },
      {
        key: "description",
        label: "Description",
        type: "text",
        placeholder: "Section description",
      },
      {
        key: "orientation",
        label: "Orientation",
        type: "select",
        options: ["vertical", "horizontal"],
      },
      { key: "reverse", label: "Reverse", type: "boolean" },
    ],
  },
  "u-page-hero": {
    label: "Page Hero",
    icon: "i-lucide-sparkles",
    slots: ["headline", "title", "description", "links"],
    fields: [
      { key: "headline", label: "Headline", type: "text", placeholder: "Introducing" },
      { key: "title", label: "Title", type: "text", placeholder: "Hero title" },
      { key: "description", label: "Description", type: "text", placeholder: "Hero description" },
      {
        key: "orientation",
        label: "Orientation",
        type: "select",
        options: ["vertical", "horizontal"],
      },
    ],
  },
  "u-page-feature": {
    label: "Page Feature",
    icon: "i-lucide-zap",
    slots: ["leading", "title", "description"],
    fields: [
      { key: "icon", label: "Icon", type: "select", options: ICONS },
      { key: "title", label: "Title", type: "text", placeholder: "Feature title" },
      {
        key: "description",
        label: "Description",
        type: "text",
        placeholder: "Feature description",
      },
      { key: "to", label: "Link URL", type: "text", placeholder: "https://..." },
    ],
  },
  "u-page-cta": {
    label: "Page CTA",
    icon: "i-lucide-megaphone",
    slots: ["title", "description", "links"],
    fields: [
      { key: "title", label: "Title", type: "text", placeholder: "CTA title" },
      { key: "description", label: "Description", type: "text", placeholder: "CTA description" },
      {
        key: "variant",
        label: "Variant",
        type: "select",
        options: ["solid", "outline", "soft", "subtle", "ghost"],
      },
      { key: "color", label: "Color", type: "select", options: COLORS },
    ],
  },
  "u-pricing-plan": {
    label: "Pricing Plan",
    icon: "i-lucide-credit-card",
    slots: ["title", "description", "features", "button"],
    fields: [
      { key: "title", label: "Title", type: "text", placeholder: "Pro" },
      { key: "description", label: "Description", type: "text", placeholder: "For teams" },
      { key: "price", label: "Price", type: "text", placeholder: "$29" },
      { key: "billing", label: "Billing", type: "text", placeholder: "per month" },
      { key: "highlight", label: "Highlight", type: "boolean" },
      { key: "button", label: "Button label", type: "text", placeholder: "Get started" },
    ],
  },
  "u-blog-post": {
    label: "Blog Post",
    icon: "i-lucide-newspaper",
    noContent: true,
    fields: [
      { key: "title", label: "Title", type: "text", placeholder: "Post title" },
      { key: "description", label: "Description", type: "text", placeholder: "Post description" },
      { key: "date", label: "Date", type: "text", placeholder: "2024-01-01" },
      { key: "to", label: "Link URL", type: "text", placeholder: "https://..." },
      { key: "image", label: "Image URL", type: "text", placeholder: "https://..." },
    ],
  },
}

const def = computed<ComponentDef>(
  () => COMPONENTS[tag.value] ?? { label: tag.value, icon: "i-lucide-layout-template", fields: [] },
)

// ── Callout WYSIWYG ───────────────────────────────────────────────────────────

const isCallout = computed(() => tag.value === "callout" || tag.value === "note")
const isCard = computed(() => tag.value === "card")
const isCardGroup = computed(() => tag.value === "card-group")
const isSteps = computed(() => tag.value === "steps")
const isButton = computed(() => tag.value === "u-button")
const isBadge = computed(() => tag.value === "badge")
const isTabs = computed(() => tag.value === "tabs")
const isTabsItem = computed(() => tag.value === "tabs-item")

// ── Tabs WYSIWYG ──────────────────────────────────────────────────────────────

/** Extract tab labels from child slot nodes */
const tabLabels = computed<string[]>(() => {
  const labels: string[] = []
  props.node.forEach((child: any) => {
    if (child.type.name === "slot") {
      // slots contain element children (tabs-item nodes)
      child.forEach((item: any) => {
        if (item.type.name === "element" && item.attrs?.tag === "tabs-item") {
          labels.push(item.attrs?.props?.label ?? "Tab")
        }
      })
    }
  })
  return labels.length ? labels : ["Tab"]
})

const activeTabIndex = ref(0)

const CALLOUT_TYPES = [
  { label: "Info", color: "info", icon: "i-lucide-info" },
  { label: "Success", color: "success", icon: "i-lucide-circle-check" },
  { label: "Warning", color: "warning", icon: "i-lucide-triangle-alert" },
  { label: "Error", color: "error", icon: "i-lucide-circle-x" },
  { label: "Tip", color: "primary", icon: "i-lucide-lightbulb" },
  { label: "Note", color: "neutral", icon: "i-lucide-pencil" },
] as const

const activeCalloutType = computed(
  () => CALLOUT_TYPES.find((t) => t.color === nodeProps.value.color) ?? CALLOUT_TYPES[0],
)

function setCalloutType(type: (typeof CALLOUT_TYPES)[number]) {
  props.updateAttributes({ props: { ...nodeProps.value, color: type.color, icon: type.icon } })
}

// Color class map — matches NuxtUI prose/callout theme (static for Tailwind scanner)
const CALLOUT_COLOR_CLASSES: Record<string, { base: string; icon: string }> = {
  primary: {
    base: "border border-primary/25 bg-primary/10 text-primary-600 dark:text-primary-300",
    icon: "text-primary",
  },
  secondary: {
    base: "border border-secondary/25 bg-secondary/10 text-secondary-600 dark:text-secondary-300",
    icon: "text-secondary",
  },
  info: {
    base: "border border-info/25 bg-info/10 text-info-600 dark:text-info-300",
    icon: "text-info",
  },
  success: {
    base: "border border-success/25 bg-success/10 text-success-600 dark:text-success-300",
    icon: "text-success",
  },
  warning: {
    base: "border border-warning/25 bg-warning/10 text-warning-600 dark:text-warning-300",
    icon: "text-warning",
  },
  error: {
    base: "border border-error/25 bg-error/10 text-error-600 dark:text-error-300",
    icon: "text-error",
  },
  neutral: {
    base: "border border-muted bg-muted text-default",
    icon: "text-highlighted",
  },
}

const calloutClasses = computed(() => {
  const color = nodeProps.value.color || "neutral"
  return CALLOUT_COLOR_CLASSES[color] ?? CALLOUT_COLOR_CLASSES.neutral!
})

const calloutIcon = computed(
  () => nodeProps.value.icon || activeCalloutType.value?.icon || "i-lucide-info",
)

const CALLOUT_ACTIVE_CLASSES: Record<string, string> = {
  primary: "bg-primary/20 text-primary",
  secondary: "bg-secondary/20 text-secondary",
  info: "bg-info/20 text-info",
  success: "bg-success/20 text-success",
  warning: "bg-warning/20 text-warning",
  error: "bg-error/20 text-error",
  neutral: "bg-muted text-highlighted",
}

const calloutControlsVisible = ref(false)

// ── Card WYSIWYG ──────────────────────────────────────────────────────────────

const cardControlsVisible = ref(false)

// Inline-editable title — syncs to nodeProps.title on blur/enter
const cardTitleEditing = ref(false)
const cardTitleDraft = ref("")

function startCardTitleEdit() {
  cardTitleDraft.value = nodeProps.value.title ?? ""
  cardTitleEditing.value = true
  nextTick(() => {
    const el = document.querySelector<HTMLElement>("[data-card-title-input]")
    el?.focus()
  })
}

function commitCardTitle() {
  props.updateAttributes({ props: { ...nodeProps.value, title: cardTitleDraft.value.trim() } })
  cardTitleEditing.value = false
}

const CARD_ICON_COLORS = ["primary", "secondary", "info", "success", "warning", "error", "neutral"]

// ── CardGroup WYSIWYG ─────────────────────────────────────────────────────────

const cardGroupControlsVisible = ref(false)

// ── Steps WYSIWYG ─────────────────────────────────────────────────────────────

const stepsControlsVisible = ref(false)

// ── Button WYSIWYG ────────────────────────────────────────────────────────────

const buttonControlsVisible = ref(false)

// ── Badge WYSIWYG ─────────────────────────────────────────────────────────────

const badgeControlsVisible = ref(false)

function addStep() {
  if (!props.editor) return
  const nodePos = props.getPos()
  if (nodePos === undefined) return
  const { state } = props.editor
  const { schema, tr } = state

  // steps: element → slot → [h3, p, h3, p, ...]
  const firstChild = props.node.firstChild
  if (!firstChild || firstChild.type.name !== "slot") return
  const slotStart = nodePos + 1
  const insertPos = slotStart + firstChild.nodeSize - 1
  const stepNumber = Math.floor(firstChild.childCount / 2) + 1

  const newHeading = schema.nodes.heading!.create({ level: 3 }, schema.text(`Step ${stepNumber}`))
  const newParagraph = schema.nodes.paragraph!.create(null, schema.text("Step description."))
  props.editor.view.dispatch(tr.insert(insertPos, [newHeading, newParagraph]))
}

// ── Button visual picker ──────────────────────────────────────────────────────

const BUTTON_COLORS = [
  "primary",
  "secondary",
  "neutral",
  "info",
  "success",
  "warning",
  "error",
] as const
const BUTTON_VARIANTS = ["solid", "outline", "soft", "subtle", "ghost"] as const

const buttonLabel = computed(() => nodeProps.value.label || "Button")

function selectButtonStyle(color: string, variant: string) {
  props.updateAttributes({ props: { ...nodeProps.value, color, variant } })
}

// ── Collapsible ───────────────────────────────────────────────────────────────
const collapsed = ref(def.value.noContent ?? false)

// ── Props popover ─────────────────────────────────────────────────────────────
const popoverOpen = ref(false)
const editingProps = ref<Record<string, string>>({})

const knownKeys = computed(() => new Set(def.value.fields.map((f) => f.key)))
const extraProps = computed(() =>
  Object.entries(nodeProps.value).filter(([k]) => !knownKeys.value.has(k)),
)
const newPropKey = ref("")
const newPropValue = ref("")

function openPopover() {
  editingProps.value = { ...nodeProps.value }
  popoverOpen.value = true
}

function applyProps() {
  const cleaned: Record<string, string> = {}
  for (const [k, v] of Object.entries(editingProps.value)) {
    if (v && v.trim() && v !== "__none__") cleaned[k] = v.trim()
  }
  props.updateAttributes({ props: cleaned })
  popoverOpen.value = false
}

function addCustomProp() {
  const k = newPropKey.value.trim()
  const v = newPropValue.value.trim()
  if (!k) return
  editingProps.value = { ...editingProps.value, [k]: v }
  newPropKey.value = ""
  newPropValue.value = ""
}

function removeCustomProp(key: string) {
  const updated = { ...editingProps.value }
  delete updated[key]
  editingProps.value = updated
}

watch(
  () => props.selected,
  (sel) => {
    if (!sel) popoverOpen.value = false
  },
)

// ── Named slots ───────────────────────────────────────────────────────────────
const availableSlots = computed(() => {
  if (!def.value.slots?.length) return []
  const existing = new Set<string>()
  props.node.forEach((child: any) => {
    if (child.type.name === "slot" && child.attrs.name !== "default") {
      existing.add(child.attrs.name)
    }
  })
  return def.value.slots.filter((s) => s !== "default" && !existing.has(s))
})

function addSlot(slotName: string) {
  if (!props.editor) return
  const { state } = props.editor
  const nodePos = props.getPos()
  if (nodePos === undefined) return
  const insertPos = nodePos + props.node.nodeSize - 1
  const slotNode = (state.schema.nodes as any).slot?.create({ name: slotName }, [
    state.schema.nodes.paragraph.create(),
  ])
  if (!slotNode) return
  props.editor.view.dispatch(state.tr.insert(insertPos, slotNode))
}
</script>

<template>
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- WYSIWYG callout render — matches NuxtUI prose/callout exactly         -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <NodeViewWrapper
    v-if="isCallout"
    class="group relative my-5"
    :class="{ 'ring-primary/40 rounded-md ring-2 ring-offset-2': selected }"
    @mouseenter="calloutControlsVisible = true"
    @mouseleave="calloutControlsVisible = false"
  >
    <!-- Callout shell — replicates ProseCallout visually.
         NodeViewContent renders a div, so editor-callout-content CSS uses
         display:contents on all tiptap wrappers to make the <p> flow
         inline after the icon, matching the preview exactly. -->
    <div
      class="group relative block rounded-md px-4 py-3 text-sm/6 transition-colors"
      :class="calloutClasses.base"
    >
      <UIcon
        :name="calloutIcon"
        class="me-2 inline-block size-4 shrink-0 align-sub transition-colors"
        :class="calloutClasses.icon"
        contenteditable="false"
      />
      <NodeViewContent class="editor-callout-content outline-none" />
    </div>

    <!-- Floating controls — fade in on hover / select -->
    <div
      class="absolute -top-3 right-2 z-20 flex items-center gap-1 transition-opacity duration-150"
      :class="
        calloutControlsVisible || selected || popoverOpen
          ? 'opacity-100'
          : 'pointer-events-none opacity-0'
      "
      contenteditable="false"
    >
      <!-- Type quick-switcher pills -->
      <div
        class="bg-default border-default flex items-center gap-0.5 rounded-full border px-1 py-0.5 shadow-sm"
      >
        <UTooltip v-for="type in CALLOUT_TYPES" :key="type.color" :text="type.label">
          <button
            class="rounded-full p-1 transition-colors"
            :class="
              activeCalloutType?.color === type.color
                ? CALLOUT_ACTIVE_CLASSES[type.color]
                : 'text-muted hover:text-foreground hover:bg-muted'
            "
            @click.stop="setCalloutType(type)"
          >
            <UIcon :name="type.icon" class="size-3" />
          </button>
        </UTooltip>
      </div>

      <!-- Delete -->
      <UTooltip text="Delete">
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="xs"
          :padded="false"
          class="bg-default border-default h-6 w-6 rounded-full border shadow-sm"
          @click.stop="deleteNode()"
        />
      </UTooltip>
    </div>
  </NodeViewWrapper>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- WYSIWYG card-group render                                             -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <NodeViewWrapper
    v-else-if="isCardGroup"
    class="relative my-5"
    :class="{ 'ring-primary/40 rounded-md ring-2 ring-offset-2': selected }"
    @mouseenter="cardGroupControlsVisible = true"
    @mouseleave="cardGroupControlsVisible = false"
  >
    <!-- Use the real ProseCardGroup so the grid is always identical to the reader -->
    <ProseCardGroup>
      <NodeViewContent class="editor-cardgroup-content" />
    </ProseCardGroup>

    <!-- Controls bar — absolutely positioned below the grid so it never
         occupies space in the document flow -->
    <div
      class="absolute right-0 -bottom-8 flex items-center gap-1 transition-opacity duration-150"
      :class="
        cardGroupControlsVisible || selected ? 'opacity-100' : 'pointer-events-none opacity-0'
      "
      contenteditable="false"
    >
      <UButton
        icon="i-lucide-plus"
        label="Add card"
        color="primary"
        variant="soft"
        size="xs"
        @click.stop="addCard"
      />
      <UButton
        icon="i-lucide-trash-2"
        label="Delete group"
        color="error"
        variant="ghost"
        size="xs"
        @click.stop="deleteNode()"
      />
    </div>
  </NodeViewWrapper>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- WYSIWYG card render                                                   -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <NodeViewWrapper
    v-else-if="isCard"
    class="group relative"
    :class="{ 'ring-primary/40 rounded-md ring-2 ring-offset-1': selected }"
    @mouseenter="cardControlsVisible = true"
    @mouseleave="cardControlsVisible = false"
  >
    <!--
      Use the real ProseCard component so icon / title / description spacing
      is byte-for-byte identical to the reader preview.
      We override the title slot with an inline-editable input.
    -->
    <ProseCard
      :icon="nodeProps.icon || undefined"
      :color="nodeProps.color || undefined"
      :title="nodeProps.title || ' '"
    >
      <!-- Editable title slot -->
      <template #title>
        <input
          v-if="cardTitleEditing"
          v-model="cardTitleDraft"
          data-card-title-input
          class="text-highlighted w-full bg-transparent font-semibold outline-none"
          placeholder="Card title"
          @blur="commitCardTitle"
          @keydown.enter.prevent="commitCardTitle"
          @keydown.escape.prevent="cardTitleEditing = false"
          @mousedown.stop
        />
        <span
          v-else
          class="cursor-text transition-opacity hover:opacity-70"
          :class="nodeProps.title ? '' : 'text-muted font-normal italic'"
          @click.stop="startCardTitleEdit"
          contenteditable="false"
        >
          {{ nodeProps.title || "Card title" }}
        </span>
      </template>

      <!-- Editable body — all wrappers collapse via display:contents in main.css -->
      <NodeViewContent class="editor-card-content outline-none" />
    </ProseCard>

    <!-- Floating controls -->
    <div
      class="absolute -top-3 right-2 z-20 flex items-center gap-1 transition-opacity duration-150"
      :class="
        cardControlsVisible || selected || popoverOpen
          ? 'opacity-100'
          : 'pointer-events-none opacity-0'
      "
      contenteditable="false"
    >
      <!-- Props (icon, color, link) -->
      <UPopover v-model:open="popoverOpen" :ui="{ content: 'focus:outline-none' }">
        <UTooltip text="Edit card">
          <UButton
            icon="i-lucide-sliders-horizontal"
            color="neutral"
            variant="ghost"
            size="xs"
            :padded="false"
            class="bg-default border-default h-6 w-6 rounded-full border shadow-sm"
            @click.stop="openPopover"
          />
        </UTooltip>
        <template #content>
          <div class="w-64 space-y-3 p-3" @mousedown.stop @click.stop>
            <p class="text-xs font-semibold">Card props</p>
            <div class="space-y-1">
              <label class="text-muted block text-[10px] font-medium tracking-wider uppercase"
                >Icon</label
              >
              <USelect
                v-model="editingProps['icon']"
                :items="[
                  { label: '— none —', value: '__none__' },
                  ...ICONS.map((i) => ({ label: i, value: i })),
                ]"
                value-key="value"
                label-key="label"
                size="xs"
                class="w-full"
              />
            </div>
            <div class="space-y-1">
              <label class="text-muted block text-[10px] font-medium tracking-wider uppercase"
                >Color</label
              >
              <USelect
                v-model="editingProps['color']"
                :items="[
                  { label: '— none —', value: '__none__' },
                  ...CARD_ICON_COLORS.map((c) => ({ label: c, value: c })),
                ]"
                value-key="value"
                label-key="label"
                size="xs"
                class="w-full"
              />
            </div>
            <div class="space-y-1">
              <label class="text-muted block text-[10px] font-medium tracking-wider uppercase"
                >Link URL</label
              >
              <UInput
                v-model="editingProps['to']"
                placeholder="https://..."
                size="xs"
                class="w-full"
              />
            </div>
            <div class="flex justify-end gap-2 border-t pt-2">
              <UButton
                label="Cancel"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="popoverOpen = false"
              />
              <UButton label="Apply" color="primary" size="xs" @click="applyProps" />
            </div>
          </div>
        </template>
      </UPopover>
      <!-- Delete -->
      <UTooltip text="Delete card">
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="xs"
          :padded="false"
          class="bg-default border-default h-6 w-6 rounded-full border shadow-sm"
          @click.stop="deleteNode()"
        />
      </UTooltip>
    </div>
  </NodeViewWrapper>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- WYSIWYG steps render                                                  -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <NodeViewWrapper
    v-else-if="isSteps"
    class="relative my-5"
    :class="{ 'ring-primary/40 rounded-md ring-2 ring-offset-2': selected }"
    @mouseenter="stepsControlsVisible = true"
    @mouseleave="stepsControlsVisible = false"
  >
    <!-- Steps shell — replicates ProseSteps with descendant selectors since
         tiptap wrapper divs prevent the [&>h3] child combinator from working -->
    <div class="editor-steps-shell border-default ms-4 border-s ps-8">
      <NodeViewContent class="editor-steps-content outline-none" />
    </div>

    <!-- Floating delete control -->
    <div
      class="absolute -top-3 right-2 z-20 flex items-center gap-1 transition-opacity duration-150"
      :class="stepsControlsVisible || selected ? 'opacity-100' : 'pointer-events-none opacity-0'"
      contenteditable="false"
    >
      <UTooltip text="Add step">
        <UButton
          icon="i-lucide-plus"
          color="primary"
          variant="soft"
          size="xs"
          class="h-6 rounded-full"
          @click.stop="addStep"
        />
      </UTooltip>
      <UTooltip text="Delete steps">
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="xs"
          :padded="false"
          class="bg-default border-default h-6 w-6 rounded-full border shadow-sm"
          @click.stop="deleteNode()"
        />
      </UTooltip>
    </div>
  </NodeViewWrapper>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- WYSIWYG UButton render                                                -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <NodeViewWrapper
    v-else-if="isButton"
    class="group relative my-4 inline-block"
    :class="{ 'ring-primary/40 rounded-md ring-2 ring-offset-2': selected }"
    @mouseenter="buttonControlsVisible = true"
    @mouseleave="buttonControlsVisible = false"
  >
    <!-- Live UButton preview — pointer-events-none so clicks open the popover -->
    <UButton
      :label="nodeProps.label || 'Button'"
      :color="(nodeProps.color as any) || 'primary'"
      :variant="(nodeProps.variant as any) || 'solid'"
      :icon="nodeProps.icon || undefined"
      :trailing-icon="nodeProps['trailing-icon'] || undefined"
      :size="(nodeProps.size as any) || 'md'"
      class="pointer-events-none select-none"
    />

    <!-- Hidden NodeViewContent (required by tiptap) -->
    <NodeViewContent class="hidden" />

    <!-- Floating controls -->
    <div
      class="absolute -top-3 right-0 z-20 flex items-center gap-1 transition-opacity duration-150"
      :class="
        buttonControlsVisible || selected || popoverOpen
          ? 'opacity-100'
          : 'pointer-events-none opacity-0'
      "
      contenteditable="false"
    >
      <UPopover v-model:open="popoverOpen" :ui="{ content: 'focus:outline-none' }">
        <UTooltip text="Edit button">
          <UButton
            icon="i-lucide-sliders-horizontal"
            color="neutral"
            variant="ghost"
            size="xs"
            :padded="false"
            class="bg-default border-default h-6 w-6 rounded-full border shadow-sm"
            @click.stop="openPopover"
          />
        </UTooltip>
        <template #content>
          <div class="w-64 space-y-3 p-3" @mousedown.stop @click.stop>
            <p class="text-xs font-semibold">Button props</p>
            <div v-for="field in def.fields" :key="field.key" class="space-y-1">
              <label class="text-muted block text-[10px] font-medium tracking-wider uppercase">
                {{ field.label }}
              </label>
              <USelect
                v-if="field.type === 'select'"
                v-model="editingProps[field.key]"
                :items="[
                  { label: '— none —', value: '__none__' },
                  ...(field.options ?? []).map((o) => ({ label: o, value: o })),
                ]"
                value-key="value"
                label-key="label"
                size="xs"
                class="w-full"
              />
              <UInput
                v-else
                v-model="editingProps[field.key]"
                :placeholder="field.placeholder"
                size="xs"
                class="w-full"
              />
            </div>
            <div class="flex justify-end gap-2 border-t pt-2">
              <UButton
                label="Cancel"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="popoverOpen = false"
              />
              <UButton label="Apply" color="primary" size="xs" @click="applyProps" />
            </div>
          </div>
        </template>
      </UPopover>
      <UTooltip text="Delete">
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="xs"
          :padded="false"
          class="bg-default border-default h-6 w-6 rounded-full border shadow-sm"
          @click.stop="deleteNode()"
        />
      </UTooltip>
    </div>
  </NodeViewWrapper>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- WYSIWYG Badge render                                                  -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <NodeViewWrapper
    v-else-if="isBadge"
    as="span"
    class="group relative inline-block align-middle"
    :class="{ 'ring-primary/40 rounded-full ring-2 ring-offset-1': selected }"
    @mouseenter="badgeControlsVisible = true"
    @mouseleave="badgeControlsVisible = false"
  >
    <!-- ProseBadge shell — slot content is the editable text -->
    <UBadge color="primary" variant="subtle" class="rounded-full">
      <NodeViewContent class="editor-badge-content outline-none" style="white-space: normal" />
    </UBadge>

    <!-- Floating delete -->
    <div
      class="absolute -top-3 right-0 z-20 flex items-center gap-1 transition-opacity duration-150"
      :class="badgeControlsVisible || selected ? 'opacity-100' : 'pointer-events-none opacity-0'"
      contenteditable="false"
    >
      <UTooltip text="Delete badge">
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="xs"
          :padded="false"
          class="bg-default border-default h-6 w-6 rounded-full border shadow-sm"
          @click.stop="deleteNode()"
        />
      </UTooltip>
    </div>
  </NodeViewWrapper>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- WYSIWYG tabs-item render — bare content, no chrome                   -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <NodeViewWrapper v-else-if="isTabsItem">
    <NodeViewContent class="editor-tabs-item-content outline-none" />
  </NodeViewWrapper>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- WYSIWYG tabs render                                                   -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <NodeViewWrapper
    v-else-if="isTabs"
    class="my-5"
    :class="{ 'ring-primary/40 rounded-lg ring-2 ring-offset-1': selected }"
  >
    <!-- Tab bar — matches ProseTabs UTabs link variant -->
    <div class="border-default flex gap-1 border-b" contenteditable="false">
      <button
        v-for="(label, idx) in tabLabels"
        :key="idx"
        type="button"
        class="relative px-3 py-1.5 text-sm font-medium transition-colors"
        :class="
          activeTabIndex === idx
            ? 'text-primary border-primary border-b-2'
            : 'text-muted hover:text-default'
        "
        @click.stop="activeTabIndex = idx"
      >
        {{ label }}
      </button>
    </div>

    <!-- Tab content — NodeViewContent renders all tabs-item children;
         CSS shows only the nth-child matching data-active-tab.
         mt-4 matches UTabs gap-4 between tab list and content. -->
    <div class="mt-4" :data-active-tab="activeTabIndex">
      <NodeViewContent class="editor-tabs-content outline-none" />
    </div>
  </NodeViewWrapper>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- Default block component render — grey header bar for all other tags   -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <NodeViewWrapper
    v-else
    class="my-2"
    :class="{ 'ring-primary/40 rounded-lg ring-2 ring-offset-1': selected }"
  >
    <!-- ── Header bar ──────────────────────────────────────────────────────── -->
    <div
      class="border-default bg-muted/50 flex items-center gap-2 border px-3 py-1.5"
      :class="collapsed ? 'rounded-lg' : 'rounded-t-lg border-b-0'"
      contenteditable="false"
    >
      <!-- Collapse toggle — hidden for noContent components -->
      <button
        class="text-muted hover:text-foreground flex items-center gap-1.5 transition-colors"
        :class="def.noContent ? 'cursor-default' : ''"
        @click.stop="!def.noContent && (collapsed = !collapsed)"
      >
        <UIcon
          v-if="!def.noContent"
          :name="collapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'"
          class="h-3.5 w-3.5 shrink-0"
        />
        <UIcon :name="def.icon" class="text-primary h-3.5 w-3.5 shrink-0" />
        <span class="text-xs font-semibold">{{ def.label }}</span>
      </button>

      <!-- Props summary chips — hidden for u-button (uses visual picker) -->
      <div v-if="Object.keys(nodeProps).length && tag !== 'u-button'" class="flex flex-wrap gap-1">
        <span
          v-for="(val, key) in nodeProps"
          :key="key"
          class="bg-primary/10 text-primary rounded px-1.5 py-0.5 font-mono text-[10px]"
        >
          {{ key }}="{{ val }}"
        </span>
      </div>

      <!-- Callout type switcher — no longer shown here; callout has its own WYSIWYG render above -->

      <!-- Button visual picker trigger -->
      <div v-if="tag === 'u-button'" class="flex items-center gap-2" contenteditable="false">
        <!-- Preview of current button -->
        <UButton
          :label="buttonLabel"
          :color="(nodeProps.color as any) || 'primary'"
          :variant="(nodeProps.variant as any) || 'solid'"
          :icon="nodeProps.icon || undefined"
          size="xs"
          class="pointer-events-none"
        />
        <UPopover :ui="{ content: 'focus:outline-none' }">
          <UButton
            icon="i-lucide-palette"
            color="neutral"
            variant="ghost"
            size="xs"
            :padded="false"
            class="h-6 w-6"
          />
          <template #content>
            <div class="w-auto space-y-3 p-3" @mousedown.stop @click.stop>
              <p class="text-xs font-semibold">Pick style</p>
              <div class="space-y-2">
                <div
                  v-for="variant in BUTTON_VARIANTS"
                  :key="variant"
                  class="flex items-center gap-1.5"
                >
                  <span class="text-muted w-14 text-[10px] font-medium tracking-wider uppercase">{{
                    variant
                  }}</span>
                  <div class="flex gap-1">
                    <UButton
                      v-for="color in BUTTON_COLORS"
                      :key="color"
                      :label="buttonLabel"
                      :color="color as any"
                      :variant="variant as any"
                      size="xs"
                      tabindex="-1"
                      :class="[
                        'transition-all',
                        nodeProps.color === color && nodeProps.variant === variant
                          ? 'ring-primary ring-2 ring-offset-1'
                          : '',
                      ]"
                      @click="selectButtonStyle(color, variant)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </UPopover>
      </div>

      <div class="ml-auto flex items-center gap-1">
        <!-- Add slot dropdown -->
        <UDropdownMenu
          v-if="availableSlots.length"
          :items="
            availableSlots.map((s) => ({
              label: `#${s}`,
              icon: 'i-lucide-hash',
              onSelect: () => addSlot(s),
            }))
          "
        >
          <UTooltip text="Add slot">
            <UButton
              icon="i-lucide-hash"
              color="neutral"
              variant="ghost"
              size="xs"
              :padded="false"
              class="h-6 w-6"
            />
          </UTooltip>
        </UDropdownMenu>

        <!-- Add card button — only for card-group -->
        <UTooltip v-if="tag === 'card-group'" text="Add card">
          <UButton
            icon="i-lucide-plus"
            color="primary"
            variant="ghost"
            size="xs"
            :padded="false"
            class="h-6 w-6"
            @click.stop="addCard"
          />
        </UTooltip>

        <!-- Props button -->
        <UPopover v-model:open="popoverOpen">
          <UTooltip text="Edit props">
            <UButton
              icon="i-lucide-sliders-horizontal"
              color="neutral"
              variant="ghost"
              size="xs"
              :padded="false"
              class="h-6 w-6"
              @click.stop="openPopover"
            />
          </UTooltip>
          <template #content>
            <div class="w-72 space-y-3 p-3">
              <p class="text-xs font-semibold">{{ def.label }} props</p>

              <!-- Known fields -->
              <div v-for="field in def.fields" :key="field.key" class="space-y-1">
                <label class="text-muted block text-[10px] font-medium tracking-wider uppercase">
                  {{ field.label }}
                </label>
                <USelect
                  v-if="field.type === 'select'"
                  v-model="editingProps[field.key]"
                  :items="[
                    { label: '— none —', value: '__none__' },
                    ...(field.options ?? []).map((o) => ({ label: o, value: o })),
                  ]"
                  value-key="value"
                  label-key="label"
                  size="xs"
                  class="w-full"
                />
                <USelect
                  v-else-if="field.type === 'boolean'"
                  v-model="editingProps[field.key]"
                  :items="[
                    { label: '— none —', value: '__none__' },
                    { label: 'true', value: 'true' },
                    { label: 'false', value: 'false' },
                  ]"
                  value-key="value"
                  label-key="label"
                  size="xs"
                  class="w-full"
                />
                <UInput
                  v-else
                  v-model="editingProps[field.key]"
                  :placeholder="field.placeholder"
                  size="xs"
                  class="w-full"
                />
              </div>

              <p v-if="!def.fields.length && !extraProps.length" class="text-muted text-xs italic">
                No configurable props.
              </p>

              <!-- Extra props not in known fields -->
              <template v-if="extraProps.length">
                <USeparator />
                <p class="text-muted text-[10px] font-semibold tracking-wider uppercase">
                  Extra props
                </p>
                <div v-for="[k, v] in extraProps" :key="k" class="flex items-center gap-1">
                  <span class="text-muted font-mono text-xs">{{ k }}</span>
                  <UInput
                    :model-value="v"
                    size="xs"
                    class="flex-1"
                    @update:model-value="editingProps[k] = $event"
                  />
                  <UButton
                    icon="i-lucide-x"
                    color="error"
                    variant="ghost"
                    size="xs"
                    :padded="false"
                    @click="removeCustomProp(k)"
                  />
                </div>
              </template>

              <!-- Add custom prop -->
              <USeparator />
              <p class="text-muted text-[10px] font-semibold tracking-wider uppercase">Add prop</p>
              <div class="flex gap-1">
                <UInput v-model="newPropKey" placeholder="key" size="xs" class="w-24" />
                <UInput
                  v-model="newPropValue"
                  placeholder="value"
                  size="xs"
                  class="flex-1"
                  @keydown.enter="addCustomProp"
                />
                <UButton
                  icon="i-lucide-plus"
                  color="neutral"
                  variant="soft"
                  size="xs"
                  :padded="false"
                  class="h-7 w-7"
                  @click="addCustomProp"
                />
              </div>

              <div class="flex justify-end gap-2 border-t pt-2">
                <UButton
                  label="Cancel"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  @click="popoverOpen = false"
                />
                <UButton label="Apply" color="primary" size="xs" @click="applyProps" />
              </div>
            </div>
          </template>
        </UPopover>

        <!-- Delete -->
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
    </div>

    <!-- ── Editable content area ───────────────────────────────────────────── -->
    <div
      v-show="!collapsed && !def.noContent"
      class="border-default rounded-b-lg border border-t-0 px-4 py-3"
    >
      <NodeViewContent class="outline-none" />
    </div>
    <!-- For noContent nodes, still render NodeViewContent hidden (TipTap requires it) -->
    <NodeViewContent v-if="def.noContent" class="hidden" />
  </NodeViewWrapper>
</template>
