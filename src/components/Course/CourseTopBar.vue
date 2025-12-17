<script setup lang="ts">
import { computed, ComputedRef, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import api from "@/api";

// FIXME: this sucks
const route = useRoute();
const announcementsPage = { path: `/courses/${route.params.courseId}/announcements`, text: "Announcements" };
const homeworksPage = { path: `/courses/${route.params.courseId}/homeworks`, text: "Homeworks" };
const problemsPage = { path: `/courses/${route.params.courseId}/problems`, text: "Problems" };
const submissionsPage = { path: `/courses/${route.params.courseId}/submissions`, text: "Submissions" };
const membersPage = { path: `/courses/${route.params.courseId}/members`, text: "Members" };
const items: ComputedRef<{ [k: string | symbol]: { path: null | string; text: string }[] }> = computed(
  () => ({
    "courses-courseId-announcements": [{ path: null, text: "Announcements" }],
    "courses-courseId-announcements-new": [announcementsPage, { path: null, text: "New" }],
    "courses-courseId-announcements-id": [announcementsPage, { path: null, text: `${route.params.id}` }],
    "courses-courseId-announcements-id-edit": [
      announcementsPage,
      { path: null, text: `Edit ${route.params.id}` },
    ],
    "courses-courseId-homeworks": [{ path: null, text: "Homeworks" }],
    "courses-courseId-homeworks-new": [homeworksPage, { path: null, text: "New" }],
    "courses-courseId-homeworks-id-edit": [homeworksPage, { path: null, text: `Edit ${route.params.id}` }],
    "courses-courseId-homeworks-id-stats": [
      homeworksPage,
      { path: null, text: `Stats of ${route.params.id}` },
    ],
    "courses-courseId-problems": [{ path: null, text: "Problems" }],
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
    "courses-courseId-submissions": [{ path: null, text: "Submissions" }],
    "courses-courseId-submissions-id": [submissionsPage, { path: null, text: `${route.params.id}` }],
    "courses-courseId-members": [{ path: null, text: "Members" }],
  }),
);

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
      console.error("Failed to fetch course info:", error);
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
