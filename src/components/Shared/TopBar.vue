<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTheme } from "@/stores/theme";
import { useSession } from "@/stores/session";
import { useDark, useToggle, useStorage } from "@vueuse/core";
import useInteractions from "@/composables/useInteractions";
import logo from "@/assets/logo.svg";

const { isDesktop } = useInteractions();

const isDark = useDark({
  selector: "html",
  attribute: "data-theme",
  valueDark: "dark",
  valueLight: "light",
});
const toggleDark = useToggle(isDark);

const theme = useTheme();
watchEffect(() => {
  theme.setIsDark(isDark.value);
});

const route = useRoute();
const matchRoute = (path: string) => route.matched.some((r) => r.path === path);

const session = useSession();

const router = useRouter();
const handleLogout = () => {
  session.logoutLocally();
  router.push("/login");
};
</script>

<template>
  <nav class="navbar flex h-16 items-center bg-primary px-6 text-white shadow-md">
    <!-- 左側：Logo -->
    <div class="flex items-center gap-3">
      <router-link to="/" class="flex items-center gap-2">
        <img :src="logo" alt="NOJ Logo" class="h-8 w-8" />
      </router-link>
    </div>

    <!-- 中間：導航連結 -->
    <div class="ml-8 flex items-center gap-8">
      <router-link :class="['hover:text-accent', matchRoute('/') && 'font-semibold underline']" to="/">
        {{ $t("components.topBar.home") || "Home" }}
      </router-link>

      <router-link
        v-if="session.isLogin"
        :class="['hover:text-accent', matchRoute('/courses') && 'font-semibold underline']"
        to="/courses"
      >
        {{ $t("components.topBar.course") || "Course" }}
      </router-link>

      <router-link
        v-if="session.isLogin"
        :class="['hover:text-accent', matchRoute('/ranking') && 'font-semibold underline']"
        to="/ranking"
      >
        {{ $t("components.topBar.ranking") || "Ranking" }}
      </router-link>

      <router-link
        v-if="session.isLogin"
        :class="['hover:text-accent', matchRoute('/problems') && 'font-semibold underline']"
        to="/problems"
      >
        {{ $t("components.topBar.problems") || "Problems" }}
      </router-link>
    </div>

    <!-- 右側：功能按鈕 -->
    <div class="ml-auto flex items-center gap-6">
      <!-- 設定 -->
      <router-link
        :class="[
          'flex items-center gap-1 hover:text-accent',
          matchRoute('/settings') && 'font-semibold underline',
        ]"
        to="/settings"
      >
        <i-uil-setting class="h-5 w-5" />
        <span class="hidden text-sm uppercase sm:inline">
          {{ $t("components.topBar.settings") || "Settings" }}
        </span>
      </router-link>

      <!-- Profile -->
      <router-link
        v-if="session.isLogin"
        :class="[
          'flex items-center gap-1 hover:text-accent',
          matchRoute('/profile') && 'font-semibold underline',
        ]"
        to="/profile"
      >
        <i-uil-user class="h-5 w-5" />
        <span class="hidden text-sm uppercase sm:inline">
          {{ $t("components.topBar.profile") || "Profile" }}
        </span>
      </router-link>

      <!-- 關於 -->
      <router-link
        :class="[
          'flex items-center gap-1 hover:text-accent',
          matchRoute('/about') && 'font-semibold underline',
        ]"
        to="/about"
      >
        <i-uil-info-circle class="h-5 w-5" />
        <span class="hidden text-sm uppercase sm:inline">
          {{ $t("components.topBar.about") || "About" }}
        </span>
      </router-link>
      <!-- 夜間模式 -->
      <button class="btn btn-ghost btn-sm text-white" @click="() => toggleDark()">
        <i-uil-sun v-if="isDark" class="h-6 w-6" />
        <i-uil-moon v-else class="h-6 w-6" />
      </button>

      <button
        v-if="session.isLogin"
        class="btn btn-ghost btn-sm hidden text-sm uppercase text-white hover:bg-transparent hover:text-accent sm:inline"
        @click="handleLogout"
      >
        Logout
      </button>
    </div>
  </nav>
</template>

<style scoped>
.navbar a {
  transition: color 0.2s, text-decoration 0.2s;
}
</style>
