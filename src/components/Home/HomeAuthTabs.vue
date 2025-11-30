<template>
  <div class="card w-full bg-base-100 shadow-xl">
    <div class="card-body">
      <!-- Tabs -->
      <div class="mb-4 flex border-b">
        <button
          class="flex-1 py-2 text-center font-semibold"
          :class="
            activeTab === 'signin'
              ? 'border-b-2 border-blue-600 text-blue-600'
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
              ? 'border-b-2 border-blue-600 text-blue-600'
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

<script setup>
import { ref } from "vue";
import LoginSection from "./LoginSection.vue";
import SignupSection from "./SignupSection.vue";

const activeTab = ref("signin");
</script>
