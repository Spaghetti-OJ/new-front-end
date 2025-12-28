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
import { useI18n } from "vue-i18n";

const route = useRoute();
const { t } = useI18n();
useTitle(
  computed(() =>
    t("course.hw.stats.pageTitle", {
      id: route.params.id,
      courseId: route.params.courseId,
    }),
  ),
);
const theme = useTheme();
use([CanvasRenderer, LabelLayout, GridComponent, TooltipComponent, BarChart]);

const hw = ref<Homework | null>(null);
const hwError = ref<any>(null);
const submissionsError = ref<unknown>(null);
const isHWFetching = ref(false);
const submissions = ref<SubmissionListItem[]>([]);
const combinedError = computed(() => hwError.value ?? submissionsError.value);

async function fetchHomework() {
  isHWFetching.value = true;
  hwError.value = null;
  try {
    const hwRes = await api.Homework.get(route.params.id as string);
    hw.value = hwRes;
    await fetchSubmissions();
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

const pids = computed(() => {
  if (!hw.value) return undefined;
  return (
    (hw.value as Homework & { problemIds?: number[] }).problem_ids ??
    (hw.value as Homework & { problemIds?: number[] }).problemIds
  );
});

function toUnixSeconds(timestamp: string): number | null {
  const ms = Date.parse(timestamp);
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / 1000);
}

async function fetchSubmissionsForProblem(problemId: number, after?: number, before?: number) {
  const results: SubmissionListItem[] = [];
  const pageSize = 200;
  let page = 1;

  while (true) {
    const data = await api.Submission.list({
      problem_id: String(problemId),
      course_id: route.params.courseId as string,
      page,
      page_size: pageSize,
      ...(after != null ? { after } : {}),
      ...(before != null ? { before } : {}),
    });

    const batch = data.results ?? [];
    results.push(...batch);

    const rawCount = (data as { count?: unknown }).count;
    const count =
      typeof rawCount === "number" && Number.isFinite(rawCount) && rawCount >= 0 ? rawCount : undefined;
    if ((count != null && results.length >= count) || batch.length === 0 || batch.length < pageSize) break;
    page += 1;
  }

  return results;
}

async function fetchSubmissions() {
  if (!hw.value) {
    submissions.value = [];
    return;
  }
  if (!pids.value?.length) {
    submissions.value = [];
    return;
  }

  submissionsError.value = null;
  const after = hw.value.start != null ? Number(hw.value.start) : undefined;
  const before = hw.value.end != null ? Number(hw.value.end) : undefined;
  try {
    const results = await Promise.all(
      pids.value.map((pid) => fetchSubmissionsForProblem(pid, after, before)),
    );
    submissions.value = results.flat();
  } catch (err) {
    submissionsError.value = err;
    submissions.value = [];
  }
}

const scoreboardData = computed<HomeworkScoreboardData | null>(() => {
  if (!hw.value || !pids.value?.length) return null;

  const maxScorePerProblem = 100;
  const endTime = hw.value.end != null ? Number(hw.value.end) : null;
  type HomeworkScoreboardItemInternal = HomeworkScoreboardItem & {
    _lastSubmissionTs?: number | null;
    _firstAcTs?: number | null;
  };
  const itemsByUser = new Map<string, HomeworkScoreboardItemInternal>();

  submissions.value.forEach((sub) => {
    const userKey = sub.user?.username ?? sub.user?.id;
    if (!userKey) return;

    let item = itemsByUser.get(userKey);
    if (!item) {
      item = {
        rank: 0,
        user_id: sub.user?.id ?? userKey,
        username: sub.user?.username ?? userKey,
        real_name: sub.user.real_name || "",
        total_score: 0,
        max_total_score: pids.value!.length * maxScorePerProblem,
        is_late: false,
        first_ac_time: null,
        last_submission_time: null,
        problems: {},
        _lastSubmissionTs: null,
        _firstAcTs: null,
      };
      itemsByUser.set(userKey, item);
    }

    const ts = sub.timestamp ? toUnixSeconds(sub.timestamp) : null;
    if (ts != null) {
      const lastTs = item._lastSubmissionTs ?? null;
      if (lastTs == null || ts > lastTs) {
        item._lastSubmissionTs = ts;
      }
      const isAccepted = Number(sub.status) === 0;
      const firstTs = item._firstAcTs ?? null;
      if (isAccepted && (firstTs == null || ts < firstTs)) {
        item._firstAcTs = ts;
      }
      if (endTime != null) {
        const endTimeSeconds = endTime > 1e11 ? Math.floor(endTime / 1000) : endTime;
        if (ts > endTimeSeconds) {
          item.is_late = true;
        }
      }
    }

    const pid = sub.problemId;
    const problems = item.problems as Record<number, HomeworkScoreboardItemProblem>;
    const existing = problems[pid] ?? {
      problem_id: pid,
      best_score: 0,
      max_possible_score: maxScorePerProblem,
      solve_status: "unsolved" as const,
    };
    const score = Number(sub.score) || 0;
    if (score > existing.best_score) {
      existing.best_score = score;
      if (existing.best_score >= maxScorePerProblem) existing.solve_status = "solved";
      else if (existing.best_score > 0) existing.solve_status = "partial";
      else existing.solve_status = "unsolved";
    }
    problems[pid] = existing;
  });

  const items = Array.from(itemsByUser.values()).map((item) => {
    const problems = item.problems as Record<number, HomeworkScoreboardItemProblem>;
    let totalScore = 0;
    pids.value!.forEach((pid) => {
      const existing = problems[pid] ?? {
        problem_id: pid,
        best_score: 0,
        max_possible_score: maxScorePerProblem,
        solve_status: "unsolved" as const,
      };
      if (existing.best_score >= maxScorePerProblem) existing.solve_status = "solved";
      else if (existing.best_score > 0) existing.solve_status = "partial";
      else existing.solve_status = "unsolved";
      problems[pid] = existing;
      totalScore += existing.best_score;
    });

    return {
      ...item,
      last_submission_time:
        item._lastSubmissionTs != null ? new Date(item._lastSubmissionTs * 1000).toISOString() : null,
      first_ac_time: item._firstAcTs != null ? new Date(item._firstAcTs * 1000).toISOString() : null,
      total_score: totalScore,
      max_total_score: pids.value!.length * maxScorePerProblem,
      problems,
    };
  });

  return {
    homework_id: Number(route.params.id),
    homework_title: hw.value.name,
    course_id: String(route.params.courseId),
    items,
  };
});

enum Columns {
  USERNAME = "username",
  TOTAL_SCORE_ASC = "totalScoreAsc",
  TOTAL_SCORE_DESC = "totalScoreDesc",
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
    t("course.hw.stats.csv.rank"),
    t("course.hw.stats.csv.username"),
    t("course.hw.stats.csv.realName"),
    ..._pids.map(String),
    t("course.hw.stats.csv.isLate"),
    t("course.hw.stats.csv.totalScore"),
  ].join(",");
  const csvBody: string = sortedScoreboard.value
    .map((row) => {
      const problemScores = _pids.map((pid: number) => {
        const problem = row.problems[pid];
        return problem ? problem.best_score : 0;
      });

      return [
        row.rank,
        row.username,
        row.real_name,
        ...problemScores,
        row.is_late ? t("course.hw.stats.csv.yes") : t("course.hw.stats.csv.no"),
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
        <div class="card-title">{{ t("course.hw.stats.statsTitle", { name: hw?.name ?? "-" }) }}</div>

        <div class="flex">
          <v-chart
            class="mx-auto h-[400px] w-full"
            :theme="theme.isDark ? 'dark' : ''"
            :option="barOption"
            autoresize
          />
        </div>

        <div class="mb-4 mt-8 flex items-center justify-between">
          <div class="card-title">{{ t("course.hw.stats.scoreboardTitle") }}</div>
          <div class="flex gap-2">
            <select
              v-model="sortBy"
              class="select select-bordered select-sm w-full max-w-xs"
              :aria-label="t('course.hw.stats.sort.aria')"
            >
              <option :value="Columns.USERNAME">{{ t("course.hw.stats.sort.username") }}</option>
              <option :value="Columns.TOTAL_SCORE_DESC">{{ t("course.hw.stats.sort.scoreDesc") }}</option>
              <option :value="Columns.TOTAL_SCORE_ASC">{{ t("course.hw.stats.sort.scoreAsc") }}</option>
            </select>
            <button class="btn btn-sm" @click="exportCSV" :aria-label="t('course.hw.stats.exportAria')">
              {{ t("course.hw.stats.exportCsv") }}
            </button>
          </div>
        </div>

        <data-status-wrapper :error="combinedError" :is-loading="isHWFetching && !scoreboardData">
          <!-- Show loading state for initial fetch -->
          <template #loading>
            <skeleton-table :col="pids ? pids.length + 4 : 5" :row="10" />
          </template>

          <template #data>
            <div class="overflow-x-auto">
              <table class="table table-compact w-full">
                <thead>
                  <tr>
                    <th class="w-16 text-center">{{ t("course.hw.stats.table.rank") }}</th>
                    <th>{{ t("course.hw.stats.table.user") }}</th>
                    <th class="w-16 text-center" v-for="pid in pids" :key="pid">{{ pid }}</th>
                    <th class="w-24 text-center">{{ t("course.hw.stats.table.total") }}</th>
                  </tr>
                </thead>
                <tbody class="font-mono text-base">
                  <tr v-for="row in sortedScoreboard" :key="row.user_id">
                    <td class="text-center text-lg font-bold">{{ row.rank }}</td>
                    <td>
                      <div class="flex flex-col">
                        <span class="font-bold">{{ row.username }}</span>
                        <span class="text-xs opacity-70">{{ row.real_name }}</span>
                        <span v-if="row.is_late" class="badge badge-warning badge-xs mt-1">{{
                          t("course.hw.stats.table.late")
                        }}</span>
                      </div>
                    </td>
                    <td v-for="pid in pids" :key="pid" class="border-x border-base-200 p-0">
                      <div
                        class="flex h-16 w-full flex-col items-center justify-center py-2"
                        :class="getCellColor(row.problems[pid])"
                      >
                        <template v-if="row.problems[pid]">
                          <div class="font-bold">
                            {{ row.problems[pid]?.best_score }}
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
                      {{ t("course.hw.stats.table.empty") }}
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
