<script setup lang="ts">
import { ref, watchEffect, onMounted, computed } from "vue";
import { useClipboard, useIntervalFn } from "@vueuse/core";
import { useAxios } from "@vueuse/integrations/useAxios";
import { useRoute, useRouter } from "vue-router";
import { SUBMISSION_STATUS_CODE, LANG } from "@/constants";
import { formatTime } from "@/utils/formatTime";
import api, { fetcher } from "@/api";
import { useSession } from "@/stores/session";
import { useTitle } from "@vueuse/core";

const session = useSession();
const route = useRoute();
useTitle(`Submission - ${route.params.id} - ${route.params.courseId} | Normal OJ`);
const router = useRouter();

const submission = ref<SubmissionInfo | null>(null);
const sourceCode = ref("");
const error = ref<any>(null);
const isLoading = ref(false);

const execute = async () => {
  try {
    const res = await api.Submission.getDetail(route.params.id as string);
    const raw = (res as any).data ?? res;
    if (raw) {
      raw.status = Number(raw.status);
      raw.languageType = Number(raw.languageType);
      const parsedTimestamp = Number(raw.timestamp);
      if (Number.isNaN(parsedTimestamp)) {
        const parsedDate = new Date(raw.timestamp).getTime();
        raw.timestamp = Number.isNaN(parsedDate) ? 0 : parsedDate / 1000;
      } else {
        raw.timestamp = parsedTimestamp;
      }
      if (raw.tasks) {
        raw.tasks.forEach((t: any) => {
          t.status = Number(t.status);
          if (t.cases) {
            t.cases.forEach((c: any) => {
              c.status = Number(c.status);
            });
          }
        });
      }
    }
    submission.value = raw;
    if (raw?.problemId) {
      await loadProblemCases(raw.problemId);
    }

    // Polyfill tasks if missing from submission detail but we have problem structure
    if ((!raw.tasks || raw.tasks.length === 0) && Object.keys(subtaskCaseIds.value).length > 0) {
      const tasks: any[] = [];
      const sortedSubtasks = Object.keys(subtaskCaseIds.value)
        .map(Number)
        .sort((a, b) => a - b);

      sortedSubtasks.forEach((subtaskNo) => {
        const cases: any[] = [];
        subtaskCaseIds.value[subtaskNo].forEach((caseNo) => {
          cases[caseNo] = {
            status: raw.status,
            execTime: null,
            memoryUsage: null,
          };
        });
        tasks.push({
          status: raw.status,
          execTime: null,
          memoryUsage: null,
          score: null,
          cases,
        });
      });
      raw.tasks = tasks;
      submission.value = { ...raw };
    }

    if (raw?.tasks?.length && !isOutputsPrefetched.value && !isOutputsPrefetching.value) {
      isOutputsPrefetching.value = true;
      try {
        await Promise.all(raw.tasks.map((task: Task, index: number) => loadTaskOutputs(index, task)));
        isOutputsPrefetched.value = true;
      } finally {
        isOutputsPrefetching.value = false;
      }
      // expandTasks.value = raw.tasks.map(() => true); // Do not auto-expand
    }

    try {
      const codeRes = await api.Submission.getCode(route.params.id as string);
      const codeData = (codeRes as any).data ?? codeRes;
      sourceCode.value = codeData.source_code;
    } catch {
      sourceCode.value = "";
    }
  } catch (e) {
    if (isLoading.value) {
      error.value = e;
    } else {
      console.error(e);
    }
  }
};

onMounted(() => {
  isLoading.value = true;
  execute().finally(() => {
    isLoading.value = false;
  });
});

const {
  data: CEOutput,
  error: CEError,
  isLoading: CELoading,
  execute: fetchCEOutput,
} = useAxios<{ stderr: string; stdout: string }>(`/submission/${route.params.id}/output/0/0`, fetcher, {
  immediate: false,
});

const { copy, copied, isSupported } = useClipboard();

const { pause, isActive } = useIntervalFn(() => {
  if (submission.value != null) {
    execute();
  }
}, 2000);

const expandTasks = ref<boolean[]>([]);
const caseOutputs = ref<Record<string, SubmissionCaseOutput | null>>({});
const caseOutputErrors = ref<Record<string, string>>({});
const caseOutputLoading = ref<Record<string, boolean>>({});
const subtaskCaseIds = ref<Record<number, number[]>>({});
const isProblemCasesLoaded = ref(false);
const isOutputsPrefetched = ref(false);
const isOutputsPrefetching = ref(false);
const problemCasesError = ref<string | null>(null);

