<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useTitle } from "@vueuse/core";
import { DIFFICULTY_COLOR_CLASS } from "@/constants";
import TagList from "@/components/Shared/TagList.vue";

useTitle("Problems | Normal OJ");

type Problem = {
  id: number;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  course: string;
  acceptance: number; // 0~1
};

const isLoading = ref(true);

const baseProblems = ref<Problem[]>([
  {
    id: 765,
    title: "Emergency Medical Dispatch",
    difficulty: "hard",
    tags: ["linked list", "dynamic programming"],
    course: "資料結構",
    acceptance: 0.0,
  },
  {
    id: 764,
    title: "Emergency Medical Dispatch",
    difficulty: "medium",
    tags: ["dynamic programming"],
    course: "演算法導論",
    acceptance: 0.1,
  },
  {
    id: 763,
    title: "Emergency Medical Dispatch",
    difficulty: "easy",
    tags: ["math"],
    course: "程式設計入門",
    acceptance: 0.2,
  },
  {
    id: 762,
    title: "Emergency Medical Dispatch",
    difficulty: "medium",
    tags: ["graph", "dynamic programming"],
    course: "演算法導論",
    acceptance: 0.8,
  },
  {
    id: 761,
    title: "Emergency Medical Dispatch",
    difficulty: "easy",
    tags: ["linked list"],
    course: "資料結構",
    acceptance: 0.8,
  },
]);

// filters
const q = ref("");
const selectedCourse = ref("");
const selectedTag = ref("");
const selectedDifficulty = ref<"" | "easy" | "medium" | "hard">("");

const allCourses = computed(() => Array.from(new Set(baseProblems.value.map((p) => p.course))));
const allTags = computed(() => Array.from(new Set(baseProblems.value.flatMap((p) => p.tags))));

const filteredProblems = computed(() => {
  const keyword = q.value.trim().toLowerCase();
  return baseProblems.value.filter((p) => {
    const byKeyword =
      !keyword ||
      `${p.id}`.includes(keyword) ||
      p.title.toLowerCase().includes(keyword) ||
      p.tags.some((t) => t.toLowerCase().includes(keyword));
    const byCourse = !selectedCourse.value || p.course === selectedCourse.value;
    const byTag = !selectedTag.value || p.tags.includes(selectedTag.value);
    const byDiff = !selectedDifficulty.value || p.difficulty === selectedDifficulty.value;
    return byKeyword && byCourse && byTag && byDiff;
  });
});

function resetFilters() {
  q.value = "";
  selectedCourse.value = "";
  selectedTag.value = "";
  selectedDifficulty.value = "";
}

onMounted(() => {
  // 模擬載入
  setTimeout(() => (isLoading.value = false), 200);
});
</script>

<template>
  <div class="card mx-auto max-w-6xl shadow-xl">
    <div class="card-body">
      <!-- Title + Search -->
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-lg font-bold">{{ $t("problems.title") }}</h1>
        <label
          class="input input-sm flex w-72 items-center gap-2 border border-base-content/30 bg-transparent focus-within:border-primary"
        >
          <input
            v-model="q"
            type="text"
            class="grow bg-transparent outline-none"
            :placeholder="$t('problems.search.placeholder')"
          />
          <i class="i-uil-search" />
        </label>
      </div>

      <!-- Filters -->
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <select v-model="selectedCourse" class="select select-bordered select-sm w-48">
          <option value="">{{ $t("problems.filter.allCourses") }}</option>
          <option v-for="c in allCourses" :key="c" :value="c">{{ c }}</option>
        </select>

        <select v-model="selectedTag" class="select select-bordered select-sm w-48">
          <option value="">{{ $t("problems.filter.allTags") }}</option>
          <option v-for="t in allTags" :key="t" :value="t">{{ t }}</option>
        </select>

        <div class="flex items-center gap-2">
          <button
            class="btn btn-xs gap-2"
            :class="selectedDifficulty === 'hard' ? 'btn-error' : 'btn-ghost'"
            @click="selectedDifficulty = selectedDifficulty === 'hard' ? '' : 'hard'"
          >
            <span class="h-2 w-2 rounded-full bg-red-500" /> hard
          </button>
          <button
            class="btn btn-xs gap-2"
            :class="selectedDifficulty === 'medium' ? 'btn-warning' : 'btn-ghost'"
            @click="selectedDifficulty = selectedDifficulty === 'medium' ? '' : 'medium'"
          >
            <span class="h-2 w-2 rounded-full bg-yellow-400" /> medium
          </button>
          <button
            class="btn btn-xs gap-2"
            :class="selectedDifficulty === 'easy' ? 'btn-success' : 'btn-ghost'"
            @click="selectedDifficulty = selectedDifficulty === 'easy' ? '' : 'easy'"
          >
            <span class="h-2 w-2 rounded-full bg-green-500" /> easy
          </button>
          <button class="btn btn-ghost btn-xs" @click="resetFilters">Reset</button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="py-10 text-center">
        <span class="loading-spinner loading-lg loading" />
        <p class="mt-2 text-sm opacity-70">{{ $t("problems.loading") }}</p>
      </div>

      <!-- Empty -->
      <div v-else-if="!filteredProblems.length" class="py-10 text-center text-sm opacity-70">
        {{ $t("common.noData") }}
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th>#ID</th>
              <th>{{ $t("problems.table.name") }}</th>
              <th>{{ $t("problems.table.tags") }}</th>
              <th>{{ $t("problems.table.course") }}</th>
              <th class="text-right">{{ $t("problems.table.ac") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredProblems" :key="p.id" class="hover">
              <td class="flex items-center gap-2">
                <span
                  class="h-3 w-3 rounded-full"
                  :class="DIFFICULTY_COLOR_CLASS[p.difficulty as keyof typeof DIFFICULTY_COLOR_CLASS]"
                />
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
              <td>{{ p.course }}</td>
              <td class="text-right">{{ (p.acceptance * 100).toFixed(0) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
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
</style>
