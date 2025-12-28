<script setup lang="ts">
import { useRoute } from "vue-router";
import { useTitle } from "@vueuse/core";
import { ref, onMounted } from "vue";
import api from "@/api";
const route = useRoute();
useTitle(`Problem - ${route.params.id} - ${route.params.courseId} | Normal OJ`);
const problem = ref<ProblemInfo | null>(null);
const error = ref<any>(null);
const isLoading = ref<boolean>(false);
async function loadProblem() {
  isLoading.value = true;
  error.value = null;

  try {
    const res = await api.Problem.getProblemInfo(Number(route.params.id));
    problem.value = res.data ?? res;
  } catch (err) {
    console.error(err);
    error.value =
      (err as any).response?.data?.detail ||
      (err as any).response?.data?.message ||
      (err as any).message ||
      "Failed to load problem";
  } finally {
    isLoading.value = false;
  }
}
onMounted(loadProblem);
</script>

<template>
  <div class="card-container pb-40">
    <data-status-wrapper :error="error" :is-loading="isLoading">
      <template #loading>
        <skeleton-card />
      </template>
      <template #data>
        <problem-card v-if="problem" :problem="problem" />
      </template>
    </data-status-wrapper>
  </div>
</template>
