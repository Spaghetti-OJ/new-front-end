<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import ProfileLayout from "@/components/Profile/ProfileLayout.vue";
import ProfileAvatarBlock from "@/components/Profile/ProfileAvatarBlock.vue";
import ProfileField from "@/components/Profile/ProfileField.vue";
import ProfileProgressBar from "@/components/Profile/ProfileProgressBar.vue";
import { useI18n } from "vue-i18n";
import api from "@/api";

const { t } = useI18n();
const route = useRoute();
const username = route.params.id as string;

const user = ref<PublicUserProfile | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    user.value = await api.Auth.getPublicProfile(username);
  } catch (err: any) {
    console.error("Failed to fetch public profile:", err);
    error.value = "Failed to load user profile.";
  } finally {
    isLoading.value = false;
  }
});

const heatmapData = [
  { date: "2025-01-01", count: 5 },
  { date: "2025-01-02", count: 1 },
  { date: "2025-01-03", count: 0 },
  { date: "2025-01-04", count: 8 },
  { date: "2025-01-05", count: 3 },
  { date: "2025-01-06", count: 2 },
  { date: "2025-01-07", count: 6 },
  { date: "2025-01-08", count: 0 },
  { date: "2025-01-09", count: 10 },
  { date: "2025-01-10", count: 4 },
  { date: "2025-01-11", count: 7 },
  { date: "2025-01-12", count: 2 },
  { date: "2025-01-13", count: 1 },
  { date: "2025-01-14", count: 9 },
  { date: "2025-01-15", count: 3 },
  { date: "2025-01-16", count: 0 },
  { date: "2025-01-17", count: 6 },
  { date: "2025-01-18", count: 4 },
  { date: "2025-01-19", count: 1 },
  { date: "2025-01-20", count: 5 },
  { date: "2025-01-21", count: 3 },
  { date: "2025-01-22", count: 2 },
  { date: "2025-01-23", count: 8 },
  { date: "2025-01-24", count: 10 },
  { date: "2025-01-25", count: 0 },
];
</script>

<template>
  <div v-if="isLoading" class="flex min-h-screen items-center justify-center">
    <span class="loading-spinner loading-lg loading"></span>
  </div>
  <div v-else-if="error || !user" class="flex min-h-screen items-center justify-center text-error">
    {{ error || "User not found" }}
  </div>
  <ProfileLayout v-else>
    <!-- 左邊-->
    <template #left>
      <ProfileAvatarBlock :avatar-url="user.avatar || ''" :editable-avatar="false" />
    </template>

    <!-- 右邊 -->
    <template #right>
      <section class="w-full">
        <div class="mb-4">
          <span
            class="inline-flex gap-4 rounded-[8px] px-4 py-2 text-lg font-semibold"
            :class="{
              'bg-[#F3C5C5] ': user.role === 'Student',
              'bg-[#C5F3D2] ': user.role === 'Teacher',
              'bg-[#90B8E0] ': user.role === 'Assistant',
            }"
          >
            {{ user.role }}
          </span>
        </div>

        <div class="grid grid-cols-1 gap-x-[33px] gap-y-4 md:grid-cols-[minmax(0,35%)_minmax(0,65%)]">
          <ProfileField :label="t('profile.userId')" :model-value="user.username" :editable="false" />
          <ProfileField
            :label="t('profile.introduction')"
            :model-value="user.bio"
            :editable="false"
            type="textarea"
            container-class="md:col-span-2"
          />
        </div>

        <div class="mt-4">
          <ProfileProgressBar
            :contributions="heatmapData"
            :submission="204"
            :acceptance="100"
            :totalsolved="135"
            :data="{ easy: 75, med: 40, hard: 20 }"
            :beatrate="15.27"
          />
        </div>
      </section>
    </template>
  </ProfileLayout>
</template>
