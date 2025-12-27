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

const normalizePath = (path: string) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized.startsWith("/avatars/") ? `/media${normalized}` : normalized;
};

const normalizeAvatar = (avatar?: string | null) => {
  if (!avatar) return fallbackAvatar;

  const mediaBase = import.meta.env.VITE_APP_MEDIA_BASE_URL || import.meta.env.VITE_APP_API_BASE_URL;
  let origin = window.location.origin;
  if (typeof mediaBase === "string" && mediaBase.length > 0) {
    try {
      origin = new URL(mediaBase, window.location.origin).origin;
    } catch {
      origin = window.location.origin;
    }
  }

  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    try {
      const parsed = new URL(avatar);
      if (parsed.origin === origin) {
        parsed.pathname = normalizePath(parsed.pathname);
      }
      return parsed.toString();
    } catch {
      return avatar;
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
  <div class="mx-auto w-full max-w-6xl px-4 py-6">
    <div class="card shadow-xl">
      <div class="card-body">
        <div class="card-title justify-between">
          <span class="text-lg font-bold md:text-2xl">{{ $t("ranking.title") }}</span>
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

        <!-- 桌面版：表格 (隱藏在 md 以下) -->
        <div v-else class="hidden overflow-x-auto md:block">
          <table class="table w-full">
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

        <!-- 手機版：卡片式佈局 (只在 md 以下顯示) -->
        <div v-if="!isLoading && !error" class="space-y-3 md:hidden">
          <div
            v-for="(item, index) in sortedRanking"
            :key="item.user?.username || index"
            class="card bg-base-200 shadow-sm transition-shadow hover:shadow-md"
          >
            <router-link
              v-if="item.user?.username"
              :to="getProfileLink(item.user.username)"
              class="group card-body cursor-pointer p-4"
              :aria-label="`View profile of ${item.user.username}`"
            >
              <div class="flex items-center gap-4">
                <!-- 排名徽章 -->
                <div class="flex-shrink-0">
                  <div
                    :class="[
                      'flex h-12 w-12 items-center justify-center rounded-full font-bold',
                      index === 0 && 'bg-yellow-500 text-yellow-900',
                      index === 1 && 'bg-gray-400 text-gray-900',
                      index === 2 && 'bg-orange-600 text-orange-100',
                      index > 2 && 'bg-base-300 text-base-content',
                    ]"
                  >
                    <span class="text-lg">{{ index + 1 }}</span>
                  </div>
                </div>

                <!-- 頭像 -->
                <div class="avatar flex-shrink-0">
                  <div class="mask mask-squircle h-14 w-14">
                    <img :src="item._avatarUrl" alt="user avatar" />
                  </div>
                </div>

                <!-- 用戶資訊 -->
                <div class="min-w-0 flex-1">
                  <div class="truncate text-base font-semibold">
                    {{ item.user.username || "Unknown" }}
                  </div>
                  <div class="truncate text-sm opacity-70">
                    {{ item.user.real_name || "-" }}
                  </div>
                </div>

                <!-- AC 數量 -->
                <div class="flex-shrink-0 text-right">
                  <div class="text-xs opacity-70">AC</div>
                  <div class="text-2xl font-bold text-success">
                    {{ item.ACProblem ?? 0 }}
                  </div>
                </div>

                <!-- Click indicator -->
                <div class="flex items-center text-sm opacity-50 transition-opacity group-hover:opacity-90">
                  <i-uil-angle-right />
                </div>
              </div>
            </router-link>
            <div v-else class="card-body cursor-default p-4 opacity-80">
              <div class="flex items-center gap-4">
                <!-- 排名徽章 -->
                <div class="flex-shrink-0">
                  <div
                    :class="[
                      'flex h-12 w-12 items-center justify-center rounded-full font-bold',
                      index === 0 && 'bg-yellow-500 text-yellow-900',
                      index === 1 && 'bg-gray-400 text-gray-900',
                      index === 2 && 'bg-orange-600 text-orange-100',
                      index > 2 && 'bg-base-300 text-base-content',
                    ]"
                  >
                    <span class="text-lg">{{ index + 1 }}</span>
                  </div>
                </div>

                <!-- 頭像 -->
                <div class="avatar flex-shrink-0">
                  <div class="mask mask-squircle h-14 w-14">
                    <img :src="item._avatarUrl" alt="user avatar" />
                  </div>
                </div>

                <!-- 用戶資訊 -->
                <div class="min-w-0 flex-1">
                  <div class="truncate text-base font-semibold">
                    {{ item.user?.username || "Unknown" }}
                  </div>
                  <div class="truncate text-sm opacity-70">
                    {{ item.user?.real_name || "-" }}
                  </div>
                </div>

                <!-- AC 數量 -->
                <div class="flex-shrink-0 text-right">
                  <div class="text-xs opacity-70">AC</div>
                  <div class="text-2xl font-bold text-success">
                    {{ item.ACProblem ?? 0 }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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

/* 手機版卡片 hover 效果 */
.card:hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* 確保文字不會溢出 */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 排名徽章動畫 */
@media (max-width: 768px) {
  .card-body {
    animation: fadeIn 0.3s ease-in-out;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
