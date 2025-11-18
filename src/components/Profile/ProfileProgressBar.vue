<script setup>
import { CalendarHeatmap } from "vue3-calendar-heatmap";
import "vue3-calendar-heatmap/dist/style.css";
const props = defineProps({
  contributions: { type: Array, default: () => [] },
  submission: { type: Number, default: 0 },
  acceptance: { type: Number, default: 0 },
  totalsolved: { type: Number, default: 0 },
  data: { type: Object, default: () => ({ easy: 0, med: 0, hard: 0 }) },
  beatrate: { type: Number, default: 0 },
});
</script>

<template>
  <div class="flex w-full flex-col gap-1">
    <!-- Label -->
    <label class="ml-1 text-xs font-semibold tracking-wide text-base-content/80"> PROGRESS BAR </label>

    <!-- 外框-->
    <section class="flex w-full flex-col gap-4 rounded-xl border-base-300 bg-base-200 px-4 py-4">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,60%)_minmax(0,40%)]">
        <!-- 左欄 -->
        <div class="flex flex-col gap-4">
          <!-- Heatmap -->
          <div class="rounded-xl border-base-300 bg-base-100 p-3">
            <div class="mb-2 text-base font-semibold text-base-content">Heatmap</div>
            <CalendarHeatmap :values="contributions" :end-date="new Date()" :max="10" :tooltip="true" />
          </div>

          <!-- 小卡 -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="flex h-28 flex-col items-end justify-between rounded-[18px] bg-base-100 px-4 py-3">
              <div class="self-start text-base font-semibold text-base-content">Submission</div>
              <div class="text-6xl font-semibold leading-none text-[#B4A9DA]">
                {{ submission }}
              </div>
            </div>

            <div class="flex h-28 flex-col items-end justify-between rounded-[18px] bg-base-100 px-4 py-3">
              <div class="self-start text-base font-semibold text-base-content">Acceptance</div>
              <div class="text-6xl font-semibold leading-none text-[#E6BDBD]">
                {{ acceptance }}<span class="text-3xl">%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右欄 -->
        <div class="flex flex-col gap-3 rounded-[18px] bg-base-100 px-5 py-4 text-base font-semibold">
          <div class="text-base-content">Total Solved</div>
          <div class="flex items-end gap-3">
            <div class="text-5xl leading-none text-[#90B8E0]">
              {{ totalsolved }}
            </div>
            <div class="text-base-content">Problems</div>
          </div>

          <div class="mt-3 flex items-end gap-4">
            <!-- 左側：三個標籤 -->
            <div class="flex flex-col gap-3">
              <span
                class="flex w-24 items-center justify-between gap-2 rounded-lg bg-base-200 px-2 py-1 text-[#60A047]"
              >
                Easy <span>{{ data.easy }}</span>
              </span>
              <span
                class="flex w-24 items-center justify-between gap-2 rounded-lg bg-base-200 px-2 py-1 text-[#E9A11C]"
              >
                Med. <span>{{ data.med }}</span>
              </span>
              <span
                class="flex w-24 items-center justify-between gap-2 rounded-lg bg-base-200 px-2 py-1 text-[#E46319]"
              >
                Hard <span>{{ data.hard }}</span>
              </span>
            </div>

            <!-- 右側：Beats -->
            <div class="text-left text-base-content">
              <div>Beats</div>
              <div class="text-xl">{{ beatrate }}%</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
