/**
 * useActiveHeading — tracks the currently visible heading ID as the user scrolls.
 *
 * Uses IntersectionObserver with a top-biased rootMargin so the active heading
 * updates just before it scrolls off screen, matching typical docs site behaviour.
 *
 * Usage:
 *   const tocLinks = computed(() => body.value?.meta?.toc?.links ?? [])
 *   const activeId = useActiveHeading(tocLinks)
 *
 * Then bind :class on your TOC links:
 *   :class="activeId === link.id ? 'text-primary font-medium' : 'text-muted'"
 */
import type { Ref, ComputedRef } from "vue"

export interface TocLink {
  id: string
  label?: string
  depth?: number
  children?: TocLink[]
}

export function useActiveHeading(
  links: Ref<TocLink[]> | ComputedRef<TocLink[]>,
  options?: { rootMargin?: string },
) {
  const activeId = ref("")
  const rootMargin = options?.rootMargin ?? "-10% 0px -80% 0px"

  onMounted(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeId.value = entry.target.id
            break
          }
        }
      },
      { rootMargin },
    )

    function flatLinks(list: TocLink[]): { id: string }[] {
      return list.flatMap((l) => [{ id: l.id }, ...flatLinks(l.children ?? [])])
    }

    watch(
      links,
      () => {
        nextTick(() => {
          for (const l of flatLinks(unref(links))) {
            const el = document.getElementById(l.id)
            if (el) observer.observe(el)
          }
        })
      },
      { immediate: true },
    )

    onBeforeUnmount(() => observer.disconnect())
  })

  return activeId
}
