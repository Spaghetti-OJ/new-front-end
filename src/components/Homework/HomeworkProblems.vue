<script setup lang="ts">
import { useSession } from "@/stores/session";
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import type { ProblemId2Meta } from "@/composables/useProblemSelection";
import { isQuotaUnlimited } from "@/constants";

interface Props {
  homework: HomeworkListItem | HomeworkPreviewForm;
  problems?: ProblemId2Meta;
  hasStaffAccess?: boolean;
  problemMetaOverride?: Record<string, { name: string; quota: number | null; highScore?: number }>;
}

const props = withDefaults(defineProps<Props>(), {
  hasStaffAccess: false,
  problems: () => ({}),
  problemMetaOverride: () => ({}),
});

const { t } = useI18n();
const session = useSession();

const problemIds = computed<number[]>(() => {
  const ids = (props.homework as any).problem_ids ?? (props.homework as any).problemIds;
  if (Array.isArray(ids) && ids.length) return ids;
  const fallback = (props.homework as any).problems || (props.homework as any).problem_list;
  if (!Array.isArray(fallback)) return [];
  return fallback
    .map((p: any) => (typeof p === "number" ? p : p?.id))
    .filter((id: any) => typeof id === "number");
});

const problemMetaById = computed<Record<string, { name: string; quota: number | null; highScore?: number }>>(
  () => {
    const fallback = (props.homework as any).problems || (props.homework as any).problem_list;
    if (!Array.isArray(fallback)) return {};
    const entries = fallback
      .map((p: any) => {
        const id = typeof p === "number" ? p : p?.id;
        if (typeof id !== "number") return null;
        const name = p?.title || p?.name || `#${id}`;
        const quota = typeof p?.total_quota === "number" ? p.total_quota : p?.quota ?? null;
        const highScore = typeof p?.highScore === "number" ? p.highScore : p?.high_score;
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
    props.problemMetaOverride[pid.toString()] ||
    problemMetaById.value[pid.toString()] ||
    props.problems[pid.toString()]
  );
}
</script>

<template>
  <table class="table table-compact mt-2 w-full">
    <thead>
      <tr>
        <th>{{ t("components.hw.card.problems.id") }}</th>
        <th>{{ t("components.hw.card.problems.pid") }}</th>
        <th>{{ t("components.hw.card.problems.name") }}</th>
        <th>{{ t("components.hw.card.problems.quota") }}</th>
        <th>{{ t("components.hw.card.problems.score") }}</th>
        <th>{{ t("components.hw.card.problems.stats") }}</th>
        <th v-if="props.hasStaffAccess">{{ t("components.hw.card.problems.copycat") }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(pid, index) in problemIds" :key="pid">
        <td>{{ index + 1 }}</td>
        <td>
          <router-link class="link" :to="`/courses/${$route.params.courseId}/problems/${pid}`">
            {{ pid }}
          </router-link>
        </td>
        <td>
          <ui-spinner v-if="!getProblemMeta(pid)" />
          <span v-else>{{ getProblemMeta(pid)?.name || `#${pid}` }}</span>
        </td>
        <td>
          <ui-spinner v-if="!getProblemMeta(pid)" />
          <span
            v-else-if="getProblemMeta(pid) && isQuotaUnlimited(getProblemMeta(pid)!.quota as number)"
            class="text-sm"
          >
            {{ $t("components.problem.card.unlimited") }}
          </span>
          <span v-else>{{ getProblemMeta(pid)?.quota ?? "-" }}</span>
        </td>
        <td>
          {{ getProblemMeta(pid)?.highScore ?? "-" }}
        </td>
        <td>
          <div class="tooltip" data-tip="Stats">
            <router-link
              class="btn btn-ghost btn-xs"
              :to="`/courses/${$route.params.courseId}/problems/${pid}/stats`"
            >
              <i-uil-chart-line class="lg:h-5 lg:w-5" />
            </router-link>
          </div>
        </td>
        <td v-if="props.hasStaffAccess">
          <div class="tooltip" data-tip="Copycat">
            <router-link
              class="btn btn-ghost btn-xs"
              :to="`/courses/${$route.params.courseId}/problems/${pid}/copycat`"
            >
              <i-uil-file-exclamation-alt class="lg:h-5 lg:w-5" />
            </router-link>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>
