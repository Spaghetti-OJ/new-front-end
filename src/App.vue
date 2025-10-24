<script setup lang="ts">
import { watchEffect } from "vue";
import { useGlobal } from "@/stores/global";
import { TransitionRoot } from "@headlessui/vue";
import { useI18n } from "vue-i18n";
import dayjs from "dayjs";
import TopBar from "@/components/Shared/TopBar.vue";
import SideBar from "@/components/Shared/SideBar.vue";

const global = useGlobal();

const { locale } = useI18n();
watchEffect(() => {
  switch (locale.value) {
    case "chinese":
      dayjs.locale("zh-tw");
      break;
    case "english":
      dayjs.locale("en");
      break;
    case "taiwanese":
      dayjs.locale("zh-tw");
      break;
  }
});
</script>

<template>
  <div class="flex flex-col h-screen w-screen bg-base-100">
    <!--input id="noj-drawer" type="checkbox" class="drawer-toggle" /-->
    
    <top-bar class="sticky top-0 z-50" />
    <main class="flex-1 overflow-y-auto">
      <router-view />
    </main>

    <!--
    <div class="drawer-content">
      <top-bar class="sticky top-0 z-50 lg:hidden" />
      <router-view />
    </div>
    -->

    <!-- UI測試移除 side bar 換成 top bar 效果-->
    <!-- 
    <div class="drawer-side">
      <side-bar />
    </div>
    -->
    

    <TransitionRoot
      :show="global.isServerError"
      as="template"
      enter="duration-300 ease-out"
      enter-from="opacity-0"
      enter-to="opacity-100"
      leave="duration-200 ease-in"
      leave-from="opacity-100"
      leave-to="opacity-0"
    >
      <div class="absolute bottom-8 right-4">
        <div class="alert alert-error shadow-lg">
          <div>
            <i-uil-times-circle />
            <span>Oops! Our server failed to respond. 😢</span>
          </div>
        </div>
      </div>
    </TransitionRoot>
  </div>
</template>
