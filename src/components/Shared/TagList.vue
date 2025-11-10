<script setup lang="ts">
import { computed } from "vue";

type TagSize = "xs" | "sm" | "md" | "lg";
type ColorMode = "solid" | "outline" | "ghost";

const sizeToClass: Record<TagSize, string> = {
  xs: "badge-xs",
  sm: "badge-sm",
  md: "",
  lg: "badge-lg",
};

const colorModeClass: Record<ColorMode, string> = {
  solid: "badge-primary text-primary-content",
  outline: "badge-outline",
  ghost: "badge-ghost",
};

const props = withDefaults(
  defineProps<{
    tags: string[];
    size?: TagSize;
    colorMode?: ColorMode;
  }>(),
  {
    tags: () => [],
    size: "md",
    colorMode: "solid",
  },
);

const tagClass = computed(() => {
  const classes = ["badge transition-all"];
  const sizeClass = sizeToClass[props.size];
  const colorClass = colorModeClass[props.colorMode];

  if (sizeClass) classes.push(sizeClass);
  if (colorClass) classes.push(colorClass);

  return classes;
});
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <span v-for="tag in props.tags" :key="tag" :class="tagClass">
      {{ tag }}
    </span>
  </div>
</template>

<style scoped>
.badge {
  border-radius: 0.375rem;
}
</style>
