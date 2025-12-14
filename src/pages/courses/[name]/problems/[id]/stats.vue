<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { use } from "echarts/core";
import VChart from "vue-echarts";
import { TooltipComponent, LegendComponent, GridComponent } from "echarts/components";
import { PieChart, BarChart } from "echarts/charts";
import { LabelLayout } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
import { formatTime } from "@/utils/formatTime";
import { useTheme } from "@/stores/theme";
import { SUBMISSION_STATUS_REPR } from "@/constants";
import { useRoute } from "vue-router";
import { useTitle } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import api from "@/api";
const { t } = useI18n();
const route = useRoute();
const theme = useTheme();
useTitle(`Problem Stats - ${route.params.id} - ${route.params.name} | Normal OJ`);
use([TooltipComponent, LegendComponent, PieChart, CanvasRenderer, LabelLayout, GridComponent, BarChart]);
const stats = ref<ProblemStats | null>(null);
const error = ref<any>(null);
const isLoading = ref<boolean>(false);
async function getStat() {
  isLoading.value = true;
  error.value = null;

  try {
    const res = await api.Problem.getProblemStat(Number(route.params.id));
    stats.value = res.data;
  } catch (err) {
    console.error(err);
    error.value = err;
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  getStat();
});

const resultCounts = computed(() => {
  if (!stats.value) return [];
  const _stats = stats.value;
  const mapping: Record<string, number> = {
    pending: -1,
    accepted: 0,
    wrong_answer: 1,
    compile_error: 2,
    time_limit_exceed: 3,
    memory_limit_exceed: 4,
    runtime_error: 5,
    judge_error: 6,
    output_limit_exceed: 7,
  };

  return Object.entries(_stats.statusCount)
    .map(([key, count]) => {
      const code = mapping[key] ?? (Number.isFinite(Number(key)) ? Number(key) : undefined);
      if (code !== undefined && SUBMISSION_STATUS_REPR[code as keyof typeof SUBMISSION_STATUS_REPR]) {
        const { label, color } = SUBMISSION_STATUS_REPR[code as keyof typeof SUBMISSION_STATUS_REPR];
        return {
          name: label,
          value: count,
          itemStyle: { color },
        };
      }
      return {
        name: key,
        value: count,
        itemStyle: { color: "#ccc" },
      };
    })
    .filter((item) => item.value > 0);
});
const triedUserCount = computed(() => stats.value?.triedUserCount || null);
const acUserRatio = computed(() => stats.value?.acUserRatio || [null, null]);
const submissionCount = computed(() =>
  stats.value ? Object.values(stats.value?.statusCount).reduce((a, b) => a + b, 0) : null,
);
const avgScore = computed(() => (stats.value ? stats.value.average : null));
const stdScore = computed(() => (stats.value ? stats.value.std : null));
const scoreDistribution = computed(() => {
  if (!stats.value) return {};
  const counter: { [key: string]: number } = {};
  stats.value.scoreDistribution.forEach((item) => (counter[String(item.score)] = item.count));
  return counter;
});
const top10RunTime = computed(() => stats.value?.top10RunTime || []);
const top10MemoryUsage = computed(() => stats.value?.top10MemoryUsage || []);

