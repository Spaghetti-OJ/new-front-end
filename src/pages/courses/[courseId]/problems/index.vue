<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { computed, ref, watch, watchEffect, onMounted } from "vue";
import { UserRole, useSession } from "@/stores/session";
import { useTitle } from "@vueuse/core";
import { isQuotaUnlimited, DIFFICULTY_COLOR_CLASS } from "@/constants";
import useInteractions from "@/composables/useInteractions";
import api from "@/api";
import TagList from "@/components/Shared/TagList.vue";

type ProblemListLike = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: ProblemItem[];
  items?: ProblemItem[];
  data?: {
    count?: number;
    next?: string | null;
    previous?: string | null;
    results?: ProblemItem[];
    items?: ProblemItem[];
  };
};

function toProblemList(raw: unknown): ProblemList {
  const data = (raw ?? null) as ProblemListLike | null;
  let results: ProblemItem[] = [];
  if (data?.results) {
    results = data.results;
  } else if (data?.items) {
    results = data.items;
  } else if (data?.data?.results) {
    results = data.data.results;
  } else if (data?.data?.items) {
    results = data.data.items;
  }

  let count = results.length;
  if (typeof data?.count === "number") {
    count = data.count;
  } else if (typeof data?.data?.count === "number") {
    count = data.data.count;
  }

  let next: string | null = null;
  if (data?.next !== undefined) {
    next = data.next ?? null;
  } else if (data?.data?.next !== undefined) {
    next = data.data.next ?? null;
  }

  let previous: string | null = null;
  if (data?.previous !== undefined) {
    previous = data.previous ?? null;
  } else if (data?.data?.previous !== undefined) {
    previous = data.data.previous ?? null;
  }

  return {
    count,
    next,
    previous,
    results,
  };
}

const session = useSession();
const rolesCanReadProblemStatus = [UserRole.Admin, UserRole.Teacher];
const rolesCanCreateProblem = [UserRole.Admin, UserRole.Teacher];
const route = useRoute();
const router = useRouter();

const { isDesktop } = useInteractions();

useTitle(`Problems - ${route.params.courseId} | Normal OJ`);
const problems = ref<ProblemList | null>(null);
const error = ref<any>(null);
const isLoading = ref<boolean>(false);

