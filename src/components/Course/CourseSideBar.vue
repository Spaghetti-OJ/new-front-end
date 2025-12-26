<script setup lang="ts">
import { UserRole, useSession } from "@/stores/session";
import { useI18n } from "vue-i18n";
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import api from "@/api";

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

const route = useRoute();
const hasAccess = ref(false);

watch(
  () => route.params.courseId,
  async (id) => {
    if (!id) return;
    try {
      await api.Course.info(id as string);
      hasAccess.value = true;
    } catch {
      hasAccess.value = false;
    }
  },
  { immediate: true },
);

const displayedNavs = computed(() => {
  if (hasAccess.value) {
    return navs;
  }
  return navs.filter((n) => ["/problems", "/submissions"].includes(n.path));
});
</script>

<template>
  <!-- 僅在 /courses/[courseId]/... 底下顯示側邊/分頁導覽 -->
  <ul
    v-if="displayType === 'side' && $route.params.courseId"
    class="menu menu-compact w-40 bg-base-100 p-2 lg:menu-normal"
  >
    <li
      v-for="{ name, path } in displayedNavs"
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
      <template v-for="{ name, path } in displayedNavs">
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
