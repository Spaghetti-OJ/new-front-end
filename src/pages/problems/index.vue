<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useTitle } from "@vueuse/core";

useTitle("Problems | Normal OJ");

type Problem = {
  id: number;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  course: string;
  acceptance: number;
};

// ---- 假資料 ----
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

// ---- 篩選狀態 ----
const q = ref("");
const selectedCourse = ref("");
const selectedTag = ref("");
const selectedDifficulty = ref<"" | "easy" | "medium" | "hard">("");

// 下拉的選項（可之後由 API 生）
const allCourses = ref(["程式設計入門", "資料結構", "演算法導論"]);
const allTags = ref(["dynamic programming", "linked list", "graph", "math"]);

// ---- 過濾後的清單 ----
const problems = computed(() => {
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

function clearFilters() {
  q.value = "";
  selectedCourse.value = "";
  selectedTag.value = "";
  selectedDifficulty.value = "";
}

onMounted(() => {
  // 之後接 API 就在這裡載入
});
</script>

<template>
  <div class="mx-auto mt-8 max-w-6xl">
    <!-- Filter Bar -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <!-- Search -->
      <label class="input input-bordered input-sm flex w-80 items-center gap-2">
        <input v-model="q" type="text" class="grow" placeholder="search problem" />
        <i class="i-uil-search" />
      </label>

      <!-- Course -->
      <select v-model="selectedCourse" class="select select-bordered select-sm w-56">
        <option value="">▽ courses selection</option>
        <option v-for="c in allCourses" :key="c" :value="c">{{ c }}</option>
      </select>

      <!-- Tags -->
      <select v-model="selectedTag" class="select select-bordered select-sm w-56">
        <option value="">▽ tags selection</option>
        <option v-for="t in allTags" :key="t" :value="t">{{ t }}</option>
      </select>

      <!-- Difficulty chips -->
      <div class="flex items-center gap-2">
        <button class="btn btn-xs gap-2" :class="selectedDifficulty === 'hard' ? 'btn-error' : 'btn-ghost'"
          @click="selectedDifficulty = selectedDifficulty === 'hard' ? '' : 'hard'">
          <span class="h-2 w-2 rounded-full bg-red-500"></span> hard
        </button>
        <button class="btn btn-xs gap-2" :class="selectedDifficulty === 'medium' ? 'btn-warning' : 'btn-ghost'"
          @click="selectedDifficulty = selectedDifficulty === 'medium' ? '' : 'medium'">
          <span class="h-2 w-2 rounded-full bg-yellow-400"></span> medium
        </button>
        <button class="btn btn-xs gap-2" :class="selectedDifficulty === 'easy' ? 'btn-success' : 'btn-ghost'"
          @click="selectedDifficulty = selectedDifficulty === 'easy' ? '' : 'easy'">
          <span class="h-2 w-2 rounded-full bg-green-500"></span> easy
        </button>

        <button class="btn btn-ghost btn-xs" @click="clearFilters">Reset</button>
      </div>
    </div>

    <!-- List with ProblemInfo -->
    <div class="card shadow-xl">
      <div class="card-body">
        <table class="table w-full">
          <thead>
            <tr>
              <th class="w-20">{{ $t("problems.table.id") }}</th>
              <th>{{ $t("problems.table.name") }}</th>
              <th class="w-1/3">{{ $t("problems.table.tags") }}</th>
              <th class="w-24 text-right">{{ $t("problems.table.ac") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in problems" :key="p.id" class="hover">
              <td>{{ p.id }}</td>
              <td>{{ p.title }}</td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span v-for="t in p.tags" :key="t" class="badge badge-ghost">{{ t }}</span>
                </div>
              </td>
              <td class="text-right">{{ Math.round(p.acceptance * 100) }}%</td>
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
