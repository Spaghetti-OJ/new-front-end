<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useSession } from "@/stores/session";
import LoginSection from "./LoginSection.vue";
import SignupSection from "./SignupSection.vue";

const activeTab = ref("signin");
const session = useSession();

// Refs for tab buttons
const tabRefs = {
  signin: ref(null),
  signup: ref(null),
};

// List of tab keys for navigation
const tabKeys = ["signin", "signup"];

// Handle keyboard navigation for tabs
function onTabKeydown(event, currentTab) {
  const idx = tabKeys.indexOf(currentTab);
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    event.preventDefault();
    const nextIdx = (idx + 1) % tabKeys.length;
    activeTab.value = tabKeys[nextIdx];
    tabRefs[tabKeys[nextIdx]].value.focus();
  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    event.preventDefault();
    const prevIdx = (idx - 1 + tabKeys.length) % tabKeys.length;
    activeTab.value = tabKeys[prevIdx];
    tabRefs[tabKeys[prevIdx]].value.focus();
  }
}
</script>

<template>
  <div class="card w-full min-w-[24rem] bg-base-100">
    <div class="card-body">
      <!-- Tabs -->
      <div
        v-if="!session.isLogin"
        class="mb-4 flex border-b"
        role="tablist"
        aria-label="Authentication Tabs"
      >
        <button
          ref="tabRefs.signin"
          class="flex-1 py-2 text-center font-semibold"
          :class="
            activeTab === 'signin'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 dark:text-gray-400'
          "
          role="tab"
          :aria-selected="activeTab === 'signin'"
          :tabindex="activeTab === 'signin' ? 0 : -1"
          @click="activeTab = 'signin'"
          @keydown="onTabKeydown($event, 'signin')"
        >
          Sign In
        </button>

        <button
          ref="tabRefs.signup"
          class="flex-1 py-2 text-center font-semibold"
          :class="
            activeTab === 'signup'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 dark:text-gray-400'
          "
          role="tab"
          :aria-selected="activeTab === 'signup'"
          :tabindex="activeTab === 'signup' ? 0 : -1"
          @click="activeTab = 'signup'"
          @keydown="onTabKeydown($event, 'signup')"
        >
          Sign Up
        </button>
      </div>

      <LoginSection v-if="activeTab === 'signin'" />
      <SignupSection v-else />
    </div>
  </div>
</template>
