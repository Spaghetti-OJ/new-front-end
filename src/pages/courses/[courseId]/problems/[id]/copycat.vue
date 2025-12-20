<script setup lang="ts">
import { useAxios } from "@vueuse/integrations/useAxios";
import { useRoute } from "vue-router";
import api, { fetcher } from "@/api";
import { useIntervalFn, useTitle } from "@vueuse/core";
import { ref, watchEffect, computed } from "vue";

type CopycatResp = {
  data: {
    id: number;
    status: "pending" | "success" | "failed";
    moss_url: string | null;
    created_at: string;
    error_message: string;
  } | null;
  message: string;
  status: "ok" | "error";
};

const route = useRoute();
useTitle(`Copycat - ${route.params.id} - ${route.params.courseId} | Normal OJ`);

const { data: course, error: courseError } = useAxios<Course>(`/course/${route.params.courseId}`, fetcher);

const {
  data: report,
  error: reportError,
  execute,
} = useAxios<CopycatResp>(`/copycat/?problem_id=${route.params.id}`, fetcher, { immediate: true });

const status = computed(() => report.value?.data?.status);
const mossUrl = computed(() => report.value?.data?.moss_url);
const errMsg = computed(() => report.value?.data?.error_message || report.value?.message || "");

const { pause, resume, isActive } = useIntervalFn(() => execute(), 10000, { immediate: false });

watchEffect(() => {
  if (status.value === "success" || status.value === "failed") {
    pause();
  } else if (status.value === "pending" && !isActive.value) {
    resume();
  }
});

const isReportGenerationFailed = ref(false);
async function generateReport() {
  isReportGenerationFailed.value = false;
  try {
    await api.Copycat.detect({ problem_id: Number(route.params.id) });
    await execute();
    resume();
  } catch {
    isReportGenerationFailed.value = true;
  }
}
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body">
        <div class="card-title md:text-2xl lg:text-3xl">Copycat of problem #{{ $route.params.id }}</div>

        <div v-if="courseError" class="alert alert-error shadow-lg">
          <div>
            <i-uil-times-circle />
            <span>Oops! Failed to load course members. Try again later.</span>
          </div>
        </div>

        <!-- 查不到任何報告（404）或其他錯 -->
        <div v-if="reportError" class="alert alert-warning shadow-lg">
          <div class="flex w-full items-center justify-between">
            <span>此題目尚未有報告，或查詢失敗。</span>
            <button class="btn btn-sm" @click="generateReport">Generate report</button>
          </div>
        </div>

        <div v-else>
          <!-- 失敗 -->
          <div v-if="status === 'failed'" class="alert alert-error shadow-lg">
            <div class="flex w-full items-center justify-between">
              <span>生成失敗：{{ errMsg }}</span>
              <button class="btn btn-sm" @click="generateReport">Retry</button>
            </div>
          </div>

          <!-- pending -->
          <div v-else-if="status === 'pending'">Report generating... (polling)</div>

          <!-- success：用 iframe 或連結 -->
          <div v-else-if="status === 'success' && mossUrl">
            <a class="link" :href="mossUrl" target="_blank" rel="noreferrer">Open MOSS result</a>
            <div class="mt-4">
              <iframe :src="mossUrl" class="w-full" style="height: 70vh; border: 0" />
            </div>
          </div>

          <!-- 尚未生成 + 前端按鈕 -->
          <div v-else>
            <button class="btn" @click="generateReport">
              <i-uil-file-upload-alt class="mr-1 h-5 w-5" /> Click me to generate report
            </button>
          </div>

          <div v-if="isReportGenerationFailed" class="mt-3 text-error">
            Failed to start report generation.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
