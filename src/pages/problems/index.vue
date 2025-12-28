<script setup lang="ts">
import { ref, onMounted, computed, watch, onBeforeUnmount } from "vue";
import { useTitle } from "@vueuse/core";
import { DIFFICULTY, DIFFICULTY_COLOR_CLASS } from "@/constants";
import TagList from "@/components/Shared/TagList.vue";
import api from "@/api";
useTitle("Problems | Normal OJ");

type Problem = {
  id: number;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  courseId: number;
  courseName: string;
  acceptance: number;
};

function extractProblemList(raw: ProblemListResponseLike | null | undefined): RawProblemItem[] {
  if (!raw) return [];
  return raw.items ?? raw.results ?? raw.data?.items ?? raw.data?.results ?? [];
}

function extractSearchItems(raw: ProblemSearchResponseLike | null | undefined): RawProblemItem[] {
  if (!raw) return [];
  return raw.data?.items ?? raw.items ?? raw.results ?? [];
}

const isLoading = ref(true);
const baseProblems = ref<Problem[]>([]);
const fullProblems = ref<Problem[]>([]);
const likedOnly = ref(false);

function mapProblemList(list: RawProblemItem[]): Problem[] {
  return list.map((p) => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty as Problem["difficulty"],
    tags: Array.isArray(p.tags) ? p.tags.map((t) => (typeof t === "string" ? t : t.name)) : [],
    courseId: p.course_id != null ? Number(p.course_id) : -1,
    courseName: typeof p.course_name === "string" ? p.course_name : "-",
    acceptance: p.acceptance_rate != null ? Number(p.acceptance_rate) / 100 : 0,
  }));
}