const pieOption = computed(() => ({
  backgroundColor: "transparent",
  tooltip: {
    trigger: "item",
    formatter: "{a} <br/>{b} : {c} ({d}%)",
  },
  series: [
    {
      name: t("course.problem.stats.pieTitle"),
      type: "pie",
      radius: ["30%", "70%"],
      data: resultCounts.value.filter((item) => item.value > 0),
    },
  ],
  textStyle: {
    fontSize: 13,
  },
}));
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
    },
  ],
  textStyle: {
    fontSize: 13,
  },
}));
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body">
        <div class="card-title md:text-2xl lg:text-3xl">
          {{ t("course.problem.stats.title") }}{{ $route.params.id }}
        </div>

        <div class="my-2" />

        <data-status-wrapper :error="error" :is-loading="isLoading">
          <template #loading>
            <skeleton-card />
          </template>
          <template #data>
            <div class="stats stats-vertical lg:stats-horizontal">
              <div class="stat place-items-center">
                <div class="stat-title">{{ t("course.problem.stats.general.tried") }}</div>
                <div class="stat-value">
                  <span v-if="!triedUserCount">-</span>
                  <template v-else>
                    <span>{{ triedUserCount }}</span>
                    <span class="text-sm font-normal">{{ ` / ${acUserRatio[1]}` }}</span>
                  </template>
                </div>
              </div>
              <div class="stat place-items-center">
                <div class="stat-title">{{ t("course.problem.stats.general.ac") }}</div>
                <div class="stat-value">
                  <span v-if="!acUserRatio[1]">-</span>
                  <template v-else>
                    <span>{{ acUserRatio[0] }}</span>
                    <span class="text-sm font-normal">{{ ` / ${acUserRatio[1]}` }}</span>
                  </template>
                </div>
              </div>
              <div class="stat place-items-center">
                <div class="stat-title">{{ t("course.problem.stats.general.acRatio") }}</div>
                <div class="stat-value">
                  <span v-if="!submissionCount || !stats">-</span>
                  <template v-else>
                    <span>{{ stats.statusCount[0] }}</span>
                    <span class="text-sm font-normal">{{ ` / ${submissionCount}` }}</span>
                  </template>
                </div>
              </div>
              <div class="stat place-items-center">
                <div class="stat-title">{{ t("course.problem.stats.general.avg") }}</div>
                <div class="stat-value">{{ avgScore?.toFixed(2) || "-" }}</div>
              </div>
              <div class="stat place-items-center">
                <div class="stat-title">{{ t("course.problem.stats.general.sd") }}</div>
                <div class="stat-value">{{ stdScore?.toFixed(2) || "-" }}</div>
              </div>
            </div>

            <div class="my-4" />

            <div class="flex">
              <v-chart
                class="mx-auto h-[400px]"
                :theme="theme.isDark ? 'dark' : ''"
                :option="pieOption"
                autoresize
              />
              <v-chart
                class="mx-auto h-[400px]"
                :theme="theme.isDark ? 'dark' : ''"
                :option="barOption"
                autoresize
              />
            </div>
          </template>
        </data-status-wrapper>

        <div class="my-2" />

        <div class="card-title md:text-xl lg:text-2xl">
          {{ t("course.problem.stats.table.runtimeRank.title") }}
        </div>
        <div class="my-1" />
        <skeleton-table v-if="isLoading" :col="4" :row="10" />
        <table v-else class="table table-compact w-full">
          <thead>
            <tr>
              <th>{{ t("course.problem.stats.table.runtimeRank.id") }}</th>
              <th>{{ t("course.problem.stats.table.runtimeRank.user") }}</th>
              <th>{{ t("course.problem.stats.table.runtimeRank.runtime") }}</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(subm, index) in top10RunTime" :key="index">
              <td>{{ index + 1 }}</td>
              <td>{{ subm.user }}</td>
              <td>{{ subm.execution_time }} ms</td>
              <td>{{ subm.score }}</td>
            </tr>
          </tbody>
        </table>

        <div class="my-5" />

        <div class="card-title md:text-xl lg:text-2xl">
          {{ t("course.problem.stats.table.memoryRank.title") }}
        </div>
        <div class="my-1" />
        <skeleton-table v-if="isLoading" :col="4" :row="10" />
        <table v-else class="table table-compact w-full">
          <thead>
            <tr>
              <th>{{ t("course.problem.stats.table.memoryRank.id") }}</th>
              <th>{{ t("course.problem.stats.table.memoryRank.user") }}</th>
              <th>{{ t("course.problem.stats.table.memoryRank.memory") }}</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(subm, index) in top10MemoryUsage" :key="index">
              <td>{{ index + 1 }}</td>
              <td>{{ subm.user }}</td>
              <td>{{ subm.memory_usage }} KB</td>
              <td>{{ subm.score }}</td>
            </tr>
          </tbody>
        </table>

        <div class="my-5" />
      </div>
    </div>
  </div>
</template>
