<script setup lang="ts">
import { useSession } from "@/stores/session";
import { useI18n } from "vue-i18n";

defineProps<{
  displayType?: "side" | "tab";
}>();

const { t } = useI18n();

const session = useSession();
const navs = [
  {
    name: t("components.courseSideBar.ann"),
    path: "/announcements",
  },
  {
    name: t("components.courseSideBar.hw"),
    path: "/homeworks",
  },
  {
    name: t("components.courseSideBar.problems"),
    path: "/problems",
  },
  {
    name: t("components.courseSideBar.submissions"),
    path: "/submissions",
  },
  ...(session.isAdmin || session.role === "teacher"
    ? [
        {
          name: t("components.courseSideBar.members"),
          path: "/members",
        },
      ]
    : []),
];
</script>

<template>
  <!-- 僅在 /courses/[name]/... 底下顯示側邊/分頁導覽 -->
  <ul
    v-if="displayType === 'side' && $route.params.name"
    class="menu menu-compact w-40 bg-base-100 p-2 lg:menu-normal"
  >
    <li
      v-for="{ name, path } in navs"
      :class="[
        {
          'border-l-4 border-blue-500':
            $route.params.name && $route.path === `/courses/${$route.params.name}${path}`,
        },
      ]"
    >
      <router-link :to="`/courses/${$route.params.name}${path}`">{{ name }}</router-link>
    </li>
  </ul>

  <div v-else-if="$route.params.name" class="scrollbar-hide w-full overflow-scroll">
    <div class="tabs mx-auto w-max">
      <template v-for="{ name, path } in navs">
        <a
          class="tab tab-bordered h-10 w-32"
          :class="{
            'tab-active': $route.params.name && $route.path === `/courses/${$route.params.name}${path}`,
          }"
        >
          <router-link :to="`/courses/${$route.params.name}${path}`">{{ name }}</router-link>
        </a>
      </template>
    </div>
  </div>
</template>
