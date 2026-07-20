<script setup lang="ts">
/**
 * MentionInsertPopover — shown after selecting a mention item from the @ menu,
 * and also when editing an existing mention node.
 * Lets the author customise the label, pick a link style, and (for button) pick color/variant.
 * All styles are stored as attrs on the mention node — never replaces the node.
 */
const props = defineProps<{
  item: {
    id: string
    label: string
    href: string
    mentionType: "user" | "doc"
    description?: string
    avatar?: { src?: string; alt?: string }
    icon?: string
    // Pre-fill when editing an existing node
    initialStyle?: "mention" | "link" | "code-link" | "button"
    initialColor?: string
    initialVariant?: string
  }
}>()

const emit = defineEmits<{
  confirm: [payload: { label: string; style: LinkStyle; color?: string; variant?: string }]
  cancel: []
}>()

type LinkStyle = "mention" | "link" | "code-link" | "button"

const label = ref(props.item.label)
const style = ref<LinkStyle>(props.item.initialStyle ?? "mention")
const btnColor = ref(props.item.initialColor ?? "primary")
const btnVariant = ref(props.item.initialVariant ?? "solid")

const isUser = computed(() => props.item.mentionType === "user")
const currentLabel = computed(() => label.value || props.item.label)

const COLORS = ["primary", "secondary", "success", "info", "warning", "error", "neutral"]
const VARIANTS = ["solid", "outline", "soft", "subtle", "ghost", "link"]

const styles: Array<{ value: LinkStyle; label: string; icon: string }> = [
  { value: "mention", label: "Mention", icon: "i-lucide-at-sign" },
  { value: "link", label: "Link", icon: "i-lucide-link" },
  { value: "code-link", label: "Code link", icon: "i-lucide-code" },
  { value: "button", label: "Button", icon: "i-lucide-mouse-pointer-click" },
]

function confirm() {
  emit("confirm", {
    label: currentLabel.value,
    style: style.value,
    color: style.value === "button" ? btnColor.value : undefined,
    variant: style.value === "button" ? btnVariant.value : undefined,
  })
}

const inputRef = ref<any>(null)
onMounted(() => nextTick(() => inputRef.value?.input?.focus()))
</script>

<template>
  <div class="w-80" @keydown.enter.prevent="confirm" @keydown.escape.prevent="emit('cancel')">
    <!-- Header -->
    <div
      class="bg-muted/20 border-default/50 mb-4 flex items-center gap-3 rounded-xl border p-3 shadow-inner"
    >
      <UAvatar
        v-if="item.avatar"
        :src="item.avatar.src"
        :alt="item.avatar.alt"
        size="sm"
        class="ring-default border-default shrink-0 border"
      />
      <div
        v-else-if="item.icon"
        class="bg-primary/10 border-primary/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
      >
        <UIcon :name="item.icon" class="text-primary h-4.5 w-4.5" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-default truncate text-sm leading-tight font-bold">{{ item.label }}</p>
        <p v-if="item.description" class="text-muted mt-0.5 truncate text-xs font-medium">
          {{ item.description }}
        </p>
      </div>
    </div>

    <!-- Live Preview Box -->
    <div class="border-default bg-elevated/40 mb-4 rounded-xl border p-3 shadow-inner">
      <p class="text-muted mb-2 text-[9px] font-black tracking-widest uppercase">Live Preview</p>
      <div
        class="bg-default border-default/50 flex min-h-[52px] items-center justify-center rounded-lg border p-2"
      >
        <!-- Render current selection exactly as it will appear -->
        <span
          v-if="style === 'mention'"
          class="border-default bg-muted/40 text-primary inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 align-middle text-sm font-semibold"
        >
          <UIcon v-if="!isUser" name="i-lucide-book-open" class="h-3.5 w-3.5 shrink-0 opacity-80" />
          <UIcon v-else name="i-lucide-at-sign" class="h-3.5 w-3.5 shrink-0 opacity-80" />
          <span>{{ isUser ? `@${currentLabel}` : currentLabel }}</span>
        </span>

        <span
          v-else-if="style === 'link'"
          class="text-primary cursor-pointer text-sm font-semibold underline transition-opacity hover:opacity-85"
        >
          {{ currentLabel }}
        </span>

        <code
          v-else-if="style === 'code-link'"
          class="text-primary bg-muted/60 rounded px-1.5 py-0.5 font-mono text-xs font-bold underline"
        >
          {{ currentLabel }}
        </code>

        <UButton
          v-else-if="style === 'button'"
          :label="currentLabel"
          :color="btnColor"
          :variant="btnVariant"
          size="sm"
          class="font-semibold shadow-sm"
        />
      </div>
    </div>

    <!-- Label -->
    <UFormField label="Custom Label" class="mb-4">
      <UInput
        ref="inputRef"
        v-model="label"
        :placeholder="item.label"
        size="sm"
        class="w-full rounded-lg"
      />
    </UFormField>

    <!-- Style picker -->
    <p class="text-muted mb-2 text-xs font-semibold tracking-wider uppercase">Style Style</p>
    <div class="mb-4 grid grid-cols-2 gap-2">
      <button
        v-for="s in styles"
        :key="s.value"
        type="button"
        class="border-default bg-default hover:bg-elevated/40 flex cursor-pointer flex-col items-start gap-1 rounded-xl border p-2.5 text-left shadow-sm transition-all duration-200"
        :class="
          style === s.value
            ? 'border-primary bg-primary/5 ring-primary/10 shadow-inner ring-2'
            : 'hover:border-default/80'
        "
        @click="style = s.value"
      >
        <div class="flex items-center gap-1.5">
          <UIcon
            :name="s.icon"
            class="h-4 w-4 shrink-0 transition-colors"
            :class="style === s.value ? 'text-primary' : 'text-muted'"
          />
          <span
            class="text-xs font-bold transition-colors"
            :class="style === s.value ? 'text-primary' : 'text-default'"
          >
            {{ s.label }}
          </span>
        </div>
        <!-- Syntax Tip -->
        <span class="text-muted mt-0.5 line-clamp-1 font-mono text-[9px] leading-tight opacity-80">
          <template v-if="s.value === 'mention'">
            {{ isUser ? `@${currentLabel}` : currentLabel }}
          </template>
          <template v-else-if="s.value === 'link'">[{{ currentLabel }}](...)</template>
          <template v-else-if="s.value === 'code-link'">[`{{ currentLabel }}`](...)</template>
          <template v-else> Button widget </template>
        </span>
      </button>
    </div>

    <!-- Button options — only shown when button style is selected -->
    <div
      v-if="style === 'button'"
      class="bg-muted/10 border-default/40 mb-4 space-y-3.5 rounded-xl border p-3 shadow-inner"
    >
      <!-- Color -->
      <div>
        <p class="text-muted mb-2 text-[10px] font-black tracking-widest uppercase">Button Color</p>
        <div class="flex flex-wrap gap-1.5">
          <UButton
            v-for="c in COLORS"
            :key="c"
            type="button"
            :label="c"
            :color="c"
            :variant="btnColor === c ? 'solid' : 'soft'"
            size="xs"
            class="rounded-lg capitalize shadow-sm transition-transform hover:scale-105"
            @click="btnColor = c"
          />
        </div>
      </div>

      <!-- Variant -->
      <div>
        <p class="text-muted mb-2 text-[10px] font-black tracking-widest uppercase">
          Button Variant
        </p>
        <div class="flex flex-wrap gap-1.5">
          <UButton
            v-for="v in VARIANTS"
            :key="v"
            type="button"
            :label="v"
            :color="btnColor"
            :variant="btnVariant === v ? 'solid' : 'ghost'"
            size="xs"
            class="rounded-lg capitalize shadow-sm transition-transform hover:scale-105"
            @click="btnVariant = v"
          />
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="border-default/60 flex justify-end gap-2 border-t pt-3.5">
      <UButton
        label="Cancel"
        color="neutral"
        variant="ghost"
        size="sm"
        class="rounded-lg font-semibold"
        @click="emit('cancel')"
      />
      <UButton
        label="Insert"
        color="primary"
        size="sm"
        icon="i-lucide-check"
        class="rounded-lg font-bold shadow-sm"
        @click="confirm"
      />
    </div>
  </div>
</template>
