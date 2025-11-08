<script setup lang="ts">
import { getTagColor } from "@/constants";
interface Props {
  tags: string[];
}
const props = defineProps<Props>();
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <span
      v-for="tag in props.tags"
      :key="tag"
      class="badge"
      :style="{ backgroundColor: getTagColor(tag), color: '#fff', border: 'none' }"
    >
      {{ tag }}
    </span>
  </div>
</template>

<style scoped>
.badge {
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.badge:hover {
  filter: brightness(1.1);
}
</style>
