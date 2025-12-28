<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { computed, ref, watch } from "vue";
import queryString from "query-string";
import api, { fetcher } from "@/api";
import { useSession } from "@/stores/session";
import { LANG, LANGUAGE_OPTIONS, SUBMISSION_STATUS_REPR } from "@/constants";
import { formatTime } from "@/utils/formatTime";
import { timeFromNow } from "@/utils/timeFromNow";
import { useTitle, useClipboard } from "@vueuse/core";
import { useProblemSelection } from "@/composables/useProblemSelection";

const route = useRoute();
const router = useRouter();
const session = useSession();

useTitle(`Submissions - ${route.params.courseId} | Normal OJ`);

// url is the single source of truth
// 1. grab query parameters from url, store into local states used by inputs
// 2. when related states changed, replace url with new query parameters
// 3. when url changed, fetch new data with new query parameters
function removeEmpty(obj: object) {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null && v !== ""));
}
const routeQuery = computed<{
  page: number;
  filter: SubmissionListFilter;
}>(() => ({
  page: parseInt(route.query.page as string, 10) || 1,
  filter: {
    problemId: route.query.problemId as string,
    status: route.query.status as string,
    languageType: route.query.languageType as string,
    username: route.query.username as string,
  },
}));
function mutatePage(newPage: number) {
  router.replace({
    query: {
      page: newPage,
      ...removeEmpty(routeQuery.value.filter),
    },
  });
}
function mutateFilter(newFilter: Partial<SubmissionListFilter>) {
  router.replace({
    query: {
      page: 1,
      ...removeEmpty({
        ...routeQuery.value.filter,
        ...newFilter,
      }),
    },
  });
}
const getSubmissionsQuery = computed<SubmissionListQuery>(() => ({
  problem_id: routeQuery.value.filter.problemId,
  status: routeQuery.value.filter.status,
  language_type: routeQuery.value.filter.languageType,
  username: routeQuery.value.filter.username,
  page: routeQuery.value.page,
  page_size: 10,
  course_id: route.params.courseId as string,
}));

const data = ref<{ results: SubmissionList; count: number } | null>(null);
const isLoading = ref(false);
const error = ref<any>(null);

const execute = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const res = await api.Submission.list(getSubmissionsQuery.value);
    data.value = res;
  } catch (e) {
    error.value =
      (e as any).response?.data?.detail ||
      (e as any).response?.data?.message ||
      (e as any).message ||
      "Failed to load submissions";
  } finally {
    isLoading.value = false;
  }
};

watch(
  getSubmissionsQuery,
  () => {
    execute();
  },
  { immediate: true, deep: true },
);

const submissions = computed(() => data.value?.results || []);
const submissionCount = computed(() => data.value?.count || 0);
const maxPage = computed(() => {
  return submissionCount.value ? Math.ceil(submissionCount.value / 10) : 1;
});

const {
  problemSelections,
  problemId2Meta,
  error: fetchProblemError,
} = useProblemSelection(route.params.courseId as string);

const submissionStatusCodes = Object.entries(SUBMISSION_STATUS_REPR).map(([statusCode, { label }]) => ({
  text: label,
  value: statusCode,
}));
const languageTypes = LANGUAGE_OPTIONS.map(({ text, value }) => ({
  text,
  value: value.toString(),
}));
const searchUsername = ref("");

const { copy, copied, isSupported } = useClipboard();
function copySubmissionLink(path: string) {
  copy(new URL(path, window.location.origin).href);
}

function getLanguageName(type: number | string): string {
  const index = Number(type);
  if (!isNaN(index) && index >= 0 && index < LANG.length) {
    return LANG[index];
  }
  return type?.toString() || "Unknown";
}

