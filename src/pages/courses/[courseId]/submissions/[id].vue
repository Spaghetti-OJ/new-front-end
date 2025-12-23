<script setup lang="ts">
import { ref, watchEffect, onMounted } from "vue";
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
    submission.value = (res as any).data ?? res;

    try {
      const codeRes = await api.Submission.getCode(route.params.id as string);
      const codeData = (codeRes as any).data ?? codeRes;
      sourceCode.value = codeData.source_code;
    } catch {
      sourceCode.value = "";
    }
  } catch (e) {
    error.value = e;
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
watchEffect(() => {
  if (submission.value != null) {
    const tasks = (submission.value as any).tasks;
    if (tasks) {
      if (expandTasks.value.length !== tasks.length) {
        expandTasks.value = tasks.map(() => false);
      }
    }

    // Status check
    const status = Number(submission.value.status);
    if (status !== SUBMISSION_STATUS_CODE.PENDING && status !== SUBMISSION_STATUS_CODE.QUEUING) {
      pause();
      if (status === SUBMISSION_STATUS_CODE.COMPILE_ERROR) {
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
                      <td><judge-status :status="Number(submission.status)" /></td>
                      <td>{{ submission.runTime }} ms</td>
                      <td>{{ submission.memoryUsage }} KB</td>
                      <td>{{ submission.score }}</td>
                      <td>{{ LANG[Number(submission.languageType)] }}</td>
                      <td>{{ formatTime(submission.timestamp) }}</td>
                      <td v-if="session.isAdmin">{{ submission.ipAddr }}</td>
                    </tr>
                  </tbody>
                </table>
              </template>
            </data-status-wrapper>

            <div class="my-4" />

            <div v-if="Number(submission?.status) === SUBMISSION_STATUS_CODE.COMPILE_ERROR">
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

            <div class="card-title md:text-xl lg:text-2xl">{{ $t("course.submission.detail.title") }}</div>
            <div class="my-1" />
            <skeleton-table v-if="!submission" :col="5" :row="5" />
            <div v-else-if="isActive" class="flex items-center">
              <ui-spinner class="mr-3 h-6 w-6" /> {{ $t("course.submission.detail.desc") }}
            </div>
            <table
              v-else-if="submission.tasks"
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
                  <td>{{ task.execTime }} ms</td>
                  <td>{{ task.memoryUsage }} KB</td>
                  <td>{{ task.score }}</td>
                </tr>
                <tr>
                  <td colspan="5">
                    <div
                      class="btn btn-ghost btn-sm btn-block gap-x-3"
                      @click="expandTasks[taskIndex] = !expandTasks[taskIndex]"
                    >
                      <i-uil-angle-down v-if="!expandTasks[taskIndex]" />
                      <i-uil-angle-up v-else />
                      {{
                        expandTasks[taskIndex]
                          ? $t("course.submission.detail.result.hide")
                          : $t("course.submission.detail.result.show")
                      }}
                    </div>
                  </td>
                </tr>
                <tr v-show="expandTasks[taskIndex]" v-for="(_case, caseIndex) in task.cases">
                  <td>{{ taskIndex }}-{{ caseIndex }}</td>
                  <td><judge-status :status="_case.status" /></td>
                  <td>{{ _case.execTime }} ms</td>
                  <td>{{ _case.memoryUsage }} KB</td>
                  <td>-</td>
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
