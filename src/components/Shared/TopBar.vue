<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTheme } from "@/stores/theme";
import { useSession } from "@/stores/session";
import { useDark, useToggle, useStorage } from "@vueuse/core";
import { onClickOutside } from "@vueuse/core";
import api from "@/api";
import logo from "@/assets/logo.svg";

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
const handleLogout = async () => {
  try {
    await api.Auth.logout({ refresh: session.refreshtoken });
    session.logoutLocally();
    router.push("/login");
  } catch (error) {
    session.logoutLocally();
    router.push("/login");
  }
};

// Mobile menu state
const isMobileMenuOpen = ref(false);
const mobileMenuRef = ref<HTMLElement | null>(null);
const mobileMenuButtonRef = ref<HTMLElement | null>(null);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

// Close mobile menu when clicking outside
onClickOutside(mobileMenuRef, closeMobileMenu, {
  ignore: [mobileMenuButtonRef],
});
</script>

<template>
  <nav class="navbar relative flex h-16 items-center bg-primary px-4 text-white shadow-md md:px-6">
    <!-- 左側：Logo -->
    <div class="flex items-center gap-3">
      <router-link to="/" class="flex items-center gap-2">
        <img :src="logo" alt="NOJ Logo" class="h-8 w-8" />
      </router-link>
    </div>

    <!-- 中間：桌面版導航連結 (隱藏在 md 以下) -->
    <div class="ml-8 hidden items-center gap-6 md:flex md:gap-8">
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
    <div class="ml-auto flex items-center gap-3 md:gap-6">
      <!-- 桌面版功能按鈕 (隱藏在 md 以下) -->
      <div class="hidden items-center gap-4 md:flex md:gap-6">
        <!-- 設定 -->
        <router-link
          :class="[
            'flex items-center gap-1 hover:text-accent',
            matchRoute('/settings') && 'font-semibold underline',
          ]"
          to="/settings"
        >
          <i-uil-setting class="h-5 w-5" />
          <span class="hidden text-sm uppercase lg:inline">
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
          <span class="hidden text-sm uppercase lg:inline">
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
          <span class="hidden text-sm uppercase lg:inline">
            {{ $t("components.topBar.about") || "About" }}
          </span>
        </router-link>

        <!-- Logout -->
        <button
          v-if="session.isLogin"
          class="btn btn-ghost btn-sm text-sm uppercase text-white hover:bg-transparent hover:text-accent"
          @click="handleLogout"
        >
          {{ $t("components.topBar.logout") || "Logout" }}
        </button>
      </div>

      <!-- 夜間模式切換 (所有螢幕都顯示) -->
      <button
        class="btn btn-ghost btn-sm text-white"
        @click="() => toggleDark()"
        aria-label="Toggle dark mode"
      >
        <i-uil-sun v-if="isDark" class="h-6 w-6" />
        <i-uil-moon v-else class="h-6 w-6" />
      </button>

      <!-- 漢堡選單按鈕 (只在 md 以下顯示) -->
      <button
        ref="mobileMenuButtonRef"
        class="btn btn-ghost btn-sm text-white md:hidden"
        @click="toggleMobileMenu"
        aria-label="Toggle menu"
      >
        <i-uil-bars v-if="!isMobileMenuOpen" class="h-6 w-6" />
        <i-uil-times v-else class="h-6 w-6" />
      </button>
    </div>

    <!-- 手機版下拉選單 -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="isMobileMenuOpen"
        ref="mobileMenuRef"
        class="absolute left-0 right-0 top-16 z-50 bg-primary shadow-lg md:hidden"
      >
        <div class="flex flex-col space-y-1 px-4 py-4">
          <!-- 主要導航 -->
          <router-link
            :class="[
              'rounded-lg px-4 py-3 hover:bg-primary-focus',
              matchRoute('/') && 'bg-primary-focus font-semibold',
            ]"
            to="/"
            @click="closeMobileMenu"
          >
            <div class="flex items-center gap-3">
              <i-uil-home class="h-5 w-5" />
              <span>{{ $t("components.topBar.home") || "Home" }}</span>
            </div>
          </router-link>

          <router-link
            v-if="session.isLogin"
            :class="[
              'rounded-lg px-4 py-3 hover:bg-primary-focus',
              matchRoute('/courses') && 'bg-primary-focus font-semibold',
            ]"
            to="/courses"
            @click="closeMobileMenu"
          >
            <div class="flex items-center gap-3">
              <i-uil-book-alt class="h-5 w-5" />
              <span>{{ $t("components.topBar.course") || "Course" }}</span>
            </div>
          </router-link>

          <router-link
            v-if="session.isLogin"
            :class="[
              'rounded-lg px-4 py-3 hover:bg-primary-focus',
              matchRoute('/ranking') && 'bg-primary-focus font-semibold',
            ]"
            to="/ranking"
            @click="closeMobileMenu"
          >
            <div class="flex items-center gap-3">
              <i-uil-trophy class="h-5 w-5" />
              <span>{{ $t("components.topBar.ranking") || "Ranking" }}</span>
            </div>
          </router-link>

          <router-link
            v-if="session.isLogin"
            :class="[
              'rounded-lg px-4 py-3 hover:bg-primary-focus',
              matchRoute('/problems') && 'bg-primary-focus font-semibold',
            ]"
            to="/problems"
            @click="closeMobileMenu"
          >
            <div class="flex items-center gap-3">
              <i-uil-file-alt class="h-5 w-5" />
              <span>{{ $t("components.topBar.problems") || "Problems" }}</span>
            </div>
          </router-link>

          <!-- 分隔線 -->
          <div class="my-2 border-t border-white/20"></div>

          <!-- 次要導航 -->
          <router-link
            :class="[
              'rounded-lg px-4 py-3 hover:bg-primary-focus',
              matchRoute('/settings') && 'bg-primary-focus font-semibold',
            ]"
            to="/settings"
            @click="closeMobileMenu"
          >
            <div class="flex items-center gap-3">
              <i-uil-setting class="h-5 w-5" />
              <span>{{ $t("components.topBar.settings") || "Settings" }}</span>
            </div>
          </router-link>

          <router-link
            v-if="session.isLogin"
            :class="[
              'rounded-lg px-4 py-3 hover:bg-primary-focus',
              matchRoute('/profile') && 'bg-primary-focus font-semibold',
            ]"
            to="/profile"
            @click="closeMobileMenu"
          >
            <div class="flex items-center gap-3">
              <i-uil-user class="h-5 w-5" />
              <span>{{ $t("components.topBar.profile") || "Profile" }}</span>
            </div>
          </router-link>

          <router-link
            :class="[
              'rounded-lg px-4 py-3 hover:bg-primary-focus',
              matchRoute('/about') && 'bg-primary-focus font-semibold',
            ]"
            to="/about"
            @click="closeMobileMenu"
          >
            <div class="flex items-center gap-3">
              <i-uil-info-circle class="h-5 w-5" />
              <span>{{ $t("components.topBar.about") || "About" }}</span>
            </div>
          </router-link>

          <!-- Logout -->
          <button
            v-if="session.isLogin"
            class="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left hover:bg-primary-focus"
            @click="
              handleLogout();
              closeMobileMenu();
            "
          >
            <i-uil-sign-out-alt class="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </transition>
  </nav>
</template>

<style scoped>
.navbar a {
  transition: color 0.2s, text-decoration 0.2s;
}

/* 手機選單項目的 hover 效果 */
.navbar a:hover,
.navbar button:hover {
  transition: background-color 0.2s ease;
}
</style>
