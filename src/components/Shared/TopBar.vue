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
  <nav class="navbar bg-primary text-white shadow-md px-6">
    <!-- Left: Logo -->
    <div class="flex items-center gap-2">
      <router-link to="/">
        <img :src="logo" alt="NOJ Logo" class="w-8 h-8" />
      </router-link>
      <span class="font-bold text-lg">Normal OJ</span>
    </div>

    <!-- Middle: Home -->
    <div class="ml-6">
      <router-link
        :class="['hover:text-accent', matchRoute('/') && 'font-semibold underline']"
        to="/"
      >
        Home
      </router-link>
    </div>

    <!-- Right: Other links -->
    <div class="flex items-center gap-6 ml-auto">
      <router-link
        :class="['hover:text-accent', matchRoute('/about') && 'font-semibold underline']"
        to="/about"
      >
        About
      </router-link>

      <router-link
        :class="['hover:text-accent', matchRoute('/settings') && 'font-semibold underline']"
        to="/settings"
      >
        Settings
      </router-link>

      <button class="btn btn-sm btn-ghost text-white" @click="toggleDark()">
        <i-uil-sun v-if="isDark" class="h-6 w-6" />
        <i-uil-moon v-else class="h-6 w-6" />
      </button>
    </div>
  </nav>
</template>