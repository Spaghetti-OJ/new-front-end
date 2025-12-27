<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import api, { fetcher } from "@/api";
import { useTitle } from "@vueuse/core";
import axios from "axios";

type CopycatReport = {
  id: number;
  status: "pending" | "success" | "failed";
  moss_url: string | null;
  created_at: string;
  error_message: string;
};

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

type Course = any; // 你專案已有 Course 型別的話把這行拿掉，改成 import/引用你的 Course

const route = useRoute();
useTitle(`Copycat - ${route.params.id} - ${route.params.courseId} | Normal OJ`);

const problemId = computed(() => Number(route.params.id));
const courseId = computed(() => String(route.params.courseId));

const course = ref<Course | null>(null);
const courseError = ref<string | null>(null);

const report = ref<CopycatReport | null>(null);
const reportMessage = ref<string>("");
const reportError = ref<string | null>(null);

const isBusy = ref(false);
const polling = ref(false);

const status = computed(() => report.value?.status);
const mossUrl = computed(() => report.value?.moss_url);
const errMsg = computed(() => report.value?.error_message || reportMessage.value || "");

let timer: number | null = null;

function startPolling() {
  if (timer) return;
  polling.value = true;
  timer = window.setInterval(async () => {
    await loadReport();
    if (status.value === "success" || status.value === "failed") {
      stopPolling();
    }
  }, 10000);
}

function stopPolling() {
  polling.value = false;
  if (timer) window.clearInterval(timer);
  timer = null;
}

async function loadCourse() {
  courseError.value = null;
  try {
    const res = await fetcher.get(`/course/${courseId.value}/`);
    course.value = (res as any).data ?? null; // ✅ 只拿 res.data
  } catch {
    courseError.value = "Oops! Failed to load course members. Try again later.";
  }
}
async function loadReport(): Promise<"ok" | "not_found" | "forbidden" | "error"> {
  reportError.value = null;
  try {
    const res = await fetcher.get<CopycatResp>(`/copycat/?problem_id=${problemId.value}`);

    // ✅ fetcher 已展平，所以 res 就是 CopycatResp
    const payload = res as unknown as CopycatResp;

    report.value = payload.data ?? null;
    reportMessage.value = payload.message ?? "";
    return "ok";
  } catch (e) {
    report.value = null;
    reportMessage.value = "";

    if (axios.isAxiosError(e)) {
      const code = e.response?.status;
      if (code === 404) return "not_found";
      if (code === 403) {
        reportError.value = "403 Forbidden：你沒有權限查詢報告。";
        return "forbidden";
      }

      const errorData = e.response?.data as { message?: string } | undefined;
      reportError.value = errorData?.message || `Request failed (${code})`;
      return "error";
    }

    reportError.value = "Unknown error";
    return "error";
  }
}

async function ensureReport() {
  if (isBusy.value) return;
  isBusy.value = true;
  try {
    const getState = await loadReport();

    if (getState === "ok") {
      if (status.value === "pending") startPolling();
      return;
    }

    if (getState === "not_found") {
      await api.Copycat.detect({ problem_id: problemId.value });
      await loadReport();
      startPolling();
      return;
    }
    // forbidden / error：不要亂 POST
  } catch {
    reportError.value = "Failed to start report generation.";
  } finally {
    isBusy.value = false;
  }
}

onMounted(async () => {
  await Promise.all([loadCourse(), loadReport()]);
  if (status.value === "pending") startPolling();
});

onBeforeUnmount(() => {
  stopPolling();
});
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body">
        <div class="card-title md:text-2xl lg:text-3xl">Copycat of problem #{{ $route.params.id }}</div>

        <div v-if="courseError" class="alert alert-error shadow-lg">
          <div>
            <i-uil-times-circle />
            <span>{{ courseError }}</span>
          </div>
        </div>

        <!-- 顯示查詢報告的錯誤（403/500/網路） -->
        <div v-if="reportError" class="alert alert-warning shadow-lg">
          <div class="flex w-full items-center justify-between">
            <span>{{ reportError }}</span>
            <button class="btn btn-sm" :class="isBusy && 'loading'" @click="ensureReport">Try again</button>
          </div>
        </div>

        <div v-else>
          <!-- failed -->
          <div v-if="status === 'failed'" class="alert alert-error shadow-lg">
            <div class="flex w-full items-center justify-between">
              <span>生成失敗：{{ errMsg }}</span>
              <button class="btn btn-sm" :class="isBusy && 'loading'" @click="ensureReport">Retry</button>
            </div>
          </div>

          <!-- pending -->
          <div v-else-if="status === 'pending'">
            Report generating... <span v-if="polling">(polling)</span>
          </div>

          <!-- success -->
          <div v-else-if="status === 'success' && mossUrl">
            <a class="link" :href="mossUrl" target="_blank" rel="noreferrer">Open MOSS result</a>
            <div class="mt-4">
              <iframe :src="mossUrl" class="w-full" style="height: 70vh; border: 0" />
            </div>
          </div>

          <!-- 沒報告（404）或 report 為 null：顯示按鈕 -->
          <div v-else>
            <button class="btn" :class="isBusy && 'loading'" @click="ensureReport">
              <i-uil-file-upload-alt class="mr-1 h-5 w-5" />
              Click me to generate report
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
