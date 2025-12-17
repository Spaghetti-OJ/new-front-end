<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useTitle } from "@vueuse/core";
import api from "@/api";
import { useSession, UserRole } from "@/stores/session";

import useInteractions from "@/composables/useInteractions";

const { isDesktop } = useInteractions();

useTitle("Courses | Normal OJ");
const courses = ref<CourseList | null>(null);
const isLoading = ref(true);
const error = ref<any>(undefined);

const joinCode = ref("");
const joinLoading = ref(false);
const joinError = ref<string | null>(null);

const summaryMap = ref<Record<string, CourseSummary["breakdown"][0]>>({});

onMounted(async () => {
  try {
    const res = await api.Course.list();
    if (res?.data.courses && Array.isArray(res.data.courses)) {
      courses.value = res.data.courses;
    }

    if (session.isAdmin) {
      const { data: summaryData } = await api.Course.getSummary();
      if (summaryData?.breakdown) {
        summaryData.breakdown.forEach((item) => {
          summaryMap.value[item.course] = item;
        });
      }
    }
  } catch (err: any) {
    error.value = err;
  } finally {
    isLoading.value = false;
  }
});

const onJoinCourse = async () => {
  const code = joinCode.value.trim();
  if (!code) return;

  joinLoading.value = true;
  joinError.value = null;

  try {
    await api.Course.join({ code });
    joinCode.value = "";
    // Refresh course list after successful join
    const res = await api.Course.list();
    if (res?.data.courses && Array.isArray(res.data.courses)) {
      courses.value = res.data.courses;
    }
  } catch (err: any) {
    // 錯誤
    joinError.value = err?.response?.data?.msg ?? "Failed to join course. Please check the code.";
  } finally {
    joinLoading.value = false;
  }
};

const displayedCourses = computed(() => [...(courses.value ?? [])].reverse());

const session = useSession();
const rolesCanCreateCourse = [UserRole.Admin, UserRole.Teacher];

function getSummary(courseName: string) {
  return (
    summaryMap.value[courseName] || {
      userCount: 0,
      homeworkCount: 0,
      submissionCount: 0,
      problemCount: 0,
    }
  );
}
</script>

<template>
  <div class="card mx-auto max-w-5xl shadow-xl">
    <div class="card-body">
      <div class="card-title justify-between">
        {{ $t("courses.index.list") }}
        <router-link
          v-if="rolesCanCreateCourse.includes(session.role)"
          class="btn btn-success"
          to="/courses/new"
        >
          <i-uil-plus-circle class="mr-1 lg:h-5 lg:w-5" /> {{ $t("courses.index.new") }}
        </router-link>

        <!-- join 區塊 -->
        <form
          v-if="!rolesCanCreateCourse.includes(session.role)"
          class="flex items-center gap-2"
          @submit.prevent="onJoinCourse"
        >
          <data-status-wrapper :error="joinError" :is-loading="joinLoading">
            <template #error>
              <div class="flex items-center gap-2 rounded-lg bg-error px-3 py-2 text-xs text-black shadow-sm">
                <i-uil-exclamation-circle class="h-4 w-4 shrink-0" />
                <span class="font-medium">{{ joinError }}</span>
              </div>
            </template>
          </data-status-wrapper>
          <input
            v-model="joinCode"
            type="text"
            class="input input-bordered input-sm w-52 md:w-64"
            placeholder="Join with course code"
          />
          <button type="submit" class="btn btn-success btn-sm min-w-[4rem]" :disabled="joinLoading">
            <span v-if="!joinLoading">Join</span>
            <span v-else class="loading-spinner loading-xs loading" />
          </button>
        </form>
      </div>

      <div class="my-2" />

      <data-status-wrapper :error="error" :is-loading="isLoading">
        <template #loading>
          <div class="grid grid-cols-1 gap-4">
            <div v-for="i in 5" :key="i" class="h-32 animate-pulse rounded-xl bg-base-200"></div>
          </div>
        </template>
        <template #data>
          <!-- Admin View: Cards with Stats -->
          <div v-if="session.isAdmin" class="flex flex-col gap-4">
            <div
              v-for="{ id, course, teacher } in displayedCourses"
              :key="id"
              class="card relative border border-base-200 bg-base-100 shadow-md transition-all hover:shadow-lg"
            >
              <div class="card-body flex flex-col justify-between gap-4 p-4 pl-6 md:flex-row md:items-center">
                <!-- Course Info (Left) -->
                <div class="flex flex-1 items-center gap-4">
                  <div class="flex flex-col">
                    <h2 class="card-title text-xl font-bold">
                      <router-link :to="`/courses/${id}`" class="link link-hover text-base-content">
                        {{ course }}
                      </router-link>
                    </h2>
                    <div class="mt-1 flex items-center gap-2 text-sm text-base-content/70">
                      <i-uil-user class="h-4 w-4" />
                      <span class="font-medium">{{ teacher.real_name || teacher.username }}</span>
                    </div>
                  </div>
                </div>

                <!-- Admin Stats (Right) -->
                <div
                  class="w-full border-t border-base-200 pt-4 md:w-auto md:border-l md:border-t-0 md:pl-6 md:pt-0"
                >
                  <div class="grid grid-cols-4 text-center md:flex md:gap-8 md:text-left">
                    <div class="flex flex-col items-center gap-2 md:flex-row" title="Students">
                      <div class="rounded-lg bg-base-200 p-2 text-base-content/70">
                        <i-uil-users-alt class="h-5 w-5" />
                      </div>
                      <div class="flex flex-col">
                        <span class="text-xs opacity-70">Students</span>
                        <span class="text-lg font-bold leading-none">{{ getSummary(course).userCount }}</span>
                      </div>
                    </div>

                    <div class="flex flex-col items-center gap-2 md:flex-row" title="Homeworks">
                      <div class="rounded-lg bg-base-200 p-2 text-base-content/70">
                        <i-uil-file-alt class="h-5 w-5" />
                      </div>
                      <div class="flex flex-col">
                        <span class="text-xs opacity-70">Homeworks</span>
                        <span class="text-lg font-bold leading-none">{{
                          getSummary(course).homeworkCount
                        }}</span>
                      </div>
                    </div>

                    <div class="flex flex-col items-center gap-2 md:flex-row" title="Submissions">
                      <div class="rounded-lg bg-base-200 p-2 text-base-content/70">
                        <i-uil-upload class="h-5 w-5" />
                      </div>
                      <div class="flex flex-col">
                        <span class="text-xs opacity-70">Submits</span>
                        <span class="text-lg font-bold leading-none">{{
                          getSummary(course).submissionCount
                        }}</span>
                      </div>
                    </div>

                    <div class="flex flex-col items-center gap-2 md:flex-row" title="Problems">
                      <div class="rounded-lg bg-base-200 p-2 text-base-content/70">
                        <i-uil-puzzle-piece class="h-5 w-5" />
                      </div>
                      <div class="flex flex-col">
                        <span class="text-xs opacity-70">Problems</span>
                        <span class="text-lg font-bold leading-none">{{
                          getSummary(course).problemCount
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- General View -->
          <div v-else class="overflow-x-auto">
            <table class="table w-full">
              <thead>
                <tr>
                  <th>{{ $t("courses.index.table.course") }}</th>
                  <th>{{ $t("courses.index.table.teacher") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="{ id, course, teacher } in displayedCourses" :key="id" class="hover">
                  <td>
                    <router-link :to="`/courses/${id}`" class="link link-hover text-base-content">
                      {{ course }}
                    </router-link>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      {{ teacher.username }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </data-status-wrapper>
    </div>
  </div>
</template>
