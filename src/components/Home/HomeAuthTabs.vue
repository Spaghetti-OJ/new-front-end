<script setup lang="ts">
import { ref } from "vue";
import { useSession } from "@/stores/session";
import LoginSection from "./LoginSection.vue";
import SignupSection from "./SignupSection.vue";

const activeTab = ref("signin");
const session = useSession();
</script>

<template>
  <div class="card w-full min-w-[24rem] bg-base-100">
    <div class="card-body">
      <!-- Tabs -->
      <div v-if="!session.isLogin" class="mb-4 flex border-b">
        <button
          class="flex-1 py-2 text-center font-semibold"
          :class="
            activeTab === 'signin'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 dark:text-gray-400'
          "
          @click="activeTab = 'signin'"
        >
          Sign In
        </button>

        <button
          class="flex-1 py-2 text-center font-semibold"
          :class="
            activeTab === 'signup'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 dark:text-gray-400'
          "
          @click="activeTab = 'signup'"
        >
          Sign Up
        </button>
      </div>

      <LoginSection v-if="activeTab === 'signin'" />
      <SignupSection v-else />
    </div>
  </div>
</template>
