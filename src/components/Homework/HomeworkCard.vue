<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useSession } from "@/stores/session";
import { formatTime } from "@/utils/formatTime";
import { useI18n } from "vue-i18n";
import useInteractions from "@/composables/useInteractions";
import api from "@/api";

import type { ProblemId2Meta } from "@/composables/useProblemSelection";

const { t } = useI18n();
const { isDesktop } = useInteractions();

interface Props {
  homework: HomeworkProblemListPayload;
  preview?: boolean;
  problems?: ProblemId2Meta;
}

const props = withDefaults(defineProps<Props>(), {
  preview: false,
  problems: () => ({}),
});

const session = useSession();
const route = useRoute();
const hasStaffAccess = computed(() => session.hasCourseAccess(route.params.courseId as string));
const fetchedProblemMeta = ref<Record<string, { name: string; quota: number | null; highScore?: number }>>(
  {},
);
const requestedProblemIds = ref<Set<number>>(new Set());

const problemIds = computed<number[]>(() => {
  const ids = props.homework.problem_ids ?? props.homework.problemIds;
  if (Array.isArray(ids) && ids.length) return ids;
  const fallback = props.homework.problems || props.homework.problem_list;
  if (!Array.isArray(fallback)) return [];
  return fallback
    .map((p) => (typeof p === "number" ? p : p?.id))
    .filter((id): id is number => typeof id === "number");
});

const problemMetaById = computed<Record<string, { name: string; quota: number | null; highScore?: number }>>(
  () => {
    const fallback = props.homework.problems || props.homework.problem_list;
    if (!Array.isArray(fallback)) return {};
    const entries = fallback
      .map((p) => {
        const isMeta = typeof p === "object" && p !== null;
        const id = typeof p === "number" ? p : isMeta ? p.id : undefined;
        if (typeof id !== "number") return null;
        const name = isMeta ? p.title || p.name || `#${id}` : `#${id}`;
        const quota = isMeta ? (typeof p.total_quota === "number" ? p.total_quota : p.quota ?? null) : null;
        const highScore = isMeta ? (typeof p.highScore === "number" ? p.highScore : p.high_score) : undefined;
        return [id.toString(), { name, quota, highScore }] as const;
      })
      .filter(
        (
          entry,
        ): entry is readonly [
          string,
          { name: string; quota: number | null; highScore: number | undefined },
        ] => entry !== null,
      );

    return Object.fromEntries(entries);
  },
);

function getProblemMeta(pid: number) {
  return (
    fetchedProblemMeta.value[pid.toString()] ||
    problemMetaById.value[pid.toString()] ||
    props.problems[pid.toString()]
  );
}

function hasDataField<T>(value: unknown): value is { data: T } {
  return typeof value === "object" && value !== null && "data" in value;
}

async function fetchProblemMeta(pid: number) {
  if (requestedProblemIds.value.has(pid)) return;
  requestedProblemIds.value.add(pid);
  try {
    const res = await api.Problem.getProblemInfo(pid);
    const data = hasDataField<ProblemInfo>(res) ? res.data : res;
    const name = data?.problemName || `#${pid}`;
    const quota = typeof data?.quota === "number" ? data.quota : null;
    const highScore = typeof data?.highScore === "number" ? data.highScore : undefined;
    fetchedProblemMeta.value = {
      ...fetchedProblemMeta.value,
      [pid.toString()]: { name, quota, highScore },
    };
  } catch {}
}

async function fetchMissingProblems(pids: number[]) {
  const tasks = pids.filter((pid) => !getProblemMeta(pid)).map((pid) => fetchProblemMeta(pid));
  if (tasks.length) {
    await Promise.all(tasks);
  }
}