function getCaseKey(taskNo: number, caseNo: number) {
  return `${taskNo}-${caseNo}`;
}

function resolveTaskNo(taskIndex: number) {
  // subtaskCaseIds may be keyed by 0-based or 1-based subtask_no depending on backend.
  if (subtaskCaseIds.value[taskIndex]?.length) return taskIndex;
  if (subtaskCaseIds.value[taskIndex + 1]?.length) return taskIndex + 1;
  return taskIndex;
}

function getCaseIdsForTask(taskIndex: number, task: Task) {
  const taskNo = resolveTaskNo(taskIndex);
  const fromProblem = subtaskCaseIds.value[taskNo];
  if (fromProblem?.length) return fromProblem;
  if (task.cases?.length) {
    return Object.keys(task.cases)
      .map((key) => Number(key))
      .filter((value) => Number.isInteger(value))
      .sort((a, b) => a - b);
  }
  return [];
}

function getFallbackCase(task: Task, caseNo: number) {
  return task.cases?.[caseNo];
}

async function fetchCaseOutput(taskNo: number, caseNo: number) {
  const key = getCaseKey(taskNo, caseNo);
  if (caseOutputLoading.value[key] || caseOutputs.value[key]) return;
  caseOutputLoading.value[key] = true;
  caseOutputErrors.value[key] = "";
  try {
    const res = await api.Submission.getOutput(route.params.id as string, taskNo, caseNo);
    const data = (res as any).data?.data ?? (res as any).data ?? res;
    caseOutputs.value[key] = (data as SubmissionCaseOutput) || null;
  } catch (err: any) {
    caseOutputErrors.value[key] = err?.response?.data?.message || err?.message || "Failed to load output.";
  } finally {
    caseOutputLoading.value[key] = false;
  }
}

async function loadProblemCases(problemId: number) {
  if (isProblemCasesLoaded.value) return;
  problemCasesError.value = null;
  try {
    const [subtasksRes, casesRes] = await Promise.all([
      api.Problem.getSubtasks(problemId),
      api.Problem.getTestCases(problemId),
    ]);
    const subtasks = (subtasksRes as any).data ?? subtasksRes ?? [];
    const cases = (casesRes as any).data?.data ?? (casesRes as any).data ?? [];
    const subtaskNoById = new Map<number, number>();
    subtasks.forEach((s: any) => {
      if (typeof s.id === "number" && typeof s.subtask_no === "number") {
        subtaskNoById.set(s.id, s.subtask_no);
      }
    });

    const grouped: Record<number, number[]> = {};
    cases.forEach((c: any) => {
      const subtaskNo = subtaskNoById.get(c.subtask_id);
      if (subtaskNo == null) {
        console.warn("Submission output case skipped: unknown subtask_id", c);
        return;
      }
      if (typeof c.idx !== "number") {
        console.warn("Submission output case skipped: invalid idx", c);
        return;
      }
      if (!grouped[subtaskNo]) grouped[subtaskNo] = [];
      grouped[subtaskNo].push(c.idx);
    });
    Object.values(grouped).forEach((list) => list.sort((a, b) => a - b));
    subtaskCaseIds.value = grouped;
    isProblemCasesLoaded.value = true;
  } catch (err) {
    console.warn("Failed to load problem test cases", err);
    problemCasesError.value = "Failed to load problem structure for outputs.";
  }
}

async function loadTaskOutputs(taskIndex: number, task: Task) {
  const taskNo = resolveTaskNo(taskIndex);
  const caseIds = getCaseIdsForTask(taskIndex, task);
  if (!caseIds.length) return;
  await Promise.all(caseIds.map((caseNo) => fetchCaseOutput(taskNo, caseNo)));
}

