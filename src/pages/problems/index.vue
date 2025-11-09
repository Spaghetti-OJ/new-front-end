<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useTitle } from "@vueuse/core";
import TagList from "@/components/Shared/TagList.vue";
import AIVtuberAssistant from "@/components/Shared/AIVtuberAssistant.vue";

useTitle("Problems | Normal OJ");

const problems = ref<any[]>([]);
const isLoading = ref(true);
const error = ref<Error | null>(null);

// ✅ 假資料
const mockProblems = [
  {
    id: 765,
    title: "Emergency Medical Dispatch 1",
    difficulty: "hard",
    tags: ["linked list", "dynamic programming"],
    course: "資料結構",
    acceptance: 0.0,
  },
  {
    id: 764,
    title: "Emergency Medical Dispatch 2",
    difficulty: "medium",
    tags: ["dynamic programming"],
    course: "演算法導論",
    acceptance: 0.1,
  },
  {
    id: 763,
    title: "Emergency Medical Dispatch 3",
    difficulty: "easy",
    tags: ["math"],
    course: "程式設計入門",
    acceptance: 0.2,
  },
  {
    id: 762,
    title: "Emergency Medical Dispatch 4",
    difficulty: "medium",
    tags: ["graph", "dynamic programming"],
    course: "演算法導論",
    acceptance: 0.8,
  },
  {
    id: 761,
    title: "Emergency Medical Dispatch 5",
    difficulty: "easy",
    tags: ["linked list"],
    course: "資料結構",
    acceptance: 0.8,
  },
];

// ✅ 篩選條件
const selectedDifficulty = ref("");
const selectedTag = ref("");
const selectedCourse = ref("");
const allTags = ["dynamic programming", "linked list", "graph", "math"];
const allCourses = ["程式設計入門", "資料結構", "演算法導論"];

function applyFilters() {
  problems.value = mockProblems.filter((p) => {
    const matchDifficulty = !selectedDifficulty.value || p.difficulty === selectedDifficulty.value;
    const matchTag = !selectedTag.value || p.tags.includes(selectedTag.value);
    const matchCourse = !selectedCourse.value || p.course === selectedCourse.value;
    return matchDifficulty && matchTag && matchCourse;
  });
}

function resetFilters() {
  selectedDifficulty.value = "";
  selectedTag.value = "";
  selectedCourse.value = "";
  problems.value = mockProblems;
}

// ✅ 初始化
onMounted(() => {
  console.log("💡 Using mockProblems as default data");
  problems.value = mockProblems;
  isLoading.value = false;
});
</script>

<template>
  <div class="card mx-auto max-w-6xl shadow-xl">
    <div class="card-body">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-lg font-bold">Problem List</h1>
        <input
          type="text"
          placeholder="Search problem..."
          class="input input-bordered input-sm w-64"
        />
      </div>

      <!-- ✅ 篩選列 -->
      <div class="mb-4 flex flex-wrap gap-3 items-center">
        <select v-model="selectedDifficulty" class="select select-bordered select-sm w-40">
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <select v-model="selectedTag" class="select select-bordered select-sm w-48">
          <option value="">All Tags</option>
          <option v-for="tag in allTags" :key="tag" :value="tag">{{ tag }}</option>
        </select>

        <select v-model="selectedCourse" class="select select-bordered select-sm w-48">
          <option value="">All Courses</option>
          <option v-for="course in allCourses" :key="course" :value="course">
            {{ course }}
          </option>
        </select>

        <button class="btn btn-primary btn-sm" @click="applyFilters">Apply Filters</button>
        <button class="btn btn-ghost btn-sm" @click="resetFilters">Reset</button>
      </div>

      <!-- ✅ 題目表格 -->
      <div v-if="isLoading" class="py-10 text-center">
        <span class="loading-spinner loading-lg loading"></span>
        <p class="mt-2 text-sm opacity-70">Loading problems...</p>
      </div>

      <table v-else class="table w-full">
        <thead>
          <tr>
            <th>#ID</th>
            <th>Problem Title</th>
            <th>Tags</th>
            <th>Course</th>
            <th class="text-right">AC ratio (%)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in problems" :key="p.id" class="hover">
            <td class="flex items-center gap-2">
              <span
                class="h-3 w-3 rounded-full"
                :class="{
                  'bg-red-500': p.difficulty === 'hard',
                  'bg-yellow-400': p.difficulty === 'medium',
                  'bg-green-500': p.difficulty === 'easy',
                }"
              ></span>
              #{{ p.id }}
            </td>
            <td>
              <router-link :to="`/problems/${p.id}`" class="link link-hover font-medium">
                {{ p.title }}
              </router-link>
            </td>
            <td><TagList :tags="p.tags" size="sm" colorMode="outline" /></td>
            <td>{{ p.course }}</td>
            <td class="text-right">
              {{ p.acceptance != null ? (p.acceptance * 100).toFixed(0) + "%" : "—" }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- ✅ AI Vtuber Assistant -->
      <div class="mt-10">
        <AIVtuberAssistant />
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
.badge {
  background-color: rgba(255, 255, 255, 0.08);
  color: #f3f3f3;
  border: none;
}
</style>