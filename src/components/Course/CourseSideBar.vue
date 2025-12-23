<script setup lang="ts">
import { UserRole, useSession } from "@/stores/session";
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

  ...(session.isAdmin || session.role === UserRole.Teacher
    ? [
        {
          name: t("components.courseSideBar.members"),
          path: "/members",
        },
        {
          name: "Manage",
          path: "/manage",
        },
      ]
    : []),
];
</script>

<template>
  <!-- 僅在 /courses/[courseId]/... 底下顯示側邊/分頁導覽 -->
  <ul
    v-if="displayType === 'side' && $route.params.courseId"
    class="menu menu-compact w-40 bg-base-100 p-2 lg:menu-normal"
  >
    <li
      v-for="{ name, path } in navs"
      :class="[
        {
          'border-l-4 border-blue-500':
            $route.params.courseId && $route.path === `/courses/${$route.params.courseId}${path}`,
        },
      ]"
    >
      <router-link :to="`/courses/${$route.params.courseId}${path}`">{{ name }}</router-link>
    </li>
  </ul>

  <div v-else-if="$route.params.courseId" class="scrollbar-hide w-full overflow-scroll">
    <div class="tabs mx-auto w-max">
      <template v-for="{ name, path } in navs">
        <a
          class="tab tab-bordered h-10 w-32"
          :class="{
            'tab-active':
              $route.params.courseId && $route.path === `/courses/${$route.params.courseId}${path}`,
          }"
        >
          <router-link :to="`/courses/${$route.params.courseId}${path}`">{{ name }}</router-link>
        </a>
      </template>
    </div>
  </div>
</template>
