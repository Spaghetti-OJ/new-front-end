<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "@/api";
import { useSession } from "@/stores/session";
import { useTitle } from "@vueuse/core";
import { useI18n } from "vue-i18n";
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

async function loadProfile() {
  isLoadingProfile.value = true;
  try {
    const data = await api.Auth.getProfile();
    profile.value = data;
  } catch (error) {
    console.error("Failed to load profile:", error);
  } finally {
    isLoadingProfile.value = false;
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

function onAvatarAction(action: "Edit" | "Sign Out") {
  if (action === "Edit") {
    router.push("/profile/edit");
  }
  if (action === "Sign Out") {
    logout();
  }
}

const isVerifying = ref(false);
async function sendVerifyEmail() {
  if (isVerifying.value) return;
  isVerifying.value = true;
  try {
    await api.Auth.sendVerifyEmail();
    alert(t("profile.verifyEmailSuccess"));
  } catch (error) {
    console.error(error);
    alert(t("profile.verifyEmailFailed"));
  } finally {
    isVerifying.value = false;
  }
}
</script>

<template>
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
          <ProfileField :label="t('profile.realName')" :model-value="profile.real_name" :editable="false" />
          <ProfileField :label="t('profile.username')" :model-value="profile.username" :editable="false" />
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
          <ProfileField :label="t('profile.studentId')" :model-value="profile.student_id" :editable="false" />
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
  <div v-else-if="isLoadingProfile" class="flex min-h-screen items-center justify-center">
    <span class="loading-spinner loading-lg loading"></span>
  </div>
</template>
