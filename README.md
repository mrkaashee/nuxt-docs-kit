# nuxt-doc-kit

Two Nuxt layers that provide a production-ready doc **reader** and **editor** for any Nuxt app.

- **Prop-driven** — components accept data as props, emit events back. No API calls.
- **Your app owns fetching** — the kit renders. You decide how to load and save data.
- **Peer deps**: `@nuxt/ui` v4, `comark`, `@comark/vue`, `@tiptap/*` (editor layer only)

---

## Layers

```
nuxt-doc-kit/
├── layers/
│   ├── reader/     ← rendering only, zero API calls
│   └── editor/     ← editor state + toolbar config, no API calls
└── app/pages/      ← demo pages (reader.vue, editor.vue)
```

---

## Reader layer

### Installation

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ["nuxt-doc-kit/layers/reader"],
})
```

### Components

#### `<DocReader>`

Renders a Comark AST or raw markdown string. Uses `ComarkRenderer` when an AST is available, falls back to `Comark` for raw markdown.

```vue
<DocReader
  :page="{ body: parsedAst, rawBody: markdownString, title: doc.title }"
  :language="doc.language"
/>
```

| Prop           | Type     | Description                             |
| -------------- | -------- | --------------------------------------- |
| `page.body`    | `any`    | Parsed Comark AST (from server)         |
| `page.rawBody` | `string` | Raw markdown (fallback / autosave)      |
| `page.title`   | `string` | Doc title                               |
| `language`     | `string` | ISO language code — e.g. `"ar"` for RTL |

---

#### `<DocPageTocSidebar>`

Right sidebar with `UContentToc` (highlighted active link) and action buttons below the TOC.

```vue
<DocPageTocSidebar
  :toc-links="tocLinks"
  base-path="/docs/my-doc"
  username="johndoe"
  doc-slug="my-doc"
  :logged-in="loggedIn"
  :is-owner="isOwner"
  :is-saved="isSaved"
  @save="handleSave"
/>
```

| Prop               | Type        | Description                                 |
| ------------------ | ----------- | ------------------------------------------- |
| `tocLinks`         | `TocLink[]` | Heading links — from `body.meta.toc.links`  |
| `basePath`         | `string`    | URL path to the doc page                    |
| `username`         | `string`    | Doc author's username                       |
| `docSlug`          | `string`    | Doc slug                                    |
| `loggedInUsername` | `string?`   | Logged-in user's username (for /saves link) |
| `isOwner`          | `boolean`   | Shows Edit/Settings instead of Save/Follow  |
| `loggedIn`         | `boolean`   | Shows save/library actions when true        |
| `isSaved`          | `boolean`   | Controls bookmark icon state                |

| Event   | Description                                |
| ------- | ------------------------------------------ |
| `@save` | User clicked Save — host calls its own API |

---

#### `<DocPreviewBanner>`

Shown at the top of draft preview pages.

```vue
<DocPreviewBanner
  doc-title="My Doc"
  owner-username="johndoe"
  doc-slug="my-doc"
  published-path="/docs/my-doc"
/>
```

| Prop            | Type      | Description                        |
| --------------- | --------- | ---------------------------------- |
| `docTitle`      | `string`  | Doc title                          |
| `ownerUsername` | `string`  | Author username                    |
| `docSlug`       | `string`  | Doc slug                           |
| `publishedPath` | `string?` | Override the "view published" link |

---

#### `<DocFollowersGate>`

Gate shown when a followers-only doc returns 403. Host provides the follow/sign-in CTA via the `#actions` slot.

```vue
<DocFollowersGate
  username="johndoe"
  doc-title="My Doc"
  :avatar="profile.avatar"
  :name="profile.name"
  :followers="profile.followers"
>
  <template #actions>
    <!-- Host renders its own follow button here -->
    <UButton label="Follow" @click="followUser" />
  </template>
</DocFollowersGate>
```

---

#### `<DocRequestAccessGate>`

Gate for private docs. Emits `@request-access` with the user's message — host submits to its own API.

```vue
<DocRequestAccessGate
  username="johndoe"
  :doc-id="doc.id"
  :doc-title="doc.title"
  :submitted="requestSubmitted"
  :submitting="isSubmitting"
  @request-access="(msg) => submitAccessRequest(doc.id, msg)"
/>
```

---

#### `<DocQuickActions>`

Share popover with UTM-tagged platform links. Host passes the canonical doc URL.

```vue
<DocQuickActions :doc-url="`https://example.com/docs/my-doc`" :doc-title="doc.title" />
```

---

### Composables

#### `useReadingStats(source)`

Computes word count and reading time from a markdown string. Pure function, no side effects.

```ts
const stats = useReadingStats(computed(() => rawBody))
// stats.words, stats.readingTimeMin, stats.readingTimeLabel ("3 min read")
```

#### `useActiveHeading(tocLinks)`

Tracks the active heading ID as the user scrolls using `IntersectionObserver`.

```ts
const tocLinks = computed(() => body.value?.meta?.toc?.links ?? [])
const activeId = useActiveHeading(tocLinks)
// use activeId.value to highlight the active TOC link
```

---

## Editor layer

### Installation

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ["nuxt-doc-kit/layers/editor"],
})
```

### `useDocEditor(options)`

Central editor state. All save/publish/mention operations go through callbacks — the kit never calls your API directly.

