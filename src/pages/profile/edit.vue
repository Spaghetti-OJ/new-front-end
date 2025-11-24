<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import ProfileLayout from "@/components/Profile/ProfileLayout.vue";
import ProfileAvatarBlock from "@/components/Profile/ProfileAvatarBlock.vue";
import ProfileField from "@/components/Profile/ProfileField.vue";
import { useI18n } from "vue-i18n";
import api from "@/api";

const { t } = useI18n();
const router = useRouter();

const isLoadingProfile = ref(false);
const loadError = ref<string | null>(null);
const profile = ref<UserProperties | null>(null);

const form = reactive<UserProperties>({
  avatar: "",
  realname: "",
  username: "",
  role: "",
  email: "",
  intro: "",
});

async function loadProfile() {
  isLoadingProfile.value = true;
  loadError.value = null;
  try {
    const data = await api.Auth.getProfile();
    profile.value = data;
    Object.assign(form, data);
  } catch (error: any) {
    loadError.value = error?.message || "Failed to load profile";
  } finally {
    isLoadingProfile.value = false;
  }
}

onMounted(loadProfile);

async function saveProfile() {
  try {
    // TODO: 換成真正的更新 API
    await api.Auth.updateProfile?.({
      email: form.email,
      intro: form.intro,
      avatar: form.avatar,
    });
    if (profile.value) Object.assign(profile.value, form);
  } catch (e) {
    console.error(e);
  } finally {
    router.push("/profile"); // 返回原本的 profile page
  }
}

function cancelEdit() {
  if (profile.value) Object.assign(form, profile.value);
  router.push("/profile"); // 返回
}

function onAvatarAction(action: string) {
  if (action === "save") saveProfile();
  else if (action === "cancel") cancelEdit();
}

function onAvatarUpload(file: File) {
  // TODO: 上傳後設定 form.avatar
  console.log("avatar upload:", file);
}
</script>

<template>
  <ProfileLayout leftWidth="420px">
    <!-- 左邊：頭貼 -->
    <template #left>
      <ProfileAvatarBlock :avatar-url="form.avatar" :editable-avatar="true" :buttons="[
        { label: t('profile.save'), variant: 'primary', action: 'save' },
        { label: t('profile.cancel'), variant: 'error', action: 'cancel' },
      ]" @click="onAvatarAction" @upload="onAvatarUpload" />
      <div v-if="loadError" class="mt-2 text-sm text-error">
        {{ loadError }}
      </div>
    </template>

    <!-- 右邊：可編輯資訊 -->
    <template #right>
      <section class="w-full max-w-4xl">
        <div class="grid grid-cols-1 gap-4" :class="{ 'pointer-events-none opacity-50': isLoadingProfile }">
          <ProfileField :label="t('profile.realName')" v-model="form.realname" :editable="false" />
          <ProfileField :label="t('profile.username')" v-model="form.username" :editable="false" />
          <ProfileField :label="t('profile.role')" v-model="form.role" :editable="false" />
          <ProfileField :label="t('profile.email')" v-model="form.email" :editable="true" type="email" />
          <ProfileField :label="t('profile.introduction')" v-model="form.intro" :editable="true" type="textarea" />
        </div>
      </section>
    </template>
  </ProfileLayout>
</template>