function toggleTask(taskIndex: number, task: Task) {
  expandTasks.value[taskIndex] = !expandTasks.value[taskIndex];
  if (expandTasks.value[taskIndex]) {
    void loadTaskOutputs(taskIndex, task);
  }
}
watchEffect(() => {
  if (submission.value != null) {
    const tasks = (submission.value as any).tasks;
    if (tasks) {
      if (expandTasks.value.length !== tasks.length) {
        expandTasks.value = tasks.map(() => false);
      }
    }

    // Status check
    if (
      submission.value.status !== SUBMISSION_STATUS_CODE.PENDING &&
      submission.value.status !== SUBMISSION_STATUS_CODE.QUEUING
    ) {
      pause();
      if (submission.value.status === SUBMISSION_STATUS_CODE.COMPILE_ERROR) {
        fetchCEOutput();
      }
    }
  }
});

const isRejudgeLoading = ref(false);
async function rejudge() {
  isRejudgeLoading.value = true;
  try {
    await api.Submission.rejudge(route.params.id as string);
    router.go(0);
  } catch (error) {
    alert("Request to rejudge failed.");
    throw error;
  } finally {
    isRejudgeLoading.value = false;
  }
}

function getTaskStats(taskIndex: number, task: Task) {
  const taskNo = resolveTaskNo(taskIndex);
  const caseIds = getCaseIdsForTask(taskIndex, task);

  if (!caseIds.length) {
    return {
      execTime: task.execTime,
      memoryUsage: task.memoryUsage,
      score: task.score,
    };
  }

  let totalTime = 0;
  let maxMemory = 0;
  let totalScore = 0;
  let hasAllOutputs = true;

  for (const caseNo of caseIds) {
    const key = getCaseKey(taskNo, caseNo);
    const output = caseOutputs.value[key];
    if (!output) {
      hasAllOutputs = false;
      break;
    }
    totalTime += output.execution_time ?? 0;
    maxMemory = Math.max(maxMemory, output.memory_usage ?? 0);
    totalScore += output.score ?? 0;
  }

  if (hasAllOutputs) {
    return {
      execTime: totalTime,
      memoryUsage: maxMemory,
      score: totalScore,
    };
  }

  return {
    execTime: task.execTime,
    memoryUsage: task.memoryUsage,
    score: task.score,
  };
}

const taskStatsByIndex = computed(() => {
  if (!submission.value?.tasks) return [];
  return submission.value.tasks.map((task, index) => getTaskStats(index, task));
});

function getTaskExecValue(taskIndex: number, task: Task) {
  const value = taskStatsByIndex.value[taskIndex]?.execTime ?? task.execTime;
  return value == null ? null : value;
}

function getTaskMemoryValue(taskIndex: number, task: Task) {
  const value = taskStatsByIndex.value[taskIndex]?.memoryUsage ?? task.memoryUsage;
  return value == null ? null : value;
}

function getTaskScoreValue(taskIndex: number, task: Task) {
  const value = taskStatsByIndex.value[taskIndex]?.score ?? task.score;
  return value == null ? null : value;
}

function getCaseExecValue(taskIndex: number, caseNo: number, task: Task) {
  const key = getCaseKey(resolveTaskNo(taskIndex), caseNo);
  const output = caseOutputs.value[key];
  if (output?.execution_time != null) return output.execution_time;
  const fallback = getFallbackCase(task, caseNo);
  if (fallback?.execTime != null) return fallback.execTime;
  return null;
}

function getCaseMemoryValue(taskIndex: number, caseNo: number, task: Task) {
  const key = getCaseKey(resolveTaskNo(taskIndex), caseNo);
  const output = caseOutputs.value[key];
  if (output?.memory_usage != null) return output.memory_usage;
  const fallback = getFallbackCase(task, caseNo);
  if (fallback?.memoryUsage != null) return fallback.memoryUsage;
  return null;
}

function normalizeOutputStatus(status?: string) {
  if (!status) return null;
  const normalized = status.toLowerCase();
  const map: Record<string, SubmissionStatusCodes> = {
    accepted: SUBMISSION_STATUS_CODE.ACCEPTED,
    wrong_answer: SUBMISSION_STATUS_CODE.WRONG_ANSWER,
    compile_error: SUBMISSION_STATUS_CODE.COMPILE_ERROR,
    time_limit_exceeded: SUBMISSION_STATUS_CODE.TIME_LIMIT_EXCEED,
    memory_limit_exceeded: SUBMISSION_STATUS_CODE.MEMORY_LIMIT_EXCEED,
    runtime_error: SUBMISSION_STATUS_CODE.RUNTIME_ERROR,
    judge_error: SUBMISSION_STATUS_CODE.JUDGE_ERROR,
    output_limit_exceeded: SUBMISSION_STATUS_CODE.OUTPUT_LIMIT_EXCEED,
    pending: SUBMISSION_STATUS_CODE.PENDING,
  };
  return map[normalized] ?? null;
}