```ts
const editor = useDocEditor({
  doc, // Ref<{ title, description, seo, tags, ... }>

  // Called when user clicks Save (body + metadata)
  onSave: async (content, meta) => {
    await $fetch(`/api/docs/${doc.value.id}`, {
      method: "PATCH",
      body: { ...meta, body: content },
    })
  },

  // Called when user clicks Publish
  onPublish: async () => {
    await $fetch(`/api/docs/${doc.value.id}/publish`, { method: "POST" })
  },

  // Called 30s after last keystroke (body-only autosave)
  onAutoSave: async (content) => {
    await $fetch(`/api/docs/${doc.value.id}/body`, {
      method: "PATCH",
      body: { body: content },
    })
  },

  // Called when user types @mention — return items for the dropdown
  onMentionSearch: async (query) => {
    const res = await $fetch(`/api/search?q=${query}`)
    return res.users.map((u) => ({ id: u.id, label: u.username, mentionType: "user" }))
  },
})
```

**Returned refs and actions:**

| Name                  | Type                      | Description                                                       |
| --------------------- | ------------------------- | ----------------------------------------------------------------- |
| `meta`                | `reactive`                | `{ title, description, seoTitle, seoDescription, noIndex, tags }` |
| `content`             | `ref<string>`             | Current editor content (markdown)                                 |
| `hasUnsavedChanges`   | `computed`                | `true` when content differs from last save                        |
| `wordCount`           | `computed`                | Word count                                                        |
| `readingTime`         | `computed`                | Minutes to read                                                   |
| `saving`              | `ref<boolean>`            | True during `onSave`                                              |
| `publishing`          | `ref<boolean>`            | True during `onPublish`                                           |
| `editorMode`          | `ref<"visual"\|"source">` | Persisted to localStorage                                         |
| `showPreview`         | `ref<boolean>`            | Persisted to localStorage                                         |
| `previewAst`          | `ref<any>`                | Parsed AST for preview pane                                       |
| `focusMode`           | `ref<boolean>`            | Focus mode state                                                  |
| `save()`              | `fn`                      | Triggers `onSave` with current content + meta                     |
| `publish()`           | `fn`                      | Triggers `onPublish`                                              |
| `toggleEditorMode()`  | `fn`                      | Switches visual ↔ source                                          |
| `togglePreview()`     | `fn`                      | Toggles live preview pane                                         |
| `toggleFocusMode()`   | `fn`                      | Toggles focus mode                                                |
| `handleGlobalKeydown` | `fn`                      | Wire to `window.addEventListener("keydown", ...)`                 |
| `mentionItems`        | `ref<any[]>`              | Current mention dropdown items                                    |
| `mentionSearchTerm`   | `ref<string>`             | Set by the mention extension — triggers `onMentionSearch`         |

---

### `useEditorToolbar(callbacks)`

Returns toolbar item config, slash-command items, custom handlers, and the prose base CSS class for the editor canvas.

```ts
const { customHandlers, editorToolbarItems, suggestionItems, editorBaseClass } = useEditorToolbar({
  openImageModal: (editor) => {
    imageModalOpen.value = true
    pendingEditor = editor
  },
  openLinkModal: (editor) => {
    linkModalOpen.value = true
    pendingEditor = editor
  },
  openMermaidModal: (editor) => {
    mermaidModalOpen.value = true
    pendingEditor = editor
  },
})
```

Pass these to `UEditor` and `UEditorToolbar`:

```vue
<UEditorToolbar :editor="tiptap" :items="editorToolbarItems" :handlers="customHandlers" />
<UEditor :handlers="customHandlers" :ui="{ base: editorBaseClass }" />
```

---

## Full example — doc reader page

```vue
<script lang="ts" setup>
// Your page fetches and passes data in — kit just renders
const { data } = await useFetch("/api/docs/my-doc?include=body")
const doc = computed(() => data.value?.data?.doc)
const body = computed(() => data.value?.data?.body)
const rawBody = computed(() => data.value?.data?.rawBody ?? "")

const tocLinks = computed(() => body.value?.meta?.toc?.links ?? [])
const stats = useReadingStats(rawBody)

const isSaved = ref(false)
async function handleSave() {
  await $fetch(`/api/docs/${doc.value.id}/save`, { method: "POST" })
  isSaved.value = true
}
</script>

<template>
  <UPage>
    <UPageBody>
      <article>
        <DocReader :page="{ body, rawBody, title: doc.title }" />
      </article>
    </UPageBody>
    <template #right>
      <DocPageTocSidebar
        :toc-links="tocLinks"
        :base-path="`/docs/${doc.slug}`"
        :username="doc.ownerUsername"
        :doc-slug="doc.slug"
        :logged-in="loggedIn"
        :is-owner="isOwner"
        :is-saved="isSaved"
        @save="handleSave"
      />
    </template>
  </UPage>
</template>
```

---

## Demo

```bash
cd nuxt-docs-kit
pnpm install
pnpm dev
```

- `/` — layer overview
- `/reader` — reader demo with hardcoded doc
- `/editor` — editor demo with hardcoded content and console.log save/publish

---

## Peer dependencies

| Package               | Layer           | Notes                                                      |
| --------------------- | --------------- | ---------------------------------------------------------- |
| `@nuxt/ui` v4         | both            | Required. Provides `UContentToc`, `UPage`, `UEditor`, etc. |
| `comark`              | reader + editor | Markdown parser                                            |
| `@comark/vue`         | reader          | `ComarkRenderer` + `Comark` components                     |
| `@tiptap/vue-3`       | editor          | Visual editor engine                                       |
| `@tiptap/extension-*` | editor          | Extensions used by `useEditorToolbar`                      |
| `katex`               | reader          | Math rendering in `ProseMath.vue`                          |
| `mermaid`             | reader          | Diagram rendering in `ProseMermaid.vue`                    |
