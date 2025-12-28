<script setup lang="ts">
import { computed, ComputedRef, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import api from "@/api";

// FIXME: this sucks
const { t } = useI18n();
const route = useRoute();
const items: ComputedRef<{ [k: string | symbol]: { path: null | string; text: string }[] }> = computed(() => {
  const announcementsPage = {
    path: `/courses/${route.params.courseId}/announcements`,
    text: t("components.courseSideBar.ann"),
  };
  const homeworksPage = {
    path: `/courses/${route.params.courseId}/homeworks`,
    text: t("components.courseSideBar.hw"),
  };
  const problemsPage = {
    path: `/courses/${route.params.courseId}/problems`,
    text: t("components.courseSideBar.problems"),
  };
  const submissionsPage = {
    path: `/courses/${route.params.courseId}/submissions`,
    text: t("components.courseSideBar.submissions"),
  };
  const membersPage = {
    path: `/courses/${route.params.courseId}/members`,
    text: t("components.courseSideBar.members"),
  };
  const managePage = {
    path: `/courses/${route.params.courseId}/manage`,
    text: t("components.courseSideBar.manage"),
  };

  return {
    "courses-courseId-announcements": [{ path: null, text: t("components.courseSideBar.ann") }],
    "courses-courseId-announcements-new": [announcementsPage, { path: null, text: "New" }],
    "courses-courseId-announcements-id": [announcementsPage, { path: null, text: `${route.params.id}` }],
    "courses-courseId-announcements-id-edit": [
      announcementsPage,
      { path: null, text: `Edit ${route.params.id}` },
    ],
    "courses-courseId-homeworks": [{ path: null, text: t("components.courseSideBar.hw") }],
    "courses-courseId-homeworks-new": [homeworksPage, { path: null, text: "New" }],
    "courses-courseId-homeworks-id-edit": [homeworksPage, { path: null, text: `Edit ${route.params.id}` }],
    "courses-courseId-homeworks-id-stats": [
      homeworksPage,
      { path: null, text: `Stats of ${route.params.id}` },
    ],
    "courses-courseId-problems": [{ path: null, text: t("components.courseSideBar.problems") }],
    "courses-courseId-problems-new": [problemsPage, { path: null, text: "New Problem" }],
    "courses-courseId-problems-id": [problemsPage, { path: null, text: `${route.params.id}` }],
    "courses-courseId-problems-id-edit": [problemsPage, { path: null, text: `Edit ${route.params.id}` }],
    "courses-courseId-problems-id-stats": [
      problemsPage,
      {
        path: `/courses/${route.params.courseId}/problems/${route.params.id}`,
        text: `${route.params.id}`,
      },
      { path: null, text: "Stats" },
    ],
    "courses-courseId-problems-id-submit": [
      problemsPage,
      {
        path: `/courses/${route.params.courseId}/problems/${route.params.id}`,
        text: `${route.params.id}`,
      },
      { path: null, text: "Submit" },
    ],
    "courses-courseId-problems-id-editorial": [
      problemsPage,
      {
        path: `/courses/${route.params.courseId}/problems/${route.params.id}`,
        text: `${route.params.id}`,
      },
      { path: null, text: "Editorial" },
    ],
    "courses-courseId-submissions": [{ path: null, text: t("components.courseSideBar.submissions") }],
    "courses-courseId-submissions-id": [submissionsPage, { path: null, text: `${route.params.id}` }],
    "courses-courseId-members": [{ path: null, text: t("components.courseSideBar.members") }],
    "courses-courseId-manage": [{ path: null, text: t("components.courseSideBar.manage") }],
  };
});

const courseName = ref<string>("");

const courseId = computed(() => {
  const id = route.params.courseId;
  return Array.isArray(id) ? id[0] : id;
});

watch(
  courseId,
  async (newId: string) => {
    if (!newId || newId === "undefined") return;
    try {
      const res = await api.Course.info(newId);
      courseName.value = res.data.course.course;
    } catch (error) {
      if (route.params.id) {
        try {
          const res = await api.Problem.getProblemInfo(Number(route.params.id));
          const pData = res.data ?? (res as any);
          if (pData && pData.courses && Array.isArray(pData.courses)) {
            const found = pData.courses.find((c: any) => String(c.id) === String(newId));
            if (found) {
              courseName.value = found.name;
              return;
            }
          }
        } catch (e) {
          // ignore
        }
      }

      // Fallback 2: Try fetching problem list (old fallback)
      try {
        const { data } = await api.Problem.getProblemList({
          course_id: Number(newId),
          page_size: 1,
        });

        if (data && data.results && data.results.length > 0) {
          courseName.value = data.results[0].course_name;
        }
      } catch (err) {
        console.warn("Failed to fetch course name via fallback:", err);
        courseName.value = "Course";
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="navbar min-h-[2rem] border-b border-gray-600 px-6">
    <div class="breadcrumbs flex-1 text-sm">
      <ul>
        <li>
          <router-link :to="`/courses/${route.params.courseId}`">{{ courseName }}</router-link>
        </li>
        <template v-if="route.name">
          <li v-for="{ path, text } in items[route.name]" :key="text">
            <a v-if="path" :href="path">{{ text }}</a>
            <span v-else>{{ text }}</span>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>
