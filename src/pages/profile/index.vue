<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "@/api";
import { useSession } from "@/stores/session";
import { useTitle } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import axios from "axios";
import ProfileLayout from "@/components/Profile/ProfileLayout.vue";
import ProfileAvatarBlock from "@/components/Profile/ProfileAvatarBlock.vue";
import ProfileField from "@/components/Profile/ProfileField.vue";
import ProfileProgressBar from "@/components/Profile/ProfileProgressBar.vue";

useTitle("Profile | Normal OJ");
const router = useRouter();
const session = useSession();
const { t } = useI18n();

const profile = ref<UserProperties | null>(null);
const isLoadingProfile = ref(false);
const fetchError = ref<string | null>(null);

async function loadProfile() {
  isLoadingProfile.value = true;
  try {
    const data = await api.Auth.getProfile();
    profile.value = data;
    if (data && data.user_id && data.email_verified) {
      const results = await Promise.allSettled([
        loadStats(data.user_id),
        loadSubmissionActivity(data.user_id),
      ]);

      if (results[0].status === "rejected") {
        console.warn("Failed to load user stats:", results[0].reason);
      }
      if (results[1].status === "rejected") {
        console.warn("Failed to load submission activity:", results[1].reason);
      }
    }
  } catch (error: any) {
    console.error("Failed to load profile:", error);
    fetchError.value =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "Failed to load profile";
  } finally {
    isLoadingProfile.value = false;
  }
}

const stats = ref<UserStats | null>(null);

async function loadStats(userId: string) {
  const res = await api.Auth.getUserStats(userId);
  if (res?.data?.user_stats) {
    stats.value = res.data.user_stats;
  }
}

onMounted(() => {
  loadProfile();
});

const refreshtype = {
  refresh: session.refreshtoken,
};
async function logout() {
  try {
    await api.Auth.logout(refreshtype);
    session.logoutLocally();
    router.replace("/");
  } catch (error) {
    session.logoutLocally();
    router.replace("/");
  }
}

const heatmapData = ref<{ date: string; count: number }[]>([]);

async function loadSubmissionActivity(userId: string) {
  const res = await api.Auth.getSubmissionsActivity(userId);
  if (res?.data) {
    heatmapData.value = Object.entries(res.data).map(([date, count]) => ({
      date,
      count,
    }));
  }
}

function onAvatarAction(action: "Edit" | "Sign Out") {
  if (action === "Edit") {
    router.push("/profile/edit");
  }
  if (action === "Sign Out") {
    logout();
  }
}

const isVerifying = ref(false);
const showVerifyModal = ref(false);
const error = ref<string | null>(null);

async function sendVerifyEmail() {
  if (isVerifying.value) return;
  isVerifying.value = true;
  error.value = null;
  try {
    await api.Auth.sendVerifyEmail();
    showVerifyModal.value = true;
  } catch (err) {
    console.error(err);
    if (axios.isAxiosError(err) && err.response?.data) {
      const msg = (err.response.data as any).message;
      if (msg === "Email Not Set") {
        error.value = t("profile.emailNotSet");
      } else if (msg === "Email Already Verified") {
        error.value = t("profile.emailAlreadyVerified");
      } else {
        error.value =
          (err as any).response?.data?.detail ||
          (err as any).response?.data?.message ||
          (err as any).message ||
          t("profile.verifyEmailFailed");
      }
    } else {
      error.value = (err as any).message || t("profile.verifyEmailFailed");
    }
  } finally {
    isVerifying.value = false;
  }
}
</script>

<template>
  <div class="card-container" :class="{ 'min-h-screen items-center': fetchError }">
    <data-status-wrapper
      :error="fetchError"
      :is-loading="isLoadingProfile"
      :class="{ 'w-full max-w-2xl': fetchError }"
    >
      <template #loading>
        <div class="flex min-h-screen items-center justify-center">
          <span class="loading-spinner loading-lg loading"></span>
        </div>
      </template>
      <template #error>
        <div class="text-xl text-error">
          {{ fetchError || "Something went wrong" }}
        </div>
      </template>
      <template #data>
        <ProfileLayout v-if="profile">
          <!-- 左邊：頭貼，可編輯 -->
          <template #left>
            <ProfileAvatarBlock
              :avatar-url="profile.avatar || ''"
              :editable-avatar="false"
              :buttons="[
                { label: t('profile.edit'), variant: 'primary', action: 'Edit' },
                { label: t('profile.signOut'), variant: 'error', action: 'Sign Out' },
              ]"
              @click="onAvatarAction"
            />
          </template>

          <!-- 右邊：可編輯資訊欄 -->
          <template #right>
            <section class="w-full">
              <div class="grid grid-cols-1 gap-x-[33px] gap-y-4 md:grid-cols-[minmax(0,35%)_minmax(0,65%)]">
                <ProfileField
                  :label="t('profile.realName')"
                  :model-value="profile.real_name"
                  :editable="false"
                />
                <ProfileField
                  :label="t('profile.username')"
                  :model-value="profile.username"
                  :editable="false"
                />
                <ProfileField :label="t('profile.role')" :model-value="profile.role" :editable="false" />
                <div class="flex items-end gap-2">
                  <ProfileField
                    :label="t('profile.email')"
                    :model-value="profile.email"
                    :editable="false"
                    type="email"
                    container-class="w-full"
                  />
                  <div v-if="profile.email_verified" class="mb-3 text-success">
                    <i-uil-check-circle class="h-6 w-6" />
                  </div>
                  <button
                    v-else
                    class="btn btn-primary mb-[2px]"
                    :class="{ loading: isVerifying }"
                    @click="sendVerifyEmail"
                  >
                    {{ t("profile.verifyEmail") }}
                  </button>
                </div>
                <div v-if="error" class="text-sm text-error md:col-start-2">{{ error }}</div>
                <ProfileField
                  :label="t('profile.studentId')"
                  :model-value="profile.student_id"
                  :editable="false"
                />
                <ProfileField
                  :label="t('profile.introduction')"
                  :model-value="profile.bio"
                  :editable="false"
                  type="textarea"
                  container-class="md:col-span-2"
                />
              </div>
              <div class="mt-4">
                <ProfileProgressBar
                  v-if="profile.email_verified"
                  :contributions="heatmapData"
                  :submission="stats?.total_submissions ?? 0"
                  :acceptance="stats?.accept_percent ?? 0"
                  :totalsolved="stats?.ac_problems ?? 0"
                  :data="{ easy: 0, med: 0, hard: 0 }"
                  :beatrate="0"
                />
              </div>
            </section>
          </template>
        </ProfileLayout>
        <div v-else class="text-xl text-zinc-500">Profile not found</div>
      </template>
    </data-status-wrapper>
  </div>

  <!-- Verify Email Modal -->
  <div class="modal" :class="{ 'modal-open': showVerifyModal }">
    <div class="modal-box">
      <h3 class="text-lg font-bold">{{ t("profile.verifyEmailSentTitle") }}</h3>
      <p class="py-4">{{ t("profile.verifyEmailSentMessage") }}</p>
      <div class="modal-action">
        <button class="btn" @click="showVerifyModal = false">{{ t("profile.close") }}</button>
      </div>
    </div>
  </div>
  <div v-if="showVerifyModal" class="modal-backdrop" @click="showVerifyModal = false"></div>
</template>
