<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { formatTime } from "@/utils/formatTime";
import { useSession, UserRole } from "@/stores/session";
import { useTitle } from "@vueuse/core";
import api from "@/api";

const session = useSession();
const route = useRoute();

useTitle(`Announcements - ${route.params.courseId} | Normal OJ`);
const announcements = ref<AnnouncementList>([]);
const isLoading = ref(true);
const error = ref<any>(null);
onMounted(async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const courseId = route.params.courseId as string;

    const res = await api.Announcement.getAnnouncement(courseId);

    announcements.value = res.data ?? (res as any);
  } catch (e) {
    console.error(e);
    error.value =
      (e as any).response?.data?.detail ||
      (e as any).response?.data?.message ||
      (e as any).message ||
      "Failed to load announcements";
  } finally {
    isLoading.value = false;
  }
});
const rolesCanCreateAnnouncement = [UserRole.Admin, UserRole.Teacher];
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body">
        <div class="card-title justify-between">
          {{ $t("course.ann.index.title") }}
          <router-link v-if="session.hasCourseAccess(route.params.courseId as string)" class="btn btn-success"
            :to="`/courses/${$route.params.courseId}/announcements/new`">
            <i-uil-plus-circle class="mr-1 lg:h-5 lg:w-5" /> {{ $t("course.ann.index.new") }}
          </router-link>
        </div>

        <div class="my-2" />

        <data-status-wrapper :error="error" :is-loading="isLoading">
          <template #loading>
            <skeleton-table :col="3" :row="5" />
          </template>
          <template #data>
            <table class="table w-full">
              <thead>
                <tr>
                  <th>{{ $t("course.ann.index.table.title") }}</th>
                  <th>{{ $t("course.ann.index.table.author") }}</th>
                  <th>{{ $t("course.ann.index.table.time") }}</th>
                  <th v-if="session.isAdmin"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="{ title, creator, createTime, annId } in announcements" :key="annId" class="hover">
                  <td>
                    <router-link :to="`/courses/${$route.params.courseId}/announcements/${annId}`"
                      class="link link-hover">
                      {{ title }}
                    </router-link>
                  </td>
                  <td>{{ creator.username }}</td>
                  <td>{{ formatTime(createTime) }}</td>
                  <td v-if="session.hasCourseAccess(route.params.courseId as string)">
                    <div class="tooltip" data-tip="Edit">
                      <router-link class="btn btn-circle btn-ghost btn-sm"
                        :to="`/courses/${$route.params.courseId}/announcements/${annId}/edit`">
                        <i-uil-edit class="lg:h-5 lg:w-5" />
                      </router-link>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </data-status-wrapper>
      </div>
    </div>
  </div>
</template>
