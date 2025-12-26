<script setup lang="ts">
import dayjs from "dayjs";
import { ref, reactive, computed } from "vue";
import { useTitle } from "@vueuse/core";
import { useRoute, useRouter } from "vue-router";
import api from "@/api";
import axios from "axios";
import AnnouncementForm from "@/components/Announcement/AnnouncementForm.vue";
import { useSession } from "@/stores/session";

const route = useRoute();
const router = useRouter();
useTitle(`New Announcement - ${route.params.courseId} | Normal OJ`);

const session = useSession();
const formElement = ref<InstanceType<typeof AnnouncementForm>>();

const newAnnouncement = reactive<AnnouncementForm>({
  title: "",
  markdown: `_Markdown_ & $\\text{katex}$ are supported.\n![](https://64.media.tumblr.com/2e2d5f1e4f0667c181c3afa9ef8cca1b/tumblr_mu4kbwQ0eY1qki7dgo1_500.gifv)`,
  pinned: false,
});

function update<K extends keyof AnnouncementForm>(key: K, value: AnnouncementForm[K]) {
  newAnnouncement[key] = value;
}

const openPreview = ref<boolean>(false);
const mockAnnouncementMeta = computed(() => ({
  creator: { username: session.username || "Ijichi Nijika" },
  createTime: dayjs().unix(),
  updateTime: dayjs().unix(),
}));

async function submit() {
  if (!formElement.value) return;

  formElement.value.isLoading = true;
  try {
    const body = {
      title: newAnnouncement.title,
      content: newAnnouncement.markdown,
      is_pinned: newAnnouncement.pinned,
      course_id: Number(route.params.courseId),
    };
    const { annId } = (await api.Announcement.create(body)).data;

    router.push(`/courses/${route.params.courseId}/announcements/${annId}`);
  } catch (error) {
    formElement.value.errorMsg =
      (error as any).response?.data?.detail ||
      (error as any).response?.data?.message ||
      (error as any).message ||
      "Unknown error occurred :(";
    throw error;
  } finally {
    formElement.value.isLoading = false;
  }
}
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body">
        <div class="card-title mb-3">{{ $t("course.ann.new.title") }}</div>

        <announcement-form :value="newAnnouncement" ref="formElement" @update="update" @submit="submit" />

        <div class="divider" />

        <div class="card-title mb-3">
          {{ $t("course.ann.new.preview") }}
          <input v-model="openPreview" type="checkbox" class="toggle" />
        </div>

        <announcement-card
          v-show="openPreview"
          :announcement="{ ...mockAnnouncementMeta, ...newAnnouncement }"
          class="rounded border-2 border-slate-300"
        />
      </div>
    </div>
  </div>
</template>
