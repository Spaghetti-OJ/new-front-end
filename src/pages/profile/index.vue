<script setup lang="ts">
import { reactive, ref, toRef, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "@/api";
import { useSession } from "@/stores/session";
import { useTitle } from "@vueuse/core";
import { required, sameAs, helpers } from "@vuelidate/validators";
import useVuelidate from "@vuelidate/core";
import axios from "axios";
import { useI18n } from "vue-i18n";
import ProfileLayout from "@/components/Profile/ProfileLayout.vue";
import ProfileAvatarBlock from "@/components/Profile/ProfileAvatarBlock.vue";
import ProfileField from "@/components/Profile/ProfileField.vue";
import ProfileProgressBar from "@/components/Profile/ProfileProgressBar.vue";

useTitle("Profile | Normal OJ");
const router = useRouter();
const session = useSession();
const ROLE = ["Admin", "Teacher", "Student"];
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

// 組件掛載時載入資料
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

const changePasswordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
  isLoading: false,
  errorMsg: "",
  isFinished: false,
});

const rules = {
  newPassword: { required },
  oldPassword: { required },
  confirmPassword: {
    required,
    sameAsRef: helpers.withMessage(
      t("profile.rules.confirmPassword.sameAsRef"),
      sameAs(toRef(changePasswordForm, "newPassword")),
    ),
  },
};
const v$ = useVuelidate(rules, changePasswordForm);

async function changePassword() {
  const isFormCorrect = await v$.value.$validate();
  if (!isFormCorrect) return;
  changePasswordForm.errorMsg = "";
  changePasswordForm.isFinished = false;
  changePasswordForm.isLoading = true;
  try {
    await api.Auth.changePassword({
      old_password: changePasswordForm.oldPassword,
      new_password: changePasswordForm.newPassword,
    });
    clearForm();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.data.message === "Wrong Password") {
        changePasswordForm.errorMsg = t("profile.wrongPassword");
      } else {
        changePasswordForm.errorMsg = t("profile.operationFailed");
      }
    } else {
      throw error;
    }
  } finally {
    changePasswordForm.isLoading = false;
  }
}

function clearForm() {
  changePasswordForm.oldPassword = "";
  changePasswordForm.newPassword = "";
  changePasswordForm.confirmPassword = "";
  changePasswordForm.isFinished = true;
  v$.value.$reset();
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
</script>

<template>
  <ProfileLayout v-if="profile">
    <!-- 左邊：頭貼，可編輯 -->
    <template #left>
      <ProfileAvatarBlock :avatar-url="profile.md5 || ''" :editable-avatar="false" :buttons="[
        { label: t('profile.edit'), variant: 'primary', action: 'Edit' },
        { label: t('profile.signOut'), variant: 'error', action: 'Sign Out' },
      ]" @click="onAvatarAction" />
    </template>

    <!-- 右邊：可編輯資訊欄 -->
    <template #right>
      <section class="w-full">
        <div class="grid grid-cols-1 gap-x-[33px] gap-y-4 md:grid-cols-[minmax(0,35%)_minmax(0,65%)]">
          <ProfileField :label="t('profile.realName')" :model-value="profile.real_name" :editable="false" />
          <ProfileField :label="t('profile.username')" :model-value="profile.user_name" :editable="false" />
          <ProfileField :label="t('profile.role')" :model-value="profile.role" :editable="false" />
          <ProfileField :label="t('profile.email')" :model-value="profile.email" :editable="false" type="email" />
          <ProfileField :label="t('profile.studentId')" :model-value="profile.student_id" :editable="false" />
          <ProfileField :label="t('profile.introduction')" :model-value="profile.introduction" :editable="false"
            type="textarea" container-class="md:col-span-2" />
        </div>
        <div class="mt-4">
          <ProfileProgressBar :contributions="heatmapData" :submission="204" :acceptance="100" :totalsolved="135"
            :data="{ easy: 75, med: 40, hard: 20 }" :beatrate="15.27" />
        </div>
      </section>
    </template>
  </ProfileLayout>
  <div v-else-if="isLoadingProfile" class="flex items-center justify-center min-h-screen">
    <span class="loading loading-spinner loading-lg"></span>
  </div>
</template>