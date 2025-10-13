<script setup lang="ts">
interface Props {
  to: string;
}
defineProps<Props>();
</script>

<template>
  <router-link class="btn btn-primary rounded-none p-2" :to="to">
    <div class="flex flex-col items-center">
      <slot />
    </div>
  </router-link>
</template>
