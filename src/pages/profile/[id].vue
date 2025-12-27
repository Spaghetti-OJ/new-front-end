<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
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
const userStats = ref<UserStats | null>(null);
const submissionActivity = ref<Record<string, number>>({});
const isLoading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    isLoading.value = true;
    const profile = await api.Auth.getPublicProfile(username);
    user.value = profile;

    if (profile && profile.user_id) {
      const [statsResp, activityResp] = await Promise.all([
        api.Auth.getUserStats(profile.user_id),
        api.Auth.getSubmissionsActivity(profile.user_id),
      ]);

      if (statsResp && statsResp.data && statsResp.data.user_stats) {
        userStats.value = statsResp.data.user_stats;
      }

      if (activityResp && activityResp.data) {
        submissionActivity.value = activityResp.data;
      }
    }
  } catch (err: any) {
    console.error("Failed to fetch public profile:", err);
    error.value =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      "Failed to load user profile.";
  } finally {
    isLoading.value = false;
  }
});

const heatmapData = computed(() => {
  return Object.entries(submissionActivity.value).map(([date, count]) => ({
    date,
    count,
  }));
});

const difficultyStats = computed(() => {
  return { easy: 0, med: 0, hard: 0 };
});

const beatRate = computed(() => {
  return 0; // consistent with no data
});
</script>

<template>
  <div class="card-container" :class="{ 'min-h-screen items-center': error }">
    <data-status-wrapper :error="error" :is-loading="isLoading" :class="{ 'w-full max-w-2xl': error }">
      <template #loading>
        <div class="flex min-h-screen items-center justify-center">
          <span class="loading-spinner loading-lg loading"></span>
        </div>
      </template>
      <template #error>
        <div class="text-xl text-error">
          {{ error || "Something went wrong" }}
        </div>
      </template>
      <template #data>
        <ProfileLayout v-if="user">
          <!-- 左邊-->
          <template #left>
            <ProfileAvatarBlock :avatar-url="user.avatar || ''" :editable-avatar="false" />
          </template>

          <!-- 右邊 -->
          <template #right>
            <section class="w-full">
              <div class="mb-4">
                <span
                  class="inline-flex gap-4 rounded-[8px] px-4 py-2 text-lg font-semibold text-black"
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
                  :submission="userStats?.total_submissions || 0"
                  :acceptance="userStats?.acceptance_rate || 0"
                  :totalsolved="userStats?.ac_problems || 0"
                  :data="difficultyStats"
                  :beatrate="beatRate"
                />
              </div>
            </section>
          </template>
        </ProfileLayout>
        <div v-else class="text-xl text-zinc-500">User not found</div>
      </template>
    </data-status-wrapper>
  </div>
</template>
