<script setup lang="ts">
import { useAxios } from "@vueuse/integrations/useAxios";
import { useRoute, useRouter } from "vue-router";
import { computed, ref, watch, watchEffect, onMounted } from "vue";
import { fetcher } from "@/api";
import { UserRole, useSession } from "@/stores/session";
import { useTitle } from "@vueuse/core";
import { isQuotaUnlimited } from "@/constants";
import useInteractions from "@/composables/useInteractions";
import api from "@/api";
import { ProblemList } from "@/types/problem";
const session = useSession();
const rolesCanReadProblemStatus = [UserRole.Admin, UserRole.Teacher];
const route = useRoute();
const router = useRouter();

const { isDesktop } = useInteractions();

useTitle(`Problems - ${route.params.name} | Normal OJ`);
const problems = ref<ProblemList | null>(null);
const error = ref<any>(null);
const isLoading = ref<boolean>(false);

async function loadProblems() {
  isLoading.value = true;
  error.value = null;

  try {
    const res = await api.Problem.getProblemList({
      course_id: Number(route.params.name),
    });

    problems.value = res.data;
  } catch (err) {
    console.error(err);
    error.value = err;
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadProblems);
const page = ref(!isNaN(Number(route.query.page)) ? Number(route.query.page) : 1);
watchEffect(() => {
  if (problems.value != null && (page.value < 1 || page.value >= problems.value.results.length)) {
    page.value = 1;
  }
});
watch(page, () => {
  router.replace({ query: { page: page.value } });
});
const maxPage = computed(() => {
  return problems.value ? Math.ceil(problems.value.results.length / 10) : 1;
});
const rolesCanCreateProblem = [UserRole.Admin, UserRole.Teacher];
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body">
        <div class="card-title justify-between">
          {{ $t("course.problems.text") }}

          <router-link
            v-if="rolesCanCreateProblem.includes(session.role)"
            class="btn btn-success"
            :to="`/courses/${$route.params.name}/problems/new`"
          >
            <i-uil-plus-circle class="mr-1 lg:h-5 lg:w-5" /> {{ $t("course.problems.new") }}
          </router-link>
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
                <tr
                  v-for="{ id, title, tags, total_quota, total_submissions, is_public } in (
                    problems?.results || []
                  ).slice((page - 1) * 10, page * 10)"
                  :key="id"
                  class="hover"
                >
                  <td>
                    <router-link :to="`/courses/${$route.params.name}/problems/${id}`" class="link">
                      {{ id }}
                    </router-link>
                  </td>
                  <td>
                    {{ title }}
                  </td>
                  <td v-if="rolesCanReadProblemStatus.includes(session.role)">
                    <span class="badge ml-1">{{ is_public }}</span>
                  </td>
                  <td>
                    <span class="badge badge-info mr-1" v-for="tag in tags" :key="tag.id">{{
                      tag.name
                    }}</span>
                  </td>
                  <td>
                    <template v-if="isQuotaUnlimited(total_quota)">
                      <span class="text-sm">{{ $t("components.problem.card.unlimited") }}</span>
                    </template>
                    <template v-else> {{ total_quota - total_submissions }} / {{ total_quota }} </template>
                  </td>
                  <td>
                    <div class="tooltip" data-tip="Stats">
                      <router-link
                        class="btn btn-circle btn-ghost btn-sm mr-1"
                        :to="`/courses/${$route.params.name}/problems/${id}/stats`"
                      >
                        <i-uil-chart-line class="lg:h-5 lg:w-5" />
                      </router-link>
                    </div>
                    <div class="tooltip" data-tip="Copycat">
                      <router-link
                        v-if="rolesCanReadProblemStatus.includes(session.role)"
                        class="btn btn-circle btn-ghost btn-sm mr-1"
                        :to="`/courses/${$route.params.name}/problems/${id}/copycat`"
                      >
                        <i-uil-file-exclamation-alt class="lg:h-5 lg:w-5" />
                      </router-link>
                    </div>
                    <div class="tooltip" data-tip="Edit">
                      <router-link
                        v-if="rolesCanReadProblemStatus.includes(session.role)"
                        class="btn btn-circle btn-ghost btn-sm"
                        :to="`/courses/${$route.params.name}/problems/${id}/edit`"
                      >
                        <i-uil-edit class="lg:h-5 lg:w-5" />
                      </router-link>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <template
              v-else
              v-for="{ id, title, tags, total_quota, total_submissions, is_public } in (
                problems?.results || []
              ).slice((page - 1) * 10, page * 10)"
            >
              <problem-info
                :id="id"
                :problem-name="title"
                :unlimited-quota="isQuotaUnlimited(total_quota)"
                :quota-limit="total_quota"
                :quota-remaining="total_quota - total_submissions"
                :tags="tags"
                :visible="is_public"
                :is-admin="session.isAdmin"
                :is-teacher="session.isTeacher"
              />
            </template>
          </template>
        </data-status-wrapper>

        <div class="card-actions mt-5">
          <pagination-buttons v-model="page" :maxPage="maxPage" />
        </div>
      </div>
    </div>
  </div>
</template>
