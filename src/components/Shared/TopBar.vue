<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { useRoute } from "vue-router";
import { useTheme } from "@/stores/theme";
import { useSession } from "@/stores/session";
import { useDark, useToggle, useStorage } from "@vueuse/core";
import { LOCAL_STORAGE_KEY } from "@/constants";
import logo from "@/assets/logo.svg";
import useInteractions from "@/composables/useInteractions";

const { isDesktop } = useInteractions();

const isDark = useDark({
  selector: "html",
  attribute: "data-theme",
  valueDark: "dark",
  valueLight: "light",
});
const toggleDark = useToggle(isDark);

const isMiniSidebarToggled = useStorage(LOCAL_STORAGE_KEY.MINI_SIDEBAR, false);
const isMini = computed(() => isMiniSidebarToggled.value && isDesktop.value);

const theme = useTheme();
watchEffect(() => {
  theme.setIsDark(isDark.value);
});

const route = useRoute();
const matchRoute = (path: string) => route.matched.some((r) => r.path === path);

const session = useSession();

</script>

<template>
  <nav class="navbar bg-primary text-white shadow-md px-6 h-16 flex items-center">
    <!-- 左側：Logo -->
    <div class="flex items-center gap-3">
      <router-link to="/" class="flex items-center gap-2">
        <img :src="logo" alt="NOJ Logo" class="w-8 h-8" />
        <span class="font-bold text-lg">Normal OJ</span>
      </router-link>
    </div>

    <!-- 中間：導航連結 -->
    <div class="flex items-center gap-8 ml-8">
      <router-link :class="['hover:text-accent', matchRoute('/') && 'font-semibold underline']" to="/">
        {{ $t("components.sideBar.home") || 'Home' }}
      </router-link>

      <router-link
        
        :class="['hover:text-accent', matchRoute('/courses') && 'font-semibold underline']"
        to="/courses"
      >
        {{ $t("components.sideBar.course") || 'Course' }}
      </router-link>

      <router-link
        :class="['hover:text-accent', matchRoute('/ranking') && 'font-semibold underline']"
        to="/ranking"
      >
        {{ 'Ranking' }}
      </router-link>

      <router-link
        :class="['hover:text-accent', matchRoute('/problems') && 'font-semibold underline']"
        to="/problems"
      >
        {{'Problems' }}
      </router-link>
    </div>

    <!-- 右側：功能按鈕 -->
    <div class="flex items-center gap-6 ml-auto">
      

      <!-- 設定 -->
      <router-link
        :class="['hover:text-accent flex items-center gap-1', matchRoute('/settings') && 'font-semibold underline']"
        to="/settings"
      >
        <i-uil-setting class="h-5 w-5" />
        <span class="uppercase text-sm hidden sm:inline">Setting</span>
      </router-link>

      

      <!-- Profile -->
      <router-link
        
        :class="['hover:text-accent flex items-center gap-1', matchRoute('/profile') && 'font-semibold underline']"
        to="/profile"
      >
        <i-uil-user class="h-5 w-5" />
        <span class="uppercase text-sm hidden sm:inline">Profile</span>
      </router-link>

      <!-- 關於 -->
      <router-link
        :class="['hover:text-accent flex items-center gap-1', matchRoute('/about') && 'font-semibold underline']"
        to="/about"
      >
        <i-uil-info-circle class="h-5 w-5" />
        <span class="uppercase text-sm hidden sm:inline">About</span>
      </router-link>
      <!-- 夜間模式 -->
      <button class="btn btn-sm btn-ghost text-white" @click="() => toggleDark()">
        <i-uil-sun v-if="isDark" class="h-6 w-6" />
        <i-uil-moon v-else class="h-6 w-6" />
      </button>
    </div>
  </nav>
</template>

<style scoped>
.navbar a {
  transition: color 0.2s, text-decoration 0.2s;
}
</style>