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
const route = useRoute();
const isMember = ref(false);

const baseNavs = [
  { name: t("components.courseSideBar.ann"), path: "/announcements" },
  { name: t("components.courseSideBar.hw"), path: "/homeworks" },
  { name: t("components.courseSideBar.problems"), path: "/problems" },
  { name: t("components.courseSideBar.submissions"), path: "/submissions" },
];

watch(
  () => route.params.courseId,
  async (id) => {
    isMember.value = false;
    if (!id) return;

    // 1. Staff override
    if (session.hasCourseAccess(id as string)) {
      isMember.value = true;
      return;
    }

    // 2. Fetch course info to check student membership
    try {
      const res = await api.Course.info(id as string);
      const students = res.data.students || [];
      // Flexible check for userid/user_id
      const me = session.user_id;
      isMember.value = students.some(
        (s: any) =>
          String(s.userid) === String(me) ||
          String(s.user_id) === String(me) ||
          s.username === session.username,
      );
    } catch {
      isMember.value = false;
    }
  },
  { immediate: true },
);

const displayedNavs = computed(() => {
  let navs = [...baseNavs];

  if (!isMember.value) {
    // If not member (student or staff), filter out sensitive tabs
    navs = navs.filter((n) => ["/problems", "/submissions"].includes(n.path));
  }

  // Add staff-only links
  if (session.hasCourseAccess(route.params.courseId as string)) {
    navs.push(
      { name: t("components.courseSideBar.members"), path: "/members" },
      { name: "Manage", path: "/manage" },
    );
  }

  return navs;
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
