<script setup lang="ts">
import { computed, ComputedRef } from "vue";
import { useRoute } from "vue-router";

// FIXME: this sucks
const route = useRoute();
const announcementsPage = { path: `/courses/${route.params.name}/announcements`, text: "Announcements" };
const homeworksPage = { path: `/courses/${route.params.name}/homeworks`, text: "Homeworks" };
const problemsPage = { path: `/courses/${route.params.name}/problems`, text: "Problems" };
const submissionsPage = { path: `/courses/${route.params.name}/submissions`, text: "Submissions" };
const membersPage = { path: `/courses/${route.params.name}/members`, text: "Members" };
const items: ComputedRef<{ [k: string | symbol]: { path: null | string; text: string }[] }> = computed(
  () => ({
    "courses-name-announcements": [{ path: null, text: "Announcements" }],
    "courses-name-announcements-new": [announcementsPage, { path: null, text: "New" }],
    "courses-name-announcements-id": [announcementsPage, { path: null, text: `${route.params.id}` }],
    "courses-name-announcements-id-edit": [
      announcementsPage,
      { path: null, text: `Edit ${route.params.id}` },
    ],
    "courses-name-homeworks": [{ path: null, text: "Homeworks" }],
    "courses-name-homeworks-new": [homeworksPage, { path: null, text: "New" }],
    "courses-name-homeworks-id-edit": [homeworksPage, { path: null, text: `Edit ${route.params.id}` }],
    "courses-name-homeworks-id-stats": [homeworksPage, { path: null, text: `Stats of ${route.params.id}` }],
    "courses-name-problems": [{ path: null, text: "Problems" }],
    "courses-name-problems-new": [problemsPage, { path: null, text: "New Problem" }],
    "courses-name-problems-id": [problemsPage, { path: null, text: `${route.params.id}` }],
    "courses-name-problems-id-edit": [problemsPage, { path: null, text: `Edit ${route.params.id}` }],
    "courses-name-problems-id-stats": [
      problemsPage,
      {
        path: `/courses/${route.params.name}/problems/${route.params.id}`,
        text: `${route.params.id}`,
      },
      { path: null, text: "Stats" },
    ],
    "courses-name-problems-id-submit": [
      problemsPage,
      {
        path: `/courses/${route.params.name}/problems/${route.params.id}`,
        text: `${route.params.id}`,
      },
      { path: null, text: "Submit" },
    ],
    "courses-name-submissions": [{ path: null, text: "Submissions" }],
    "courses-name-submissions-id": [submissionsPage, { path: null, text: `${route.params.id}` }],
    "courses-name-members": [{ path: null, text: "Members" }],
  }),
);
</script>

<template>
  <div class="navbar min-h-[2rem] border-b border-gray-600 px-6">
    <div class="breadcrumbs flex-1 text-sm">
      <ul>
        <li>
          <router-link :to="`/courses/${route.params.name}`">{{ route.params.name }}</router-link>
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
