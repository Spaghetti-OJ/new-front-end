<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useTitle } from "@vueuse/core";
import { useRoute } from "vue-router";
import api from "@/api";
const route = useRoute();

useTitle(`Announcement - ${route.params.id} | Normal OJ`);
const announcements = ref<AnnouncementList>([]);
const isLoading = ref(true);
const error = ref<any>(null);
const annid = route.params.id;
const public_course = "1";
onMounted(async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const res = await api.Announcement.getOne(public_course, annid[0]);

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
    <router-link class="btn btn-sm mb-10" to="/">
      <i-uil-left-arrow-to-left class="mr-1" /> {{ $t("ann.id.back") }}
    </router-link>

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
