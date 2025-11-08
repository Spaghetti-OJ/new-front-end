<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useTitle } from "@vueuse/core";
import TagList from "@/components/Shared/TagList.vue";

useTitle("Problems | Normal OJ");

const problems = ref<any[]>([]);
const isLoading = ref(true);
const error = ref<Error | null>(null);

// ✅ 假資料
const mockProblems = [
  {
    id: 765,
    title: "Emergency Medical Dispatch1",
    difficulty: "hard",
    tags: ["linked list", "dynamic programming"],
    acceptance: 0.0,
  },
  {
    id: 764,
    title: "Emergency Medical Dispatch2",
    difficulty: "medium",
    tags: ["dynamic programming"],
    acceptance: 0.1,
  },
  {
    id: 763,
    title: "Emergency Medical Dispatch3",
    difficulty: "easy",
    tags: ["dynamic programming"],
    acceptance: 0.2,
  },
  {
    id: 762,
    title: "Emergency Medical Dispatch4",
    difficulty: "medium",
    tags: ["dynamic programming"],
    acceptance: 0.8,
  },
  {
    id: 761,
    title: "Emergency Medical Dispatch5",
    difficulty: "easy",
    tags: ["dynamic programming"],
    acceptance: 0.8,
  },
];

onMounted(async () => {
  try {
    // 直接用假資料（確認畫面）
    console.log("💡 Using mockProblems as default data");
    problems.value = mockProblems;
  } catch (err: any) {
    console.warn("Failed to fetch /problems, using mock data.");
    error.value = err;
    problems.value = mockProblems;
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="card mx-auto max-w-6xl shadow-xl">
    <div class="card-body">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-lg font-bold">{{ $t("problems.title") }}</h1>

        <input type="text" :placeholder="$t('problems.search.placeholder')"
          class="input input-bordered input-sm w-64" />
      </div>

      <div v-if="isLoading" class="py-10 text-center">
        <span class="loading-spinner loading-lg loading"></span>
        <p class="mt-2 text-sm opacity-70">{{ $t("problems.loading") }}</p>
      </div>

      <table v-else class="table w-full">
        <thead>
          <tr>
            <th>{{ $t("problems.table.id") }}</th>
            <th>{{ $t("problems.table.name") }}</th>
            <th>{{ $t("problems.table.tags") }}</th>
            <th class="text-right">{{ $t("problems.table.ac") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in problems" :key="p.id" class="hover">
            <td class="flex items-center gap-2">
              <span class="h-3 w-3 rounded-full" :class="{
                'bg-red-500': p.difficulty === 'hard',
                'bg-yellow-400': p.difficulty === 'medium',
                'bg-green-500': p.difficulty === 'easy',
              }"></span>
              #{{ p.id }}
            </td>
            <td>
              <router-link :to="`/problems/${p.id}`" class="link link-hover font-medium">
                {{ p.title }}
              </router-link>
            </td>
            <td>
              <TagList :tags="p.tags" size="sm" colorMode="outline" />
            </td>
            <td class="text-right">
              {{ p.acceptance != null ? (p.acceptance * 100).toFixed(0) + "%" : "—" }}
            </td>
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
}

.table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.05);
  transition: background-color 0.2s ease;
}

.badge {
  background-color: rgba(255, 255, 255, 0.08);
  color: #f3f3f3;
  border: none;
}
</style>