async function loadProblems() {
  isLoading.value = true;
  error.value = null;

  try {
    const res = await api.Problem.getProblemList({
      course_id: Number(route.params.courseId),
      page_size: 1000, // Fetch all for client-side filtering
    });

    const rawData = (res as { data?: unknown }).data ?? res;
    problems.value = toProblemList(rawData);
  } catch (err) {
    console.error(err);
    error.value = err;
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadProblems);

// Pagination
const page = ref(!isNaN(Number(route.query.page)) ? Number(route.query.page) : 1);
const pageSize = 10;

watchEffect(() => {
  if (!problems.value) return;
  const total = problems.value.results.length;
  const max = Math.ceil(total / pageSize) || 1;
  if (page.value < 1) page.value = 1;
  if (page.value > max) page.value = max;
});

watch(page, () => {
  router.replace({ query: { ...route.query, page: page.value } });
});

const maxPage = computed(() => {
  if (!problems.value) return 1;
  return Math.ceil(problems.value.results.length / pageSize) || 1;
});

const paginatedProblems = computed(() => {
  if (!problems.value) return [];
  const start = (page.value - 1) * pageSize;
  return problems.value.results.slice(start, start + pageSize);
});
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body">
        <!-- Header & Actions -->
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 class="card-title">{{ $t("course.problems.text") }}</h2>
          <div class="flex gap-2">
            <router-link
              v-if="rolesCanCreateProblem.includes(session.role)"
              class="btn btn-success"
              :to="`/courses/${$route.params.courseId}/problems/new`"
            >
              <i-uil-plus-circle class="mr-1 lg:h-5 lg:w-5" /> {{ $t("course.problems.new") }}
            </router-link>
          </div>
        </div>

        <div class="my-2" />
        <data-status-wrapper :error="error" :is-loading="isLoading">
          <template #loading>
            <skeleton-table v-if="isDesktop" :col="5" :row="5" />
            <div v-else class="flex items-center justify-center">
              <ui-spinner />
            </div>
          </template>
          <template #data>
            <table v-if="isDesktop" class="table w-full">
              <thead>
                <tr>
                  <th>{{ $t("course.problems.id") }}</th>
                  <th>{{ $t("course.problems.name") }}</th>
                  <th v-if="rolesCanReadProblemStatus.includes(session.role)">
                    {{ $t("course.problems.status") }}
                  </th>
                  <th>{{ $t("course.problems.tags") }}</th>
                  <th>{{ $t("course.problems.quota") }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in paginatedProblems" :key="p.id" class="hover">
                  <td class="h-px">
                    <div class="flex h-full items-center gap-2">
                      <span
                        class="h-3 w-3 shrink-0 rounded-full"
                        :class="DIFFICULTY_COLOR_CLASS[p.difficulty]"
                      />
                      <router-link :to="`/courses/${$route.params.courseId}/problems/${p.id}`" class="link">
                        #{{ p.id }}
                      </router-link>
                    </div>
                  </td>
                  <td>
                    <router-link
                      :to="`/courses/${$route.params.courseId}/problems/${p.id}`"
                      class="link link-hover font-medium"
                    >
                      {{ p.title }}
                    </router-link>
                  </td>
                  <td v-if="rolesCanReadProblemStatus.includes(session.role)">
                    <span class="badge ml-1">{{ p.is_public }}</span>
                  </td>
                  <td>
                    <TagList :tags="p.tags.map((t) => t.name)" size="md" colorMode="outline" />
                  </td>
                  <td>
                    <template v-if="isQuotaUnlimited(p.total_quota)">
                      <span class="text-sm">{{ $t("components.problem.card.unlimited") }}</span>
                    </template>
                    <template v-else>
                      {{ p.total_quota - p.total_submissions }} / {{ p.total_quota }}
                    </template>
                  </td>
                  <td>
                    <div class="tooltip" data-tip="Stats">
                      <router-link
                        class="btn btn-circle btn-ghost btn-sm mr-1"
                        :to="`/courses/${$route.params.courseId}/problems/${p.id}/stats`"
                      >
                        <i-uil-chart-line class="lg:h-5 lg:w-5" />
                      </router-link>
                    </div>
                    <div class="tooltip" data-tip="Copycat">
                      <router-link
                        v-if="rolesCanReadProblemStatus.includes(session.role)"
                        class="btn btn-circle btn-ghost btn-sm mr-1"
                        :to="`/courses/${$route.params.courseId}/problems/${p.id}/copycat`"
                      >
                        <i-uil-file-exclamation-alt class="lg:h-5 lg:w-5" />
                      </router-link>
                    </div>
                    <div class="tooltip" data-tip="Edit">
                      <router-link
                        v-if="rolesCanReadProblemStatus.includes(session.role)"
                        class="btn btn-circle btn-ghost btn-sm"
                        :to="`/courses/${$route.params.courseId}/problems/${p.id}/edit`"
                      >
                        <i-uil-edit class="lg:h-5 lg:w-5" />
                      </router-link>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Mobile View -->
            <template v-else v-for="p in paginatedProblems" :key="p.id">
              <problem-info
                :id="p.id"
                :problem-name="p.title"
                :unlimited-quota="isQuotaUnlimited(p.total_quota)"
                :quota-limit="p.total_quota"
                :quota-remaining="p.total_quota - p.total_submissions"
                :tags="p.tags"
                :visible="p.is_public"
                :is-admin="session.isAdmin"
                :is-teacher="session.isTeacher"
              />
            </template>
          </template>
        </data-status-wrapper>

        <div class="card-actions mt-5 justify-center">
          <pagination-buttons v-if="maxPage > 1" v-model="page" :maxPage="maxPage" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table thead tr {
  background-color: rgba(255, 255, 255, 0.05);
  font-weight: 600;
}

.table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.05);
  transition: background-color 0.2s ease;
}
</style>
