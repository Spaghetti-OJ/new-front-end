<template>
  <div class="flex flex-col gap-1 w-full">
    <!-- Label -->
    <label class="text-xs font-semibold tracking-wide text-base-content/80 ml-1">
      PROGRESS BAR
    </label>

    <!-- 外框-->
    <section class="w-full bg-base-200 rounded-[32px] px-5 py-5 flex flex-col gap-4">
      <div class="grid grid-cols-1 lg:grid-cols-[370px_220px] gap-4">
        <!-- 左欄 -->
        <div class="flex flex-col gap-4">

          <!-- Heatmap -->
          <div class="bg-base-100 rounded-[18px] border border-base-300 p-3">
            <div class="text-base font-semibold text-base-content mb-2">Heatmap</div>
            <CalendarHeatmap
              :values="contributions"
              :end-date="new Date()"
              :max="10"
              :tooltip="true"
            />
          </div>

          <!-- 小卡 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-base-100 rounded-[18px] px-4 py-3 flex flex-col justify-between items-end h-28">
              <div class="text-base font-semibold text-base-content self-start">Submission</div>
              <div class="text-6xl font-semibold text-[#B4A9DA] leading-none">
                {{ submission }}
              </div>
            </div>

            <div class="bg-base-100 rounded-[18px] px-4 py-3 flex flex-col justify-between items-end h-28">
              <div class="text-base font-semibold text-base-content self-start">Acceptance</div>
              <div class="text-6xl font-semibold text-[#E6BDBD] leading-none">
                {{ acceptance }}<span class="text-3xl">%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右欄 -->
        <div class="bg-base-100 rounded-[18px] px-5 py-4 flex flex-col gap-3 text-base font-semibold">
          <div class="text-base-content">Total Solved</div>
          <div class="flex items-end gap-3">
            <div class="text-5xl text-[#90B8E0] leading-none">
              {{ totalsolved }}
            </div>
            <div class="text-base-content">Problems</div>
          </div>

          <div class="flex items-end gap-4 mt-3">
            <!-- 左側：三個標籤 -->
            <div class="flex flex-col gap-3">
                <span class="flex w-24 items-center justify-between gap-2 px-2 py-1 rounded-lg bg-base-200 text-[#60A047]">
                Easy <span>{{ data.easy }}</span>
                </span>
                <span class="flex w-24 items-center justify-between gap-2 px-2 py-1 rounded-lg bg-base-200 text-[#E9A11C]">
                Med. <span>{{ data.med }}</span>
                </span>
                <span class="flex w-24 items-center justify-between gap-2 px-2 py-1 rounded-lg bg-base-200 text-[#E46319]">
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

<script setup>
import { CalendarHeatmap } from 'vue3-calendar-heatmap'
import 'vue3-calendar-heatmap/dist/style.css'
const props = defineProps({
  contributions: { type: Array, default: () => [] },
  submission: { type: Number, default: 0 },
  acceptance: { type: Number, default: 0 },
  totalsolved: { type: Number, default: 0 },
  data: { type: Object, default: () => ({ easy: 0, med: 0, hard: 0 }) },
  beatrate: { type: Number, default: 0 },
})
</script>
