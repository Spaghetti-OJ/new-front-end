<script setup lang="ts">
import { useTitle } from "@vueuse/core";
import { computed, watch, ref } from "vue";
import { useRoute } from "vue-router";
import { use } from "echarts/core";
import VChart from "vue-echarts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { BarChart } from "echarts/charts";
import { LabelLayout } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
import api from "@/api";
import { useTheme } from "@/stores/theme";
import dayjs from "dayjs";

const route = useRoute();
useTitle(`Homework Stats - ${route.params.id} - ${route.params.courseId} | Normal OJ`);
const theme = useTheme();
use([CanvasRenderer, LabelLayout, GridComponent, TooltipComponent, BarChart]);

const hw = ref<Homework | null>(null);
const hwError = ref<any>(null);
const isHWFetching = ref(false);

const submissionsMap = ref<Record<string, SubmissionListItem>>({});

async function fetchSubmissions() {
  if (!hw.value?.problem_ids) return;

  const requests = hw.value.problem_ids.map(
    (pid) =>
      api.Submission.list({
        problemId: String(pid),
        course: route.params.courseId as string,
        page_size: 1000,
      }).then((res: any) => res.data?.results || []), // Handle response structure
  );

  try {
    const results = await Promise.all(requests);
    const allSubmissions = results.flat();

    allSubmissions.forEach((sub: SubmissionListItem) => {
      submissionsMap.value[sub.submissionId] = sub;
    });
  } catch (e) {
    console.error("Failed to fetch submissions", e);
  }
}

async function fetchHomework() {
  isHWFetching.value = true;
  hwError.value = null;
  try {
    const res = await api.Homework.get(route.params.id as string);
    hw.value = res;
    await fetchSubmissions(); // Fetch submissions after getting homework details
  } catch (err) {
    hwError.value = err;
  } finally {
    isHWFetching.value = false;
  }
}

watch(
  () => route.params.id,
  () => {
    fetchHomework();
  },
  { immediate: true },
);

const pids = computed(() => hw.value?.problem_ids);

const scoreboardData = computed<HomeworkScoreboardData | null>(() => {
  if (!hw.value || !pids.value) return null;

  const items: HomeworkScoreboardItem[] = [];
  const statusMap = hw.value.studentStatus || {};

  Object.entries(statusMap).forEach(([username, problemsParams]) => {
    const problems = problemsParams as Record<
      string,
      { score: number; problemStatus: string | null; submissionIds?: string[] }
    >;

    let totalScore = 0;
    let firstAcTimestamp: number | null = null;
    let lastSubmissionTimestamp: number | null = null;

    const problemItems: HomeworkScoreboardItemProblem[] = pids.value!.map((pid) => {
      const pData = problems[String(pid)];
      const score = pData?.score ?? 0;
      totalScore += score;

      const subIds = pData?.submissionIds || [];

      subIds.forEach((sid) => {
        const sub = submissionsMap.value[sid];
        if (sub) {
          if (lastSubmissionTimestamp === null || sub.timestamp > lastSubmissionTimestamp) {
            lastSubmissionTimestamp = sub.timestamp;
          }
          if (sub.status === 0) {
            if (firstAcTimestamp === null || sub.timestamp < firstAcTimestamp) {
              firstAcTimestamp = sub.timestamp;
            }
          }
        }
      });

      // Map status
      let status: "unsolved" | "partial" | "solved" = "unsolved";
      if (pData?.problemStatus === "accepted") status = "solved";
      else if (score > 0) status = "partial";

      return {
        problem_id: pid,
        best_score: score,
        max_possible_score: 100, // Assumption
        solve_status: status,
      };
    });

    items.push({
      rank: 0,
      user_id: username,
      username: username,
      real_name: username,
      total_score: totalScore,
      max_total_score: pids.value!.length * 100,
      is_late: false,
      first_ac_time: firstAcTimestamp ? dayjs.unix(firstAcTimestamp).format() : null,
      last_submission_time: lastSubmissionTimestamp ? dayjs.unix(lastSubmissionTimestamp).format() : null,
      problems: problemItems,
    });
  });

  return {
    homework_id: Number(route.params.id),
    homework_title: hw.value.name,
    course_id: String(route.params.courseId),
    items,
  };
});

const isScoreboardFetching = computed(() => isHWFetching.value);
const scoreboardError = computed(() => hwError.value);

enum Columns {
  USERNAME = "username",
  TOTAL_SCORE_ASC = "total score ascending",
  TOTAL_SCORE_DESC = "total score descending",
}
const sortBy = ref<Columns>(Columns.TOTAL_SCORE_DESC);

const sortedScoreboard = computed(() => {
  if (!scoreboardData.value?.items) return [];
  const items = [...scoreboardData.value.items];

  if (sortBy.value === Columns.TOTAL_SCORE_ASC) {
    items.sort((a, b) => a.total_score - b.total_score);
  } else if (sortBy.value === Columns.TOTAL_SCORE_DESC) {
    items.sort((a, b) => {
      if (b.total_score !== a.total_score) return b.total_score - a.total_score;
      return a.username.localeCompare(b.username);
    });
  } else {
    items.sort((a, b) => a.username.localeCompare(b.username));
  }

  return items.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
});

function getCellColor(problem: HomeworkScoreboardItemProblem | undefined) {
  if (!problem) return "";
  if (problem.solve_status === "solved") return "bg-green-300 text-neutral";
  if (problem.solve_status === "partial") return "bg-yellow-200 text-neutral";
  if (problem.best_score > 0) return "bg-red-200 text-neutral"; // Unsolved but has score? usually partial covers this, but just in case
  return "bg-gray-100"; // Unsolved
}

