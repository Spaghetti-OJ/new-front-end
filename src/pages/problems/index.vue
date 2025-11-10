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
  acceptance: number;
};

const isLoading = ref(true);

const baseProblems = ref<Problem[]>([
  { id: 765, title: "Emergency Dispatch 1", difficulty: "hard", tags: ["linked list", "dynamic programming"], course: "資料結構", acceptance: 0.0 },
  { id: 764, title: "Emergency Dispatch 2", difficulty: "medium", tags: ["dynamic programming"], course: "演算法導論", acceptance: 0.1 },
  { id: 763, title: "Emergency Dispatch 3", difficulty: "easy", tags: ["math"], course: "程式設計入門", acceptance: 0.2 },
  { id: 762, title: "Emergency Dispatch 4", difficulty: "medium", tags: ["graph", "dynamic programming"], course: "演算法導論", acceptance: 0.8 },
  { id: 761, title: "Emergency Dispatch 5", difficulty: "easy", tags: ["linked list"], course: "資料結構", acceptance: 0.8 },
]);

// Search and filters
const q = ref("");
const selectedCourses = ref<string[]>([]);
const selectedTags = ref<string[]>([]);
const selectedDifficulties = ref<string[]>([]);

const allCourses = computed(() => Array.from(new Set(baseProblems.value.map(p => p.course))));
const allTags = computed(() => Array.from(new Set(baseProblems.value.flatMap(p => p.tags))));
const allDiffs = ["easy", "medium", "hard"];

const filteredProblems = computed(() => {
  const keyword = q.value.trim().toLowerCase();
  return baseProblems.value.filter((p) => {
    const matchKeyword =
      !keyword ||
      p.title.toLowerCase().includes(keyword) ||
      p.tags.some(t => t.toLowerCase().includes(keyword)) ||
      `${p.id}`.includes(keyword);
    const matchCourse = !selectedCourses.value.length || selectedCourses.value.includes(p.course);
    const matchTag = !selectedTags.value.length || p.tags.some(t => selectedTags.value.includes(t));
    const matchDiff = !selectedDifficulties.value.length || selectedDifficulties.value.includes(p.difficulty);
    return matchKeyword && matchCourse && matchTag && matchDiff;
  });
});

function toggleItem(list: string[], item: string) {
  const idx = list.indexOf(item);
  if (idx === -1) list.push(item);
  else list.splice(idx, 1);
}

function resetFilters() {
  q.value = "";
  selectedCourses.value = [];
  selectedTags.value = [];
  selectedDifficulties.value = [];
}

onMounted(() => {
  setTimeout(() => (isLoading.value = false), 300);
});
</script>

<template>
  <div class="card mx-auto max-w-6xl shadow-xl">
    <div class="card-body">
      <!-- Title & Search -->
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-lg font-bold">Problems</h1>
        <label class="input input-sm flex w-72 items-center gap-2 border border-base-content/30 bg-transparent focus-within:border-primary">
          <input v-model="q" type="text" placeholder="Search problems..." class="grow bg-transparent outline-none" />
          <i class="i-uil-search" />
        </label>
      </div>

      <!-- Filters -->
      <div class="mb-4 space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-semibold text-sm opacity-70">Courses:</span>
          <button
            v-for="c in allCourses"
            :key="c"
            class="badge cursor-pointer transition-all duration-150"
            :class="selectedCourses.includes(c)
              ? 'bg-blue-500 text-white border border-blue-300 shadow-md'
              : 'badge-outline text-blue-300 hover:bg-blue-800 hover:text-white'"
            @click="toggleItem(selectedCourses, c)"
          >
            {{ c }}
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="font-semibold text-sm opacity-70">Tags:</span>
          <button
            v-for="t in allTags"
            :key="t"
            class="badge badge-outline cursor-pointer"
            :class="selectedTags.includes(t) ? 'badge-secondary text-white' : ''"
            @click="toggleItem(selectedTags, t)"
          >
            {{ t }}
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="font-semibold text-sm opacity-70">Difficulty:</span>
          <button
            v-for="d in allDiffs"
            :key="d"
            :class="[
              'btn btn-xs capitalize',
              selectedDifficulties.includes(d)
                ? (d === 'easy'
                    ? 'btn-success'
                    : d === 'medium'
                    ? 'btn-warning'
                    : 'btn-error')
                : 'btn-outline'
            ]"
            @click="toggleItem(selectedDifficulties, d)"
          >
            {{ d }}
          </button>

          <button class="btn btn-ghost btn-xs" @click="resetFilters">Reset</button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="py-10 text-center">
        <span class="loading-spinner loading-lg loading" />
        <p class="mt-2 text-sm opacity-70">Loading problems...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="!filteredProblems.length" class="py-10 text-center text-sm opacity-70">
        No problems match your filters.
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th>#ID</th>
              <th>Title</th>
              <th>Tags</th>
              <th>Course</th>
              <th class="text-right">AC%</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredProblems" :key="p.id" class="hover">
              <td class="flex items-center gap-2">
                <span class="h-3 w-3 rounded-full" :class="DIFFICULTY_COLOR_CLASS[p.difficulty]" />
                #{{ p.id }}
              </td>
              <td>
                <router-link :to="`/problems/${p.id}`" class="link link-hover font-medium">{{ p.title }}</router-link>
              </td>
              <td><TagList :tags="p.tags" size="sm" colorMode="outline" /></td>
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