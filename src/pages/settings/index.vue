<script setup lang="ts">
import { watchEffect } from "vue";
import { useStorage } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { useTitle } from "@vueuse/core";
import { LOCAL_STORAGE_KEY } from "@/constants";
import { useSession } from "@/stores/session";
import api from "@/api";
import ChangePasswordForm from "@/components/Settings/ChangePasswordForm.vue";

useTitle("Settings | Normal OJ");

const { t, locale } = useI18n();
const localeInStorage = useStorage(LOCAL_STORAGE_KEY.LOCALE, "english");
const session = useSession();

// sync locale with localStorage
locale.value = localeInStorage.value;
watchEffect(() => {
  localeInStorage.value = locale.value;
});
</script>

<template>
  <div class="mx-auto w-full max-w-4xl space-y-12 p-6">
    <!-- Page Title -->
    <h1 class="text-3xl font-bold">{{ $t("settings.title") }}</h1>

    <template v-if="session.isLogin">
      <!-- Change Password Section -->
      <section>
        <ChangePasswordForm />
      </section>

      <!-- API Keys -->
      <section>
        <h2 class="mb-4 text-2xl font-semibold">{{ $t("api_key.title") }}</h2>

        <router-link to="/settings/api-keys" class="btn btn-primary w-full max-w-md">
          {{ $t("api_key.description") }}
        </router-link>
      </section>
    </template>

    <!-- Language Selector (always visible) -->
    <section class="pb-24">
      <h2 class="mb-4 text-2xl font-semibold">{{ $t("settings.selectLang") }}</h2>

      <div class="form-control w-full max-w-xs">
        <select v-model="locale" class="select select-bordered">
          <option value="english">English</option>
          <option value="chinese">繁體中文</option>
        </select>
      </div>
    </section>
  </div>
</template>