// Chart Data
const scoreDistribution = computed(() => {
  if (!scoreboardData.value?.items) return {};
  const counter: { [key: string]: number } = {};
  scoreboardData.value.items.forEach((row) => {
    const score = String(row.total_score);
    counter[score] = (counter[score] || 0) + 1;
  });
  return counter;
});

const barOption = computed(() => ({
  backgroundColor: "transparent",
  xAxis: {
    type: "category",
    data: Object.keys(scoreDistribution.value),
  },
  yAxis: {
    type: "value",
    minInterval: 1,
  },
  series: [
    {
      data: Object.values(scoreDistribution.value),
      type: "bar",
      label: {
        show: true,
        position: "outside",
      },
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: theme.isDark ? "#3b82f6" : "#2563eb",
      },
    },
  ],
  textStyle: {
    fontSize: 13,
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
  },
}));

function exportCSV() {
  if (!sortedScoreboard.value || !pids.value) return;
  const _pids = pids.value;
  const csvHeader: string = [
    "rank",
    "username",
    "real_name",
    ..._pids.map(String),
    "is_late",
    "total_score",
  ].join(",");
  const csvBody: string = sortedScoreboard.value
    .map((row) => {
      const problemScores = _pids.map((pid: number) => {
        const problem = row.problems.find((p) => p.problem_id === pid);
        return problem ? problem.best_score : 0;
      });

      return [
        row.rank,
        row.username,
        row.real_name,
        ...problemScores,
        row.is_late ? "Yes" : "No",
        row.total_score,
      ].join(",");
    })
    .join("\n");

  const csvData = new Blob([`${csvHeader}\n${csvBody}`], {
    type: "text/csv;charset=utf-8",
  });
  const csvURL = URL.createObjectURL(csvData);
  const link = document.createElement("a");
  link.href = csvURL;
  link.download = `${route.params.courseId}-${hw.value?.name ?? "homework"}-scoreboard.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<template>
  <div class="p-2 pb-40">
    <div class="card min-w-full">
      <div class="card-body">
        <div class="card-title">Stats - {{ hw && hw.name }}</div>

        <div class="flex">
          <v-chart
            class="mx-auto h-[400px] w-full"
            :theme="theme.isDark ? 'dark' : ''"
            :option="barOption"
            autoresize
          />
        </div>

        <div class="mb-4 mt-8 flex items-center justify-between">
          <div class="card-title">Scoreboard</div>
          <div class="flex gap-2">
            <select
              v-model="sortBy"
              class="select select-bordered select-sm w-full max-w-xs"
              aria-label="Sort scoreboard"
            >
              <option :value="Columns.USERNAME">Sort by Username</option>
              <option :value="Columns.TOTAL_SCORE_DESC">Sort by Score (Desc)</option>
              <option :value="Columns.TOTAL_SCORE_ASC">Sort by Score (Asc)</option>
            </select>
            <button class="btn btn-sm" @click="exportCSV" aria-label="Export scoreboard as CSV">
              Export CSV
            </button>
            <button
              class="btn btn-primary btn-sm"
              :class="{ loading: isScoreboardFetching }"
              @click="fetchHomework"
              aria-label="Refresh scoreboard data"
            >
              Refresh
            </button>
          </div>
        </div>

        <data-status-wrapper
          :error="hwError || scoreboardError"
          :is-loading="isHWFetching && !scoreboardData"
        >
          <!-- Show loading state for initial fetch -->
          <template #loading>
            <skeleton-table :col="pids ? pids.length + 4 : 5" :row="10" />
          </template>

          <template #data>
            <div class="overflow-x-auto">
              <table class="table table-compact w-full">
                <thead>
                  <tr>
                    <th class="w-16 text-center">Rank</th>
                    <th>User</th>
                    <th class="w-16 text-center" v-for="pid in pids" :key="pid">{{ pid }}</th>
                    <th class="w-24 text-center">Total</th>
                  </tr>
                </thead>
                <tbody class="font-mono text-base">
                  <tr v-for="row in sortedScoreboard" :key="row.user_id">
                    <td class="text-center text-lg font-bold">{{ row.rank }}</td>
                    <td>
                      <div class="flex flex-col">
                        <span class="font-bold">{{ row.username }}</span>
                        <span class="text-xs opacity-70">{{ row.real_name }}</span>
                        <span v-if="row.is_late" class="badge badge-warning badge-xs mt-1">Late</span>
                      </div>
                    </td>
                    <td v-for="pid in pids" :key="pid" class="border-x border-base-200 p-0">
                      <div
                        class="flex h-16 h-full w-full flex-col items-center justify-center py-2"
                        :class="getCellColor(row.problems.find((p) => p.problem_id === pid))"
                      >
                        <template v-if="row.problems.find((p) => p.problem_id === pid)">
                          <div class="font-bold">
                            {{ row.problems.find((p) => p.problem_id === pid)?.best_score }}
                          </div>
                          <!-- Optional: show max score if different -->
                        </template>
                        <div v-else class="text-gray-300">-</div>
                      </div>
                    </td>
                    <td class="text-center text-lg font-bold">
                      {{ row.total_score }}
                      <div class="text-[10px] font-normal opacity-50">/ {{ row.max_total_score }}</div>
                    </td>
                  </tr>
                  <tr v-if="sortedScoreboard.length === 0">
                    <td :colspan="(pids?.length || 0) + 3" class="py-8 text-center opacity-50">
                      No submissions found.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </data-status-wrapper>
      </div>
    </div>
  </div>
</template>
