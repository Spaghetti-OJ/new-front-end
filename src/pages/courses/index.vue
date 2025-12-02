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

onMounted(async () => {
  try {
    const res = await api.Course.list();
    if (res?.data.courses && Array.isArray(res.data.courses)) {
      courses.value = res.data.courses;
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
    joinCode.value = "";
  } catch (err: any) {
    // 錯誤
    joinError.value =
      err?.response?.data?.msg ?? "Failed to join course. Please check the code.";
  } finally {
    joinLoading.value = false;
  }
};

const displayedCourses = computed(() => [...(courses.value ?? [])].reverse());

const session = useSession();
const rolesCanCreateCourse = [UserRole.Admin, UserRole.Teacher];
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
          class="flex items-center gap-2"
          @submit.prevent="onJoinCourse"
        >
          <input
            v-model="joinCode"
            type="text"
            class="input input-sm input-bordered w-52 md:w-64"
            placeholder="Join with course code"
          />
          <button
            type="submit"
            class="btn btn-sm btn-success min-w-[4rem]"
            :disabled="joinLoading"
          >
            <span v-if="!joinLoading">join</span>
            <span
              v-else
              class="loading loading-spinner loading-xs"
            />
          </button>
        </form>
      </div>

      <div class="my-2" />

      <data-status-wrapper :error="error" :is-loading="isLoading">
        <template #loading>
          <skeleton-table :col="2" :row="5" />
        </template>
        <template #data>
          <table class="table w-full">
            <thead>
              <tr>
                <th>{{ $t("courses.index.table.course") }}</th>
                <th>{{ $t("courses.index.table.teacher") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="{ id, course, teacher } in displayedCourses" :key="id" class="hover">
                <td
                  :class="{
                    'min-w-[10rem] max-w-[12rem] whitespace-pre-wrap': !isDesktop,
                  }"
                >
                  <router-link :to="`/courses/${id}`" class="link link-hover">{{ course }}</router-link>
                </td>
                <td>{{ teacher.username }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </data-status-wrapper>
    </div>
  </div>
</template>
