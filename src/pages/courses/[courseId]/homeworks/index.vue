<script setup lang="ts">
import { useRoute } from "vue-router";
import api from "@/api";
import { useSession } from "@/stores/session";
import { useTitle } from "@vueuse/core";
import { computed, ref, onMounted } from "vue";
import { useProblemSelection } from "@/composables/useProblemSelection";

const session = useSession();
const route = useRoute();

useTitle(`Homeworks - ${route.params.courseId} | Normal OJ`);
const homeworksData = ref<GetHomeworksResponse>();
const isLoading = ref(true);
const error = ref<any>(null);

const {
  problemId2Meta,
  error: fetchProblemError,
  isLoading: isFetchingProblem,
} = useProblemSelection(route.params.courseId as string);

const homeworks = computed(() => {
  if (!homeworksData.value) return [];
  return homeworksData.value.items.sort((a, b) => (b.start || 0) - (a.start || 0));
});

onMounted(async () => {
  try {
    const res = await api.Homework.list(route.params.courseId as string);
    homeworksData.value = res;
  } catch (e) {
    error.value =
      (e as any).response?.data?.detail ||
      (e as any).response?.data?.message ||
      (e as any).message ||
      "Failed to load homeworks";
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body">
        <div class="card-title mb-4 justify-between">
          {{ $t("course.hw.index.title") }}
          <router-link v-if="session.hasCourseAccess(route.params.courseId as string)" class="btn btn-success"
            :to="`/courses/${$route.params.courseId}/homeworks/new`">
            <i-uil-plus-circle class="mr-1 lg:h-5 lg:w-5" /> {{ $t("course.hw.index.new") }}
          </router-link>
        </div>
        <data-status-wrapper :error="error || fetchProblemError" :is-loading="isLoading || isFetchingProblem">
          <template #loading>
            <skeleton-card />
          </template>
          <template #data>
            <homework-card v-for="homework in homeworks" :key="homework.id" :homework="homework"
              :problems="problemId2Meta" class="mb-2" />
          </template>
        </data-status-wrapper>
      </div>
    </div>
  </div>
</template>