watch(
  problemIds,
  (pids) => {
    void fetchMissingProblems(pids);
  },
  { immediate: true },
);
const STATUS_LABEL = {
  RUNNING: t("components.hw.card.statusLabel.running"),
  NOT_START: t("components.hw.card.statusLabel.notStart"),
  OVER: t("components.hw.card.statusLabel.over"),
};
const STATUS_CLASS = {
  [STATUS_LABEL.RUNNING]: "badge-success",
  [STATUS_LABEL.NOT_START]: "",
  [STATUS_LABEL.OVER]: "badge-error",
};

const state = computed(() => {
  const { start, end } = props.homework;
  const now = Date.now();
  if (now < (start ?? 0) * 1000) {
    return STATUS_LABEL.NOT_START;
  }
  if (now > (end ?? 0) * 1000) {
    return STATUS_LABEL.OVER;
  }
  return STATUS_LABEL.RUNNING;
});
</script>

<template>
  <div class="card mx-auto w-full bg-base-100 shadow-xl">
    <div class="card-body">
      <div class="flex flex-col items-start justify-between sm:flex-row">
        <div class="lg:text-2x card-title md:mb-8 md:text-xl">
          {{ homework.name }}
          <div :class="['badge', STATUS_CLASS[state]]">{{ state }}</div>
        </div>
        <due-countdown v-if="state === STATUS_LABEL.RUNNING" class="mt-2" :due="homework.end ?? 0" />
      </div>

      <div class="flex flex-wrap lg:flex-nowrap lg:gap-x-8">
        <div class="mb-8 w-full lg:flex-[2_1_0%]">
          <div class="card-title">{{ t("components.hw.card.availability.text") }}</div>
          <div class="mt-2 flex flex-wrap overflow-x-auto lg:flex-nowrap">
            <table v-if="isDesktop" class="table table-compact w-full">
              <thead>
                <tr>
                  <th>{{ t("components.hw.card.availability.from") }}</th>
                  <th>{{ t("components.hw.card.availability.due") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ formatTime(homework.start ?? 0) }}</td>
                  <td>{{ formatTime(homework.end ?? 0) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="flex flex-wrap text-sm">
              <div>
                <span>{{ formatTime(homework.start ?? 0) }}</span>
              </div>
              ~
              <div>
                <span>{{ formatTime(homework.end ?? 0) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mb-8 w-full lg:flex-[3_1_0%]">
          <div class="card-title">{{ t("components.hw.card.problems.text") }}</div>
          <homework-problems
            v-if="isDesktop"
            :homework="homework"
            :problems="problems"
            :has-staff-access="hasStaffAccess"
            :problem-meta-override="fetchedProblemMeta"
          />
          <div v-else class="w-full py-1">
            <div class="flex w-full flex-wrap justify-center gap-1 sm:justify-start">
              <template v-for="pid in problemIds" :key="pid">
                <problem-info-card
                  class="w-full sm:w-72"
                  :name="getProblemMeta(pid)?.name || `#${pid}`"
                  :id="pid"
                  :quota="getProblemMeta(pid)?.quota ?? '-'"
                  :score="getProblemMeta(pid)?.highScore ?? '-'"
                  :show-stats="hasStaffAccess"
                  :show-copycat="hasStaffAccess"
                />
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap lg:flex-nowrap lg:gap-x-8">
        <div class="w-full lg:flex-1">
          <div class="card-title">{{ t("components.hw.card.description.text") }}</div>
          <markdown-renderer class="mt-2" :md="homework.markdown" />
        </div>
      </div>

      <div v-if="homework.id && !preview && hasStaffAccess" class="card-actions justify-end">
        <router-link
          class="btn mr-3"
          :to="`/courses/${$route.params.courseId}/homeworks/${homework.id}/edit`"
        >
          <i-uil-edit class="mr-1 lg:h-5 lg:w-5" /> {{ t("components.hw.card.description.edit") }}
        </router-link>
        <router-link class="btn" :to="`/courses/${$route.params.courseId}/homeworks/${homework.id}/stats`">
          <i-uil-chart-line class="mr-1 lg:h-5 lg:w-5" /> {{ t("components.hw.card.description.stats") }}
        </router-link>
      </div>
    </div>
  </div>
</template>
