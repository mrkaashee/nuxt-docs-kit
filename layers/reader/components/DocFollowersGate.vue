<script lang="ts" setup>
/**
 * DocFollowersGate — shown when a followers-only doc returns 403.
 *
 * The host app passes auth state via props so this component remains
 * decoupled from any specific auth composable.
 *
 * The host app is responsible for rendering follow/sign-in CTAs via the
 * #actions slot — this keeps the gate portable across auth providers.
 */
defineProps<{
  username: string
  docTitle?: string
  /** Author avatar URL */
  avatar?: string | null
  /** Author display name */
  name?: string | null
  /** Follower count to display */
  followers?: number | null
}>()
</script>

<template>
  <UMain>
    <UContainer>
      <div class="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
        <div class="bg-muted/40 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl">
          <UIcon name="i-lucide-lock" class="text-muted h-8 w-8" />
        </div>

        <h1 class="mb-2 text-2xl font-bold tracking-tight">
          {{ docTitle || "Followers only" }}
        </h1>
        <p class="text-muted mb-8 max-w-sm text-sm leading-relaxed">
          This document is only available to
          <NuxtLink :to="`/@${username}`" class="text-foreground font-medium underline-offset-2 hover:underline">
            @{{ username }}
          </NuxtLink>'s followers. Follow them to read it.
        </p>

        <div class="border-default bg-default mb-6 flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border p-6">
          <NuxtLink :to="`/@${username}`" class="flex flex-col items-center gap-3">
            <UAvatar :src="avatar ?? undefined" :alt="username" size="xl" />
            <div>
              <p class="text-base font-semibold">@{{ username }}</p>
              <p v-if="name" class="text-muted text-sm">{{ name }}</p>
            </div>
          </NuxtLink>

          <div v-if="followers != null" class="text-muted flex items-center gap-1 text-sm">
            <UIcon name="i-lucide-users" class="h-4 w-4" />
            <span>{{ followers.toLocaleString() }} follower{{ followers !== 1 ? "s" : "" }}</span>
          </div>

          <!-- Host app provides follow / sign-in CTAs here -->
          <slot name="actions">
            <UButton to="/login" label="Sign in to follow" icon="i-lucide-log-in" color="primary" variant="solid" />
          </slot>
        </div>

        <UButton :to="`/@${username}`" :label="`View @${username}'s profile`" color="neutral" variant="ghost" icon="i-lucide-arrow-left" />
      </div>
    </UContainer>
  </UMain>
</template>
