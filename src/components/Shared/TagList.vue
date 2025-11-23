<script setup lang="ts">
interface Props {
  tags: string[];
  size?: string; // 若之後想做 large / small，可以留著
  colorMode?: string; // 若之後想做 dark/light，可保留
}
const props = defineProps<Props>();
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <span v-for="tag in props.tags" :key="tag" class="badge badge-outline cursor-default px-3 py-1 text-xs">
      {{ tag }}
    </span>
  </div>
</template>

<style scoped>
.badge {
  border-radius: 0.375rem;
  transition: 0.2s ease;
}

.badge:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>
