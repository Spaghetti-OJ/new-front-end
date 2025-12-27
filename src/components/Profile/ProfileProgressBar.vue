<script setup lang="ts">
import { CalendarHeatmap } from "vue3-calendar-heatmap";
import "vue3-calendar-heatmap/dist/style.css";
import { useI18n } from "vue-i18n";
import { useTheme } from "@/stores/theme";

const { t } = useI18n();
const theme = useTheme();

const props = withDefaults(
  defineProps<{
    contributions?: HeatmapValue[];
    submission?: number;
    acceptance?: number;
    totalsolved?: number;
    data?: DifficultyStats;
    beatrate?: number;
  }>(),
  {
    contributions: () => [],
    submission: 0,
    acceptance: 0,
    totalsolved: 0,
    data: () => ({ easy: 0, med: 0, hard: 0 }),
    beatrate: 0,
  },
);
</script>

<template>
  <div class="flex w-full flex-col gap-1">
    <!-- Label -->
    <label class="ml-1 text-xs font-semibold tracking-wide text-base-content/80">
      {{ t("profile.progressBar") }}
    </label>

    <!-- 外框-->
    <section class="flex w-full flex-col gap-4 rounded-xl bg-base-200 px-4 py-4">
      <!-- Heatmap -->
      <div class="rounded-xl border-base-300 bg-base-100 p-3">
        <div class="mb-2 text-base font-semibold text-base-content">{{ t("profile.heatmap") }}</div>
        <CalendarHeatmap
          :values="contributions"
          :end-date="new Date()"
          :max="10"
          :tooltip="true"
          :dark-mode="theme.isDark"
        />
      </div>

      <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        <!-- Submission -->
        <div class="flex items-center gap-3 rounded-2xl bg-base-100 px-4 py-3">
          <div class="rounded-lg bg-base-200 p-3 text-base-content/70">
            <i-uil-upload class="h-5 w-5" />
          </div>
          <div class="flex min-w-0 flex-col">
            <span class="text-xs text-base-content/70">Submissions</span>
            <span class="text-2xl font-bold leading-none text-base-content">{{ submission }}</span>
          </div>
        </div>

        <!-- Acceptance -->
        <div class="flex items-center gap-3 rounded-2xl bg-base-100 px-4 py-3">
          <div class="rounded-lg bg-base-200 p-3 text-base-content/70">
            <i-uil-check-circle class="h-5 w-5" />
          </div>
          <div class="flex min-w-0 flex-col">
            <span class="text-xs text-base-content/70">Acceptance</span>
            <span class="text-2xl font-bold leading-none text-base-content"> {{ acceptance }}% </span>
          </div>
        </div>

        <!-- Total Solved -->
        <div class="flex items-center justify-between gap-3 rounded-2xl bg-base-100 px-4 py-3">
          <!-- 左：Icon + Solved -->
          <div class="flex items-center gap-3">
            <div class="rounded-lg bg-base-200 p-3 text-base-content/70">
              <i-uil-puzzle-piece class="h-5 w-5" />
            </div>
            <div class="flex flex-col">
              <span class="text-xs text-base-content/70">Solved</span>
              <span class="text-2xl font-bold leading-none text-base-content">
                {{ totalsolved }}
              </span>
            </div>
          </div>

          <!-- 右：Easy / Med / Hard -->
          <div class="flex flex-wrap gap-1 text-xs">
            <span
              class="inline-flex min-w-[2.5rem] items-center justify-start rounded-lg bg-base-200 px-2 py-0.5 text-[#60A047]"
            >
              E {{ data.easy }}
            </span>
            <span
              class="inline-flex min-w-[2.5rem] items-center justify-start rounded-lg bg-base-200 px-2 py-0.5 text-[#E9A11C]"
            >
              M {{ data.med }}
            </span>
            <span
              class="inline-flex min-w-[2.5rem] items-center justify-start rounded-lg bg-base-200 px-2 py-0.5 text-[#E46319]"
            >
              H {{ data.hard }}
            </span>
          </div>
        </div>

        <!-- Beats -->
        <div class="flex items-center gap-3 rounded-2xl bg-base-100 px-4 py-3">
          <div class="rounded-lg bg-base-200 p-3 text-base-content/70">
            <i-uil-chart-line class="h-5 w-5" />
          </div>
          <div class="flex min-w-0 flex-col">
            <span class="text-xs text-base-content/70">Beats</span>
            <span class="text-2xl font-bold leading-none text-base-content">{{ beatrate }}%</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
