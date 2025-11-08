<script setup lang="ts">
import { defineProps } from "vue";

interface Props {
  tags: string[];
  size?: "sm" | "md" | "lg";
  colorMode?: "outline" | "solid";
}

const props = defineProps<Props>();

const badgeClass = (tag: string) => {
  // 🔹 你可以根據關鍵字自動配色，例如難度/主題
  if (tag.toLowerCase().includes("linked")) return "bg-blue-500/20 text-blue-300";
  if (tag.toLowerCase().includes("dynamic")) return "bg-pink-500/20 text-pink-300";
  if (tag.toLowerCase().includes("tree")) return "bg-green-500/20 text-green-300";
  return "bg-gray-500/20 text-gray-300";
};
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <span
      v-for="tag in props.tags"
      :key="tag"
      class="badge"
      :class="[
        props.size === 'lg'
          ? 'px-3 py-1 text-sm'
          : props.size === 'sm'
          ? 'px-2 py-0.5 text-xs'
          : 'px-2 py-1 text-xs',
        props.colorMode === 'solid' ? 'border-none bg-white/10' : 'border border-white/20',
        badgeClass(tag),
      ]"
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
  background-color: rgba(255, 255, 255, 0.15);
}
</style>
