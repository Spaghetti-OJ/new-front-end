<script setup lang="ts">
import { reactive, ref, onMounted, toRaw } from "vue";
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
const saveError = ref<string | null>(null);
const profile = ref<UserProperties | null>(null);

const form = reactive<UserProperties>({
  avatar: "",
  real_name: "",
  username: "",
  role: "",
  email: "",
  bio: "",
  user_id: "",
  student_id: "",
  email_verified: false,
});

async function loadProfile() {
  isLoadingProfile.value = true;
  loadError.value = null;
  try {
    const data = await api.Auth.getProfile();
    profile.value = data;
    Object.assign(form, data);
    // No manual mapping needed now as properties match
  } catch (error: any) {
    loadError.value = error?.message || "Failed to load profile";
  } finally {
    isLoadingProfile.value = false;
  }
}

onMounted(loadProfile);

const avatarFile = ref<File | null>(null);

function onAvatarUpload(file: File) {
  avatarFile.value = file;
  console.log("avatar upload:", file);
}

async function saveProfile() {
  saveError.value = null;
  try {
    const hasChanges =
      form.email !== profile.value?.email || form.bio !== profile.value?.bio || !!avatarFile.value;

    if (!hasChanges) {
      router.push("/profile");
      return;
    }

    let payload: Partial<UserProperties> | FormData;

    if (avatarFile.value) {
      const formData = new FormData();
      formData.append("email", form.email);
      formData.append("bio", form.bio);
      formData.append("avatar", toRaw(avatarFile.value));
      payload = formData;
    } else {
      payload = {
        email: form.email,
        bio: form.bio,
      };
    }
    await api.Auth.updateProfile(payload);
    avatarFile.value = null;
    if (profile.value) {
      Object.assign(profile.value, form);
    }
    router.push("/profile");
  } catch (e: any) {
    console.error(e);
    if (e.response && e.response.data) {
      const errorDetail = e.response.data.data || e.response.data;
      // Format error details for display
      saveError.value =
        typeof errorDetail === "object" ? Object.values(errorDetail).flat().join(", ") : String(errorDetail);
    } else {
      saveError.value = "Failed to update profile";
    }
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
</script>

<template>
  <ProfileLayout leftWidth="420px">
    <!-- 左邊：頭貼 -->
    <template #left>
      <ProfileAvatarBlock
        :avatar-url="form.avatar"
        :editable-avatar="true"
        :buttons="[
          { label: t('profile.save'), variant: 'primary', action: 'save' },
          { label: t('profile.cancel'), variant: 'error', action: 'cancel' },
        ]"
        @click="onAvatarAction"
        @upload="onAvatarUpload"
      />
      <div v-if="loadError" class="mt-2 text-sm text-error">
        {{ loadError }}
      </div>
      <div v-if="saveError" class="mt-2 text-sm text-error">
        {{ saveError }}
      </div>
    </template>

    <!-- 右邊：可編輯資訊 -->
    <template #right>
      <section class="w-full max-w-4xl">
        <div class="grid grid-cols-1 gap-4" :class="{ 'pointer-events-none opacity-50': isLoadingProfile }">
          <ProfileField :label="t('profile.realName')" v-model="form.real_name" :editable="false" />
          <ProfileField :label="t('profile.username')" v-model="form.username" :editable="false" />
          <ProfileField :label="t('profile.role')" v-model="form.role" :editable="false" />
          <ProfileField :label="t('profile.email')" v-model="form.email" :editable="true" type="email" />
          <ProfileField
            :label="t('profile.introduction')"
            v-model="form.bio"
            :editable="true"
            type="textarea"
          />
        </div>
      </section>
    </template>
  </ProfileLayout>
</template>
