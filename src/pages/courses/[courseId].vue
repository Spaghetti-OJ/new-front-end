<script setup lang="ts">
import { computed } from "vue";
import useInteractions from "@/composables/useInteractions";

const { isDesktop } = useInteractions();
const sidebarType = computed(() => (isDesktop.value ? "side" : "tab"));
</script>

<template>
  <div>
    <course-top-bar class="sticky top-0 z-50 bg-base-100" />
    <div
      class="flex"
      :class="{
        'flex-col': !isDesktop,
      }"
    >
      <div class="sticky top-[53px] mr-6 w-52 shrink-0 self-start bg-base-100">
        <course-side-bar :display-type="sidebarType" />
      </div>

      <div class="flex-1">
        <router-view />
      </div>
    </div>
  </div>
</template>
