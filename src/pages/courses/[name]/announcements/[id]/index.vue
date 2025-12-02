<script setup lang="ts">
import { useTitle } from "@vueuse/core";
import { useRoute } from "vue-router";
import { ref, onMounted } from "vue";
import api from "@/api";

const route = useRoute();
useTitle(`Announcement - ${route.params.id} - ${route.params.name} | Normal OJ`);
const announcements = ref<AnnouncementList>([]);
const isLoading = ref(true);
const error = ref<any>(null);
onMounted(async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const courseId = route.params.name as string;

    const res = await api.Announcement.getAnnouncement(courseId);

    announcements.value = res.data ?? (res as any);
  } catch (e) {
    console.error(e);
    error.value = e;
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="mx-auto flex max-w-7xl gap-8 p-4">
    <data-status-wrapper :error="error" :is-loading="isLoading">
      <template #loading>
        <skeleton-card />
      </template>
      <template #data>
        <announcement-card v-if="announcements" :announcement="announcements[0]" />
      </template>
    </data-status-wrapper>
  </div>
</template>
