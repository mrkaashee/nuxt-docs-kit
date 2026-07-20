/**
 * useActiveHeading — tracks the currently visible heading using IntersectionObserver.
 *
 * @param tocLinks — reactive list of { id: string } heading links
 * @returns activeId — ref containing the id of the currently visible heading
 */
export function useActiveHeading(tocLinks: Ref<{ id: string; children?: { id: string }[] }[]> | ComputedRef<{ id: string; children?: { id: string }[] }[]>) {
  const activeId = ref("")

  if (import.meta.client) {
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
        { rootMargin: "-10% 0px -80% 0px" },
      )

      function flat(links: { id: string; children?: { id: string }[] }[]): { id: string }[] {
        return links.flatMap((l) => [{ id: l.id }, ...flat(l.children ?? [])])
      }

      watch(
        tocLinks,
        () => {
          nextTick(() => {
            for (const { id } of flat(unref(tocLinks))) {
              const el = document.getElementById(id)
              if (el) observer.observe(el)
            }
          })
        },
        { immediate: true },
      )

      onBeforeUnmount(() => observer.disconnect())
    })
  }

  return activeId
}
