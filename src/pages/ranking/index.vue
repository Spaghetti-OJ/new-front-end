<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useTitle } from "@vueuse/core";
import api from "@/api";

useTitle("Ranking | Normal OJ");

const ranking = ref<any[]>([]);
const isLoading = ref(true);
const error = ref<Error | null>(null);

const getProfileLink = (username: string) => `/profile/${username}`;
const fallbackAvatar = "https://i.pravatar.cc/100";

const normalizeAvatar = (avatar?: string | null) => {
  if (!avatar) return fallbackAvatar;

  const normalizePath = (path: string) => {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return normalized.startsWith("/avatars/") ? `/media${normalized}` : normalized;
  };

  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    try {
      const parsed = new URL(avatar);
      parsed.pathname = normalizePath(parsed.pathname);
      return parsed.toString();
    } catch {
      return avatar;
    }
  }

  const mediaBase = import.meta.env.VITE_APP_MEDIA_BASE_URL || import.meta.env.VITE_APP_API_BASE_URL;
  let origin = window.location.origin;
  if (typeof mediaBase === "string" && mediaBase.length > 0) {
    try {
      origin = new URL(mediaBase, window.location.origin).origin;
    } catch {
      origin = window.location.origin;
    }
  }

  return `${origin}${normalizePath(avatar)}`;
};

const sortedRanking = computed(() =>
  [...ranking.value]
    .sort((a, b) => (b.ACProblem ?? 0) - (a.ACProblem ?? 0))
    .map((item) => ({
      ...item,
      _avatarUrl: normalizeAvatar(item.user?.avatar),
    })),
);

onMounted(async () => {
  try {
    const res = await api.Ranking.getRankingStats();
    if (res?.ranking && Array.isArray(res.ranking)) {
      ranking.value = res.ranking;
    } else {
      console.warn("Using mock ranking data...");
    }
  } catch (err: any) {
    console.warn("Failed to fetch /ranking, showing mock data.");
    error.value = err;
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="card mx-auto max-w-6xl shadow-xl">
    <div class="card-body">
      <div class="card-title justify-between">
        <span class="text-lg font-bold">{{ $t("ranking.title") }}</span>
      </div>

      <div class="my-2" />

      <!-- Loading -->
      <div v-if="isLoading" class="py-10 text-center">
        <span class="loading-spinner loading-lg loading"></span>
        <p class="mt-2 text-sm opacity-70">{{ $t("ranking.loading") }}</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="alert alert-error shadow-lg">
        <div>
          <i-uil-times-circle />
          <span>{{ $t("ranking.error") }}</span>
        </div>
      </div>

      <!-- Table -->
      <table v-else class="table w-full">
        <thead>
          <tr>
            <th class="w-16 text-center">#</th>
            <th class="w-24 text-center">{{ $t("ranking.table.avatar") }}</th>
            <th>{{ $t("profile.username") }}</th>
            <th>{{ $t("profile.realName") }}</th>
            <th class="text-right">{{ $t("ranking.table.ac") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in sortedRanking" :key="item.user?.username || index" class="hover">
            <td class="text-center font-semibold">{{ index + 1 }}</td>
            <td class="flex justify-center">
              <router-link
                v-if="item.user?.username"
                :to="getProfileLink(item.user.username)"
                class="avatar transition-opacity hover:opacity-80"
                :aria-label="`View profile of ${item.user.username}`"
                :title="`View profile of ${item.user.username}`"
              >
                <div class="mask mask-squircle h-10 w-10">
                  <img :src="item._avatarUrl" alt="user avatar" />
                </div>
              </router-link>
              <div v-else class="avatar">
                <div class="mask mask-squircle h-10 w-10">
                  <img :src="item._avatarUrl" alt="user avatar" />
                </div>
              </div>
            </td>
            <td>
              <router-link
                v-if="item.user?.username"
                :to="getProfileLink(item.user.username)"
                class="hover:underline"
                :aria-label="`View profile of ${item.user.username}`"
                :title="`View profile of ${item.user.username}`"
              >
                {{ item.user.username }}
              </router-link>
              <span v-else>{{ item.user?.username || "Unknown" }}</span>
            </td>
            <td>
              <router-link
                v-if="item.user?.username"
                :to="getProfileLink(item.user.username)"
                class="link link-hover"
                :aria-label="`View profile of ${item.user.username}`"
                :title="`View profile of ${item.user.username}`"
              >
                {{ item.user.real_name || "-" }}
              </router-link>
              <span v-else>{{ item.user?.real_name || "-" }}</span>
            </td>
            <td class="text-right">{{ item.ACProblem ?? 0 }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.table thead tr {
  background-color: rgba(255, 255, 255, 0.05);
  font-weight: 600;
  text-transform: uppercase;
}

.table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.05);
  transition: background-color 0.2s ease;
}
</style>