async function getProblem() {
  isLoading.value = true;
  try {
    const res = await api.Problem.getProblemList();

    const rawData = (res as { data?: ProblemListResponseLike }).data ?? (res as ProblemListResponseLike);
    const list = extractProblemList(rawData);

    const mapped = mapProblemList(list);
    baseProblems.value = mapped;
    fullProblems.value = mapped;
  } catch (err) {
    console.error("getProblem error:", err);
    baseProblems.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function getLikedProblems() {
  isLoading.value = true;
  try {
    const res = await api.Problem.listLiked();
    const rawData = (res as { data?: ProblemListResponseLike }).data ?? (res as ProblemListResponseLike);
    const list = extractProblemList(rawData);
    baseProblems.value = mapProblemList(list);
  } catch (err) {
    console.error("getLikedProblems error:", err);
    baseProblems.value = [];
    fullProblems.value = [];
  } finally {
    isLoading.value = false;
  }
}
// Search and filters
const q = ref("");
const searchTimer = ref<number | null>(null);
const selectedCourses = ref<number[]>([]);
// 改成純字串，不使用 ProblemTag
const selectedTags = ref<string[]>([]);
const selectedDifficulties = ref<string[]>([]);

// 由資料動態取出所有標籤（不使用 TAGS_COLOR_REPR）
const filterSource = computed(() =>
  likedOnly.value && fullProblems.value.length ? fullProblems.value : baseProblems.value,
);
const allTags = computed(() => Array.from(new Set(filterSource.value.flatMap((p) => p.tags))).sort());

const allCourses = computed(() => {
  const map = new Map<number, string>();
  filterSource.value.forEach((p) => {
    if (p.courseId !== -1) {
      map.set(p.courseId, p.courseName);
    }
  });
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
});

const allDiffs = [
  { value: DIFFICULTY.EASY, labelKey: "problems.difficulty.easy" },
  { value: DIFFICULTY.MEDIUM, labelKey: "problems.difficulty.medium" },
  { value: DIFFICULTY.HARD, labelKey: "problems.difficulty.hard" },
];

const filteredProblems = computed(() => {
  const keyword = q.value.trim().toLowerCase();
  return baseProblems.value.filter((p) => {
    const matchKeyword =
      !keyword ||
      p.title.toLowerCase().includes(keyword) ||
      `${p.id}`.includes(keyword) ||
      p.tags.some((t) => t.toLowerCase().includes(keyword));

    const matchCourse = !selectedCourses.value.length || selectedCourses.value.includes(p.courseId);
    const matchTag = !selectedTags.value.length || p.tags.some((t) => selectedTags.value.includes(t));
    const matchDiff = !selectedDifficulties.value.length || selectedDifficulties.value.includes(p.difficulty);

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
  likedOnly.value = false;
}
async function searchProblems() {
  if (likedOnly.value) return;
  const keyword = q.value.trim();
  if (!keyword) {
    // 你要：空字串 Enter 就回到原本列表
    await getProblem();
    return;
  }

  isLoading.value = true;
  try {
    const res = await api.Problem.searchGlobal(keyword);

    const raw = (res as { data?: ProblemSearchResponseLike }).data ?? (res as ProblemSearchResponseLike);
    const items = extractSearchItems(raw);
    const mapped = mapProblemList(items);
    baseProblems.value = mapped;
    fullProblems.value = mapped;
  } catch (err) {
    console.error("searchProblems error:", err);
    baseProblems.value = [];
  } finally {
    isLoading.value = false;
  }
}
onMounted(async () => {
  getProblem();
});

watch(
  q,
  (value) => {
    if (likedOnly.value) return;
    if (searchTimer.value !== null) {
      window.clearTimeout(searchTimer.value);
    }
    searchTimer.value = window.setTimeout(() => {
      if (value.trim()) {
        searchProblems();
      } else {
        getProblem();
      }
    }, 300);
  },
  { flush: "post" },
);

watch(
  likedOnly,
  async (value) => {
    if (value) {
      await getLikedProblems();
      return;
    }

    if (q.value.trim()) {
      await searchProblems();
    } else {
      await getProblem();
    }
  },
  { flush: "post" },
);

onBeforeUnmount(() => {
  if (searchTimer.value != null) {
    window.clearTimeout(searchTimer.value);
  }
});
</script>

<template>
  <div class="card mx-auto max-w-6xl shadow-xl">
    <div class="card-body">
      <!-- Title & Search -->
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
            @keyup.enter="searchProblems"
            :disabled="likedOnly"
          />
          <i class="i-uil-search" />
        </label>
      </div>

      <!-- Filters -->
      <div class="mb-4 space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-semibold opacity-70">{{ $t("problems.filter.Courses") }}</span>
          <button
            v-for="c in allCourses"
            :key="c.id"
            class="badge cursor-pointer transition-all duration-150"
            :class="
              selectedCourses.includes(c.id)
                ? 'badge-primary text-white shadow-md'
                : 'badge-outline hover:bg-primary hover:text-white'
            "
            @click="toggleItem(selectedCourses, c.id)"
          >
            {{ c.name }}
          </button>
        </div>

        <!-- Tags filter：改用 allTags（純字串），不使用顏色 -->
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-semibold opacity-70">{{ $t("problems.filter.Tags") }}</span>
          <button
            v-for="t in allTags"
            :key="t"
            class="badge cursor-pointer transition-all duration-150"
            :class="
              selectedTags.includes(t)
                ? 'badge-primary text-white'
                : 'badge-outline hover:bg-primary hover:text-white'
            "
            @click="toggleItem(selectedTags, t)"
          >
            {{ t }}
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-semibold opacity-70">{{ $t("problems.filter.Difficulty") }}</span>
          <button
            v-for="d in allDiffs"
            :key="d.value"
            :class="[
              'btn btn-xs gap-2 capitalize',
              selectedDifficulties.includes(d.value)
                ? d.value === DIFFICULTY.EASY
                  ? 'btn-success'
                  : d.value === DIFFICULTY.MEDIUM
                  ? 'btn-warning'
                  : 'btn-error'
                : 'btn-outline',
            ]"
            @click="toggleItem(selectedDifficulties, d.value)"
          >
            <span
              class="h-2.5 w-2.5 rounded-full"
              :class="
                d.value === DIFFICULTY.EASY
                  ? 'bg-green-500'
                  : d.value === DIFFICULTY.MEDIUM
                  ? 'bg-yellow-400'
                  : 'bg-red-500'
              "
            ></span>
            {{ $t(d.labelKey) }}
          </button>

          <button class="btn btn-ghost btn-xs" @click="resetFilters">
            {{ $t("problems.difficulty.reset") }}
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-semibold opacity-70"></span>
          <button
            class="btn btn-xs gap-2"
            :class="likedOnly ? 'btn-primary' : 'btn-outline'"
            @click="likedOnly = !likedOnly"
          >
            <i-uil-heart class="h-3 w-3" />
            {{ $t("problems.filter.liked") }}
          </button>
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
                <router-link
                  :to="`/courses/${p.courseId}/problems/${p.id}`"
                  class="link link-hover font-medium"
                  >{{ p.title }}</router-link
                >
              </td>
              <td>
                <TagList :tags="p.tags" size="md" colorMode="outline" />
              </td>
              <td>{{ p.courseName }}</td>
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
