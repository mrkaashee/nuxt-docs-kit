<script setup lang="ts">
/**
 * MentionDropdown — floating dropdown rendered by MentionWithHref's suggestion plugin.
 * Receives TipTap suggestion props and renders a searchable list of users/docs.
 */
const props = defineProps<{
  items: any[]
  command: (item: any) => void
  editor?: any
}>()

const selectedIndex = ref(0)

// Selectable items (skip labels/separators)
const selectableItems = computed(() =>
  props.items.filter((i) => i.type !== "label" && i.type !== "separator"),
)

watch(
  () => props.items,
  () => {
    selectedIndex.value = 0
  },
)

function select(item: any) {
  if (item.type === "label" || item.type === "separator") return
  props.command(item)
}

function onKeyDown({ event }: { event: KeyboardEvent }) {
  if (event.key === "ArrowUp") {
    selectedIndex.value =
      (selectedIndex.value - 1 + selectableItems.value.length) %
      Math.max(1, selectableItems.value.length)
    return true
  }
  if (event.key === "ArrowDown") {
    selectedIndex.value = (selectedIndex.value + 1) % Math.max(1, selectableItems.value.length)
    return true
  }
  if (event.key === "Enter" || event.key === "Tab") {
    const item = selectableItems.value[selectedIndex.value]
    if (item) select(item)
    return true
  }
  return false
}

defineExpose({ onKeyDown })
</script>

<template>
  <div
    class="border-default bg-default/90 z-50 max-w-xs min-w-[240px] overflow-hidden rounded-xl border py-1.5 shadow-2xl ring-1 ring-black/5 backdrop-blur-md transition-all duration-200 dark:ring-white/10"
  >
    <template v-for="(item, i) in items" :key="i">
      <!-- Label row -->
      <div
        v-if="item.type === 'label'"
        class="text-muted/80 border-default/30 mt-1.5 mb-1 border-b px-3 py-1.5 text-[9px] font-black tracking-widest uppercase first:mt-0"
      >
        {{ item.label }}
      </div>

      <!-- Selectable item -->
      <button
        v-else
        type="button"
        class="hover:bg-elevated/50 flex w-full cursor-pointer items-center gap-2.5 py-1.5 pr-3 text-left transition-all duration-150"
        :class="
          selectableItems.indexOf(item) === selectedIndex
            ? 'bg-primary/10 text-primary border-primary border-l-2 pl-2.5 font-bold'
            : 'text-default pl-3'
        "
        @mousedown.prevent="select(item)"
        @mouseenter="selectedIndex = selectableItems.indexOf(item)"
      >
        <UAvatar
          v-slot="{ close }"
          v-if="item.avatar"
          :src="item.avatar.src"
          :alt="item.avatar.alt || item.label"
          size="xs"
          class="border-default/50 shrink-0 border"
        />
        <div
          v-else-if="item.icon"
          class="bg-primary/10 border-primary/20 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border"
        >
          <UIcon :name="item.icon" class="text-primary h-3.5 w-3.5" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm leading-none font-medium">{{ item.label }}</p>
          <p v-if="item.description" class="text-muted mt-1 truncate text-[10px] leading-none">
            {{ item.description }}
          </p>
        </div>

        <!-- Keyboard hint for active item -->
        <span
          v-if="selectableItems.indexOf(item) === selectedIndex"
          class="text-primary/70 dark:text-primary/80 bg-primary/15 border-primary/20 flex shrink-0 items-center gap-0.5 rounded border px-1 py-0.5 text-[9px] font-black tracking-wider uppercase"
        >
          <span>Enter</span>
          <UIcon name="i-lucide-corner-down-left" class="h-2.5 w-2.5" />
        </span>
      </button>
    </template>

    <!-- Empty state -->
    <div
      v-if="!items.length"
      class="text-muted flex flex-col items-center justify-center space-y-1.5 px-3 py-5 text-center"
    >
      <UIcon name="i-lucide-search-x" class="text-muted/50 h-7 w-7" />
      <div>
        <p class="text-default text-xs font-bold">No results found</p>
        <p class="text-muted mt-0.5 text-[10px]">Try typing another query</p>
      </div>
    </div>
  </div>
</template>
