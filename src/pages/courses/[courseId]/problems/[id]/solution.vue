<script setup lang="ts">
import { ref, computed } from "vue";
import { useAxios } from "@vueuse/integrations/useAxios";
import { useRoute } from "vue-router";
import { useTitle } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { fetcher } from "@/api";

const route = useRoute();
const { t } = useI18n();

useTitle(`Solution - ${route.params.id} - ${route.params.courseId} | Normal OJ`);

const {
  data: problem,
  error,
  isLoading,
} = useAxios<ProblemInfo>(`/problem/view/${route.params.id}`, fetcher);

// 愛心數量（之後改成後端回傳的值）
const likes = ref(666);
const isLiked = ref(false);

const toggleLike = () => {
  isLiked.value = !isLiked.value;
  likes.value += isLiked.value ? 1 : -1;
};

const solutionContent = computed(
  () => (problem.value as any)?.solution || "There isn't any solution for this problem.",
);
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body">
        <!-- 上方：標題 + 愛心 -->
        <div class="flex items-center justify-between">
          <div class="card-title md:text-2xl lg:text-3xl">Solution for Problem #{{ $route.params.id }}</div>

          <button type="button" class="btn btn-ghost gap-2" @click="toggleLike">
            <span class="text-2xl leading-none">
              {{ isLiked ? "♥" : "♡" }}
            </span>
            <span class="text-lg">{{ likes }}</span>
          </button>
        </div>

        <!-- 內容: Solution -->
        <div class="mt-6">
          <template v-if="isLoading">
            <div class="flex justify-center py-10">
              <ui-spinner class="h-10 w-10" />
            </div>
          </template>

          <template v-else-if="error">
            <div class="alert alert-error mt-4 shadow-lg">
              <div>
                <i-uil-times-circle />
                <span>{{ t("course.problem.solution.err.load") }}</span>
              </div>
            </div>
          </template>

          <template v-else-if="problem">
            <markdown-renderer class="prose max-w-none" :md="solutionContent" />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
