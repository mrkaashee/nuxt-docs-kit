<script lang="ts" setup>
/**
 * DocRequestAccessGate — shown when a private_listed doc returns 403 REQUEST_ACCESS
 * or 401 SIGN_IN_TO_REQUEST.
 *
 * The host app provides the requestAccess function and auth state via props / slots.
 * This keeps the gate portable — the host decides how to call its own API.
 */
const props = defineProps<{
  username: string
  docId?: string | null
  docTitle?: string | null
  requireSignIn?: boolean
  /** Whether a request has already been submitted */
  submitted?: boolean
  /** Whether the request is currently being submitted */
  submitting?: boolean
  /** Author avatar */
  avatar?: string | null
  /** Author display name */
  name?: string | null
  loginPath?: string
}>()

const emit = defineEmits<{
  "request-access": [message: string]
}>()

const route = useRoute()
const showModal = ref(false)
const message = ref("")
const maxChars = 300
const remaining = computed(() => maxChars - message.value.length)

const loginRedirect = computed(() =>
  props.loginPath ?? `/login?redirect=${encodeURIComponent(route.fullPath)}`,
)

function submit() {
  emit("request-access", message.value.trim())
  showModal.value = false
}
</script>

<template>
  <UMain>
    <UContainer>
      <div class="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
        <div class="bg-muted/40 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl">
          <UIcon name="i-lucide-lock-keyhole" class="text-muted h-8 w-8" />
        </div>

        <h1 class="mb-2 text-2xl font-bold tracking-tight">{{ docTitle ?? "Private document" }}</h1>
        <p class="text-muted mb-8 max-w-sm text-sm leading-relaxed">
          This document is private. You can request access from
          <NuxtLink :to="`/@${username}`" class="text-foreground font-medium underline-offset-2 hover:underline">
            @{{ username }}
          </NuxtLink>.
        </p>

        <div class="border-default bg-default mb-6 flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border p-6">
          <NuxtLink :to="`/@${username}`" class="flex flex-col items-center gap-3">
            <UAvatar :src="avatar ?? undefined" :alt="username" size="xl" />
            <div>
              <p class="text-base font-semibold">@{{ username }}</p>
              <p v-if="name" class="text-muted text-sm">{{ name }}</p>
            </div>
          </NuxtLink>

          <!-- Sign-in required -->
          <template v-if="requireSignIn">
            <UButton :to="loginRedirect" label="Sign in to request access" icon="i-lucide-log-in" color="primary" variant="solid" class="w-full" />
          </template>
          <!-- Already submitted -->
          <template v-else-if="submitted">
            <div class="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
              <UIcon name="i-lucide-check-circle" class="h-4 w-4" />
              <span>Access request sent</span>
            </div>
          </template>
          <!-- Request CTA -->
          <template v-else>
            <UButton label="Request access" icon="i-lucide-send" color="primary" variant="solid" class="w-full" :disabled="!docId" @click="showModal = true" />
          </template>
        </div>

        <UButton :to="`/@${username}`" :label="`View @${username}'s profile`" color="neutral" variant="ghost" icon="i-lucide-arrow-left" />
      </div>
    </UContainer>

    <!-- Request modal -->
    <UModal v-model:open="showModal" title="Request access">
      <template #body>
        <div class="space-y-4">
          <p class="text-muted text-sm">
            Send an optional message to <strong>@{{ username }}</strong> explaining why you'd like access.
          </p>
          <UFormField label="Message (optional)" name="message">
            <UTextarea v-model="message" placeholder="e.g. I'd love to read this for my research on…" :rows="4" class="w-full" :maxlength="maxChars" />
            <template #hint>
              <span :class="remaining < 20 ? 'text-error' : 'text-muted'">{{ remaining }} characters remaining</span>
            </template>
          </UFormField>
          <div class="flex justify-end gap-3">
            <UButton label="Cancel" color="neutral" variant="subtle" @click="showModal = false" />
            <UButton label="Send request" icon="i-lucide-send" color="primary" :loading="submitting" @click="submit" />
          </div>
        </div>
      </template>
    </UModal>
  </UMain>
</template>