function getCaseStatusCode(taskIndex: number, caseNo: number, task: Task) {
  const key = getCaseKey(resolveTaskNo(taskIndex), caseNo);
  const output = caseOutputs.value[key];
  const normalized = normalizeOutputStatus(output?.status);
  if (normalized != null) return normalized;
  const fallback = getFallbackCase(task, caseNo);
  return fallback?.status ?? null;
}
</script>

<template>
  <div class="card-container pb-40">
    <div class="card min-w-full">
      <div class="card-body">
        <div class="flex flex-wrap items-start justify-between">
          <div class="flex flex-col gap-4">
            <div class="card-title md:text-2xl lg:text-3xl">
              {{ $t("course.submission.title") }}{{ $route.params.id }}
            </div>
          </div>

          <div
            v-if="session.isAdmin"
            :class="['btn md:btn-md', isRejudgeLoading && 'loading']"
            @click="rejudge"
          >
            <i-uil-repeat class="mr-1" /> Rejudge
          </div>
        </div>

        <div class="divider" />

        <div class="card min-w-full rounded-none">
          <div class="card-body p-0">
            <div class="card-title md:text-xl lg:text-2xl">{{ $t("course.submission.general.title") }}</div>
            <div class="my-1" />

            <data-status-wrapper :error="error" :is-loading="isLoading">
              <template #loading>
                <skeleton-table :col="8" :row="1" />
              </template>
              <template #data>
                <table v-if="submission" class="table w-full">
                  <thead>
                    <tr>
                      <th>{{ $t("course.submission.general.problem") }}</th>
                      <th>{{ $t("course.submission.general.user") }}</th>
                      <th>{{ $t("course.submission.general.status") }}</th>
                      <th>{{ $t("course.submission.general.runtime") }}</th>
                      <th>{{ $t("course.submission.general.memory") }}</th>
                      <th>{{ $t("course.submission.general.score") }}</th>
                      <th>{{ $t("course.submission.general.lang") }}</th>
                      <th>{{ $t("course.submission.general.time") }}</th>
                      <th v-if="session.isAdmin">{{ $t("course.submission.general.ipAddr") }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <router-link
                          :to="`/courses/${$route.params.courseId}/problems/${submission.problemId}`"
                          class="link"
                        >
                          {{ submission.problemId }}
                        </router-link>
                      </td>
                      <td>
                        {{ submission.user.username }} ({{
                          submission.user.real_name || submission.user.username
                        }})
                      </td>
                      <td><judge-status :status="submission.status as any" /></td>
                      <td>{{ submission.runTime }} ms</td>
                      <td>{{ submission.memoryUsage }} KB</td>
                      <td>{{ submission.score }}</td>
                      <td>{{ LANG[submission.languageType as any] }}</td>
                      <td>{{ formatTime(submission.timestamp as any) }}</td>
                      <td v-if="session.isAdmin">{{ submission.ipAddr }}</td>
                    </tr>
                  </tbody>
                </table>
              </template>
            </data-status-wrapper>

            <div class="my-4" />

            <div v-if="submission?.status === SUBMISSION_STATUS_CODE.COMPILE_ERROR">
              <div class="card-title md:text-xl lg:text-2xl">
                <i-uil-exclamation-circle class="mr-2 text-error" />
                {{ $t("course.submission.compile_error.title") }}
              </div>
              <div class="my-4" />
              <ui-spinner v-if="CELoading" class="mr-3 h-6 w-6" />
              <div v-else-if="CEError">unable to get error messages from server 😢</div>
              <div v-else>
                <code-editor v-model="CEOutput!.stderr" readonly />
              </div>
            </div>

            <div class="my-4" />

            <div v-if="problemCasesError" class="alert alert-warning mb-3 shadow-lg">
              <i-uil-exclamation-circle class="h-5 w-5" />
              <span>{{ problemCasesError }}</span>
            </div>

            <div class="card-title md:text-xl lg:text-2xl">{{ $t("course.submission.detail.title") }}</div>
            <div class="my-1" />
            <skeleton-table v-if="!submission" :col="5" :row="5" />

            <div v-if="isActive" class="mb-4 flex items-center">
              <ui-spinner class="mr-3 h-6 w-6" /> {{ $t("course.submission.detail.desc") }}
            </div>

            <table
              v-if="submission?.tasks"
              class="table table-compact w-full"
              v-for="(task, taskIndex) in submission.tasks"
            >
              <thead>
                <tr>
                  <th>{{ $t("course.submission.detail.id") }} {{ taskIndex }}</th>
                  <th>{{ $t("course.submission.detail.status") }}</th>
                  <th>{{ $t("course.submission.detail.runtime") }}</th>
                  <th>{{ $t("course.submission.detail.memory") }}</th>
                  <th>{{ $t("course.submission.detail.score") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ $t("course.submission.detail.overall") }}</td>
                  <td><judge-status :status="task.status" /></td>
                  <td>
                    {{ getTaskExecValue(taskIndex, task) ?? "-" }}
                    <span v-if="getTaskExecValue(taskIndex, task) != null"> ms</span>
                  </td>
                  <td>
                    {{ getTaskMemoryValue(taskIndex, task) ?? "-" }}
                    <span v-if="getTaskMemoryValue(taskIndex, task) != null"> KB</span>
                  </td>
                  <td>{{ getTaskScoreValue(taskIndex, task) ?? "-" }}</td>
                </tr>
                <tr>
                  <td colspan="5">
                    <div class="btn btn-ghost btn-sm btn-block gap-x-3" @click="toggleTask(taskIndex, task)">
                      <i-uil-angle-down v-if="!expandTasks[taskIndex]" />
                      <i-uil-angle-up v-else />
                      {{ expandTasks[taskIndex] ? "HIDE ALL RESULTS" : "SHOW ALL RESULTS" }}
                    </div>
                  </td>
                </tr>
                <tr
                  v-show="expandTasks[taskIndex]"
                  v-for="caseNo in getCaseIdsForTask(taskIndex, task)"
                  :key="`${resolveTaskNo(taskIndex)}-${caseNo}`"
                >
                  <td>{{ resolveTaskNo(taskIndex) }}-{{ caseNo }}</td>
                  <td>
                    <judge-status
                      v-if="getCaseStatusCode(taskIndex, caseNo, task) != null"
                      :status="getCaseStatusCode(taskIndex, caseNo, task) as any"
                    />
                    <judge-status
                      v-else-if="getFallbackCase(task, caseNo)"
                      :status="getFallbackCase(task, caseNo)!.status"
                    />
                    <span v-else>-</span>
                    <span
                      v-if="caseOutputErrors[getCaseKey(resolveTaskNo(taskIndex), caseNo)]"
                      class="ml-2 inline-flex items-center text-xs text-warning"
                      :title="caseOutputErrors[getCaseKey(resolveTaskNo(taskIndex), caseNo)]"
                    >
                      <i-uil-exclamation-circle class="mr-1 h-4 w-4" />
                      Failed to load output
                    </span>
                  </td>
                  <td>
                    {{ getCaseExecValue(taskIndex, caseNo, task) ?? "-" }}
                    <span v-if="getCaseExecValue(taskIndex, caseNo, task) != null"> ms</span>
                  </td>
                  <td>
                    {{ getCaseMemoryValue(taskIndex, caseNo, task) ?? "-" }}
                    <span v-if="getCaseMemoryValue(taskIndex, caseNo, task) != null"> KB</span>
                  </td>
                  <td>
                    {{ caseOutputs[getCaseKey(resolveTaskNo(taskIndex), caseNo)]?.score ?? "-" }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="my-4" />

        <skeleton-card v-if="!submission" />
        <div v-else class="card min-w-full rounded-none">
          <div class="card-body p-0">
            <div class="card-title md:text-xl lg:text-2xl">
              {{ $t("course.submission.source.text") }}
              <button
                v-if="isSupported && sourceCode"
                class="btn btn-info btn-xs ml-3"
                @click="copy(sourceCode)"
              >
                {{ copied ? $t("course.submission.source.copied") : $t("course.submission.source.copy") }}
              </button>
            </div>
            <div class="my-1" />
            <code-editor v-model="sourceCode" readonly />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
