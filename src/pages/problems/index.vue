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
  {
    id: 765,
    title: "Emergency Dispatch 1",
    difficulty: "hard",
    tags: ["linked list", "dynamic programming"],
    course: "資料結構",
    acceptance: 0.0,
  },
  {
    id: 764,
    title: "Emergency Dispatch 2",
    difficulty: "medium",
    tags: ["dynamic programming"],
    course: "演算法導論",
    acceptance: 0.1,
  },
  {
    id: 763,
    title: "Emergency Dispatch 3",
    difficulty: "easy",
    tags: ["math"],
    course: "程式設計入門",
    acceptance: 0.2,
  },
  {
    id: 762,
    title: "Emergency Dispatch 4",
    difficulty: "medium",
    tags: ["graph", "dynamic programming"],
    course: "演算法導論",
    acceptance: 0.8,
  },
  {
    id: 761,
    title: "Emergency Dispatch 5",
    difficulty: "easy",
    tags: ["linked list"],
    course: "資料結構",
    acceptance: 0.8,
  },
]);

// Search and filters
const q = ref("");
const selectedCourses = ref<string[]>([]);
// 改成純字串，不使用 ProblemTag
const selectedTags = ref<string[]>([]);
const selectedDifficulties = ref<string[]>([]);

// 由資料動態取出所有標籤（不使用 TAGS_COLOR_REPR）
const allTags = computed(() =>
  Array.from(new Set(baseProblems.value.flatMap(p => p.tags))).sort()
);

const allCourses = computed(() => Array.from(new Set(baseProblems.value.map((p) => p.course))));
const allDiffs = ["easy", "medium", "hard"];

const filteredProblems = computed(() => {
  const keyword = q.value.trim().toLowerCase();
  return baseProblems.value.filter((p) => {
    const matchKeyword =
      !keyword ||
      p.title.toLowerCase().includes(keyword) ||
      `${p.id}`.includes(keyword) ||
      p.tags.some((t) => t.toLowerCase().includes(keyword));

    const matchCourse = !selectedCourses.value.length || selectedCourses.value.includes(p.course);
    const matchTag =
      !selectedTags.value.length || p.tags.some((t) => selectedTags.value.includes(t));
    const matchDiff =
      !selectedDifficulties.value.length || selectedDifficulties.value.includes(p.difficulty);

    return matchKeyword && matchCourse && matchTag && matchDiff;
  });
});

// toggle 改成泛型，支援不同型別的 list
function toggleItem<T>(list: T[], item: T) {
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
        <h1 class="text-lg font-bold">{{ $t("problems.title") }}</h1>
        <label
          class="input input-sm flex w-72 items-center gap-2 border border-base-content/30 bg-transparent focus-within:border-primary">
          <input v-model="q" type="text" class="grow bg-transparent outline-none"
            :placeholder="$t('problems.search.placeholder')" />
          <i class="i-uil-search" />
        </label>
      </div>

      <!-- Filters -->
      <div class="mb-4 space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-semibold opacity-70">Courses:</span>
          <button v-for="c in allCourses" :key="c" class="badge cursor-pointer transition-all duration-150" :class="selectedCourses.includes(c)
            ? 'border border-blue-300 bg-blue-500 text-white shadow-md'
            : 'badge-outline text-blue-300 hover:bg-blue-800 hover:text-white'
            " @click="toggleItem(selectedCourses, c)">
            {{ c }}
          </button>
        </div>

        <!-- Tags filter：改用 allTags（純字串），不使用顏色 -->
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-semibold opacity-70">Tags:</span>
          <button v-for="t in allTags" :key="t" class="badge cursor-pointer transition-colors"
            :class="selectedTags.includes(t) ? 'badge-primary text-white' : 'badge-outline'"
            @click="toggleItem(selectedTags, t)">
            {{ t }}
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-semibold opacity-70">Difficulty:</span>
          <button v-for="d in allDiffs" :key="d" :class="[
            'btn btn-xs capitalize gap-2',
            selectedDifficulties.includes(d)
              ? d === 'easy'
                ? 'btn-success'
                : d === 'medium'
                  ? 'btn-warning'
                  : 'btn-error'
              : 'btn-outline',
          ]" @click="toggleItem(selectedDifficulties, d)">
            <span class="h-2.5 w-2.5 rounded-full" :class="d === 'easy'
              ? 'bg-green-500'
              : d === 'medium'
                ? 'bg-yellow-400'
                : 'bg-red-500'"></span>
            {{ d }}
          </button>

          <button class="btn btn-ghost btn-xs" @click="resetFilters">{{ $t("problems.difficulty.reset") }}</button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="py-10 text-center">
        <span class="loading-spinner loading-lg loading" />
        <p class="mt-2 text-sm opacity-70">{{ $t("problems.loading") }}</p>
      </div>

      <!-- Empty -->
      <div v-else-if="!filteredProblems.length" class="py-10 text-center text-sm opacity-70">
        {{ $t("problems.empty") }}
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th>{{ $t("problems.table.id") }}</th>
              <th>{{ $t("problems.table.name") }}</th>
              <th>{{ $t("problems.table.tags") }}</th>
              <th>{{ $t("problems.table.course") }}</th>
              <th class="text-right">{{ $t("problems.table.ac") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredProblems" :key="p.id" class="hover">
              <td class="flex items-center gap-2">
                <span class="h-3 w-3 rounded-full" :class="DIFFICULTY_COLOR_CLASS[p.difficulty]" />
                #{{ p.id }}
              </td>
              <td>
                <router-link :to="`/problems/${p.id}`" class="link link-hover font-medium">{{
                  p.title
                  }}</router-link>
              </td>
              <td>
                <TagList :tags="p.tags" size="md" colorMode="outline" />
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