async function downloadAllSubmissions() {
  const query: SubmissionListQuery = {
    problem_id: routeQuery.value.filter.problemId,
    status: routeQuery.value.filter.status,
    language_type: routeQuery.value.filter.languageType,
    username: routeQuery.value.filter.username,
    offset: 0,
    count: submissionCount.value ?? 0,
    course_id: route.params.courseId as string,
  };
  const qs = queryString.stringify(query, { skipNull: true, skipEmptyString: true });
  const url = `/submission?${qs}`;
  const { data } = await fetcher.get<GetSubmissionListResponse>(url);
  // download as json file
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const urlBlob = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = urlBlob;
  a.download = "submissions.json";
  a.click();
  URL.revokeObjectURL(urlBlob);
}
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body">
        <div class="card-title justify-between">
          {{ $t("course.submissions.text") }}

          <div v-if="session.isAdmin" class="flex justify-between gap-4">
            <div class="tooltip tooltip-bottom" data-tip="Download submissions json file">
              <div class="btn" @click="downloadAllSubmissions">
                <i-uil-file-download class="h-5 w-5" />
              </div>
            </div>
            <input
              v-model="searchUsername"
              type="text"
              placeholder="Username (exact match)"
              class="input input-bordered w-full max-w-xs"
              @keydown.enter="mutateFilter({ username: searchUsername })"
            />
          </div>
        </div>

        <div class="my-2" />
        <div class="mb-4 flex items-end gap-x-4">
          <select
            :value="routeQuery.filter.problemId"
            class="select select-bordered w-full flex-1"
            @change="(event) => mutateFilter({ problemId: (event.target as HTMLSelectElement).value })"
          >
            <option value="" selected>{{ $t("course.submissions.problem") }}</option>
            <option v-for="{ text, value } in problemSelections" :value="value">{{ text }}</option>
          </select>

          <select
            :value="routeQuery.filter.status"
            class="select select-bordered w-full flex-1"
            @change="(event) => mutateFilter({ status: (event.target as HTMLSelectElement).value })"
          >
            <option value="" selected>{{ $t("course.submissions.status") }}</option>
            <option v-for="{ text, value } in submissionStatusCodes" :value="value">{{ text }}</option>
          </select>

          <select
            :value="routeQuery.filter.languageType"
            class="select select-bordered w-full flex-1"
            @change="(event) => mutateFilter({ languageType: (event.target as HTMLSelectElement).value })"
          >
            <option value="" selected>{{ $t("course.submissions.lang") }}</option>
            <option v-for="{ text, value } in languageTypes" :value="value">{{ text }}</option>
          </select>

          <div
            v-show="
              routeQuery.filter.problemId != null ||
              routeQuery.filter.status != null ||
              routeQuery.filter.languageType != null
            "
            class="btn"
            @click="mutateFilter({ problemId: '', status: '', languageType: '' })"
          >
            <i-uil-filter-slash class="mr-1" /> {{ $t("course.submissions.clear") }}
          </div>
        </div>

        <data-status-wrapper :error="error || fetchProblemError" :is-loading="isLoading">
          <template #loading>
            <skeleton-table :col="9" :row="5" />
          </template>
          <template #data>
            <table class="table w-full">
              <thead>
                <tr>
                  <th>{{ $t("course.submissions.table.id") }}</th>
                  <th>{{ $t("course.submissions.table.pid") }}</th>
                  <th>{{ $t("course.submissions.table.user") }}</th>
                  <th>{{ $t("course.submissions.table.result") }}</th>
                  <th>{{ $t("course.submissions.table.score") }}</th>
                  <th>{{ $t("course.submissions.table.runtime") }}</th>
                  <th>{{ $t("course.submissions.table.memory") }}</th>
                  <th>{{ $t("course.submissions.table.lang") }}</th>
                  <th>{{ $t("course.submissions.table.time") }}</th>
                  <th v-if="session.isAdmin">{{ $t("course.submissions.table.ipAddr") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="submission in submissions" :key="submission.submissionId" class="hover">
                  <td>
                    <div class="flex items-center">
                      <div class="tooltip tooltip-bottom" data-tip="show details">
                        <router-link
                          :to="`/courses/${$route.params.courseId}/submissions/${submission.submissionId}`"
                          class="link"
                        >
                          {{ submission.submissionId.slice(-6) }}
                        </router-link>
                      </div>
                      <div
                        v-if="isSupported"
                        class="tooltip tooltip-bottom"
                        :data-tip="copied ? 'copied!' : 'copy link'"
                      >
                        <i-uil-link
                          class="ml-2 h-4 w-4 cursor-pointer"
                          @click="
                            copySubmissionLink(
                              `/courses/${$route.params.courseId}/submissions/${submission.submissionId}`,
                            )
                          "
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div
                      class="tooltip tooltip-bottom"
                      :data-tip="problemId2Meta[submission.problemId.toString()]?.name || 'loading...'"
                    >
                      <router-link
                        :to="`/courses/${$route.params.courseId}/problems/${submission.problemId}`"
                        class="link"
                      >
                        {{ submission.problemId }}
                      </router-link>
                    </div>
                  </td>
                  <td>
                    <div
                      class="tooltip tooltip-bottom"
                      :data-tip="submission.user.real_name || submission.user.username"
                    >
                      <span>{{ submission.user.username }}</span>
                    </div>
                  </td>
                  <td><judge-status :status="Number(submission.status)" /></td>
                  <td>{{ submission.score }}</td>
                  <td>{{ submission.runTime }} ms</td>
                  <td>{{ submission.memoryUsage }} KB</td>
                  <td>{{ getLanguageName(submission.languageType) }}</td>
                  <td>
                    <div class="tooltip tooltip-bottom" :data-tip="formatTime(submission.timestamp)">
                      <span>{{ timeFromNow(submission.timestamp) }}</span>
                    </div>
                  </td>
                  <td v-if="session.isAdmin">{{ submission.ipAddr }}</td>
                </tr>
              </tbody>
            </table>
          </template>
        </data-status-wrapper>

        <div class="card-actions mt-5">
          <pagination-buttons
            :modelValue="routeQuery.page"
            :maxPage="maxPage"
            @update:modelValue="(newPage: number) => mutatePage(newPage)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
