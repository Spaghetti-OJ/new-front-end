<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useTitle } from "@vueuse/core";
import api from "@/api";

useTitle("Ranking | Normal OJ");

const ranking = ref<any[]>([]);
const isLoading = ref(true);
const error = ref<Error | null>(null);

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
            <th>{{ $t("ranking.table.userId") }}</th>
            <th>{{ $t("ranking.table.displayName") }}</th>
            <th class="text-right">{{ $t("ranking.table.ac") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in ranking" :key="item.user?.username || index" class="hover">
            <td class="text-center font-semibold">{{ index + 1 }}</td>
            <td class="flex justify-center">
              <div class="avatar">
                <div class="mask mask-squircle h-10 w-10">
                  <img :src="item.user?.avatar || 'https://i.pravatar.cc/100'" alt="user avatar" />
                </div>
              </div>
            </td>
            <td>{{ item.user?.username || "Unknown" }}</td>
            <td>{{ item.user?.real_name || "-" }}</td>
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
