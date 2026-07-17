<template>
  <UMain>
    <UContainer class="py-20">
      <div class="mx-auto max-w-2xl text-center">
        <UBadge label="nuxt-doc-kit" color="primary" variant="subtle" size="lg" class="mb-6" />
        <h1 class="text-foreground mb-4 text-4xl font-black tracking-tight">
          Doc reader & editor for Nuxt
        </h1>
        <p class="text-muted mb-10 text-lg leading-relaxed">
          Two Nuxt layers — <code class="text-foreground font-mono text-base">reader</code> and <code class="text-foreground font-mono text-base">editor</code> —
          that provide a production-ready doc reading and editing experience.
          Prop-driven. No API calls. Drop into any Nuxt app.
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <UButton to="/reader" label="Reader demo" icon="i-lucide-book-open" size="lg" color="primary" />
          <UButton to="/editor" label="Editor demo" icon="i-lucide-pencil" size="lg" color="neutral" variant="outline" />
        </div>
      </div>

      <div class="mt-20 grid gap-6 sm:grid-cols-2">
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <div class="bg-primary/10 flex size-10 items-center justify-center rounded-xl">
                <UIcon name="i-lucide-book-open" class="text-primary size-5" />
              </div>
              <div>
                <p class="font-semibold">Reader layer</p>
                <p class="text-muted text-sm">extends: nuxt-doc-kit/layers/reader</p>
              </div>
            </div>
          </template>
          <ul class="text-muted space-y-1.5 text-sm">
            <li class="flex items-center gap-2"><UIcon name="i-lucide-check" class="text-primary size-3.5 shrink-0" /><code>DocReader</code> — Comark AST renderer</li>
            <li class="flex items-center gap-2"><UIcon name="i-lucide-check" class="text-primary size-3.5 shrink-0" /><code>DocPageTocSidebar</code> — TOC + actions</li>
            <li class="flex items-center gap-2"><UIcon name="i-lucide-check" class="text-primary size-3.5 shrink-0" /><code>DocPreviewBanner</code> — draft banner</li>
            <li class="flex items-center gap-2"><UIcon name="i-lucide-check" class="text-primary size-3.5 shrink-0" /><code>DocFollowersGate</code> + <code>DocRequestAccessGate</code></li>
            <li class="flex items-center gap-2"><UIcon name="i-lucide-check" class="text-primary size-3.5 shrink-0" /><code>DocQuickActions</code> — share popover</li>
            <li class="flex items-center gap-2"><UIcon name="i-lucide-check" class="text-primary size-3.5 shrink-0" /><code>useReadingStats</code> + <code>useActiveHeading</code></li>
          </ul>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <div class="bg-primary/10 flex size-10 items-center justify-center rounded-xl">
                <UIcon name="i-lucide-pencil" class="text-primary size-5" />
              </div>
              <div>
                <p class="font-semibold">Editor layer</p>
                <p class="text-muted text-sm">extends: nuxt-doc-kit/layers/editor</p>
              </div>
            </div>
          </template>
          <ul class="text-muted space-y-1.5 text-sm">
            <li class="flex items-center gap-2"><UIcon name="i-lucide-check" class="text-primary size-3.5 shrink-0" /><code>useDocEditor</code> — editor state, callback-based</li>
            <li class="flex items-center gap-2"><UIcon name="i-lucide-check" class="text-primary size-3.5 shrink-0" /><code>useEditorToolbar</code> — toolbar + slash commands</li>
            <li class="flex items-center gap-2"><UIcon name="i-lucide-check" class="text-primary size-3.5 shrink-0" />Visual editor (TipTap + UEditor)</li>
            <li class="flex items-center gap-2"><UIcon name="i-lucide-check" class="text-primary size-3.5 shrink-0" />Source editor (Markdown/CodeMirror)</li>
            <li class="flex items-center gap-2"><UIcon name="i-lucide-check" class="text-primary size-3.5 shrink-0" />Live preview pane</li>
            <li class="flex items-center gap-2"><UIcon name="i-lucide-check" class="text-primary size-3.5 shrink-0" />Math, Mermaid, MDC components, tables</li>
          </ul>
        </UCard>
      </div>
    </UContainer>
  </UMain>
</template>
