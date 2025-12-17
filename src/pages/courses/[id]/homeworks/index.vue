<script setup lang="ts">
import { useRoute } from "vue-router";
import api from "@/api";
import { useSession } from "@/stores/session";
import { useTitle } from "@vueuse/core";
import { computed, ref, onMounted } from "vue";
import { useProblemSelection } from "@/composables/useProblemSelection";

const session = useSession();
const route = useRoute();

useTitle(`Homeworks - ${route.params.name} | Normal OJ`);
const homeworksData = ref<GetHomeworksResponse>();
const isLoading = ref(true);
const error = ref<any>(null);

const {
  problemId2Meta,
  error: fetchProblemError,
  isLoading: isFetchingProblem,
} = useProblemSelection(route.params.name as string);

const homeworks = computed(() => {
  if (!homeworksData.value) return [];
  return homeworksData.value.items.sort((a, b) => (b.start || 0) - (a.start || 0));
});

onMounted(async () => {
  try {
    const { data } = await api.Homework.list(route.params.name as string);
    homeworksData.value = data;
  } catch (e) {
    error.value = e;
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
          <router-link
            v-if="session.isAdmin"
            class="btn btn-success"
            :to="`/courses/${$route.params.name}/homeworks/new`"
          >
            <i-uil-plus-circle class="mr-1 lg:h-5 lg:w-5" /> {{ $t("course.hw.index.new") }}
          </router-link>
        </div>
        <data-status-wrapper :error="error || fetchProblemError" :is-loading="isLoading || isFetchingProblem">
          <template #loading>
            <skeleton-card />
          </template>
          <template #data>
            <homework-card
              v-for="homework in homeworks"
              :key="homework.id"
              :homework="homework"
              :problems="problemId2Meta"
              class="mb-2"
            />
          </template>
        </data-status-wrapper>
      </div>
    </div>
  </div>
</template>
