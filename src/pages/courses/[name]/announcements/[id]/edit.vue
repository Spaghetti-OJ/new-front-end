<script setup lang="ts">
import dayjs from "dayjs";
import { ref, computed, onMounted } from "vue";
import { useTitle } from "@vueuse/core";
import { useRoute, useRouter } from "vue-router";
import api, { fetcher } from "@/api";
import axios from "axios";
import AnnouncementForm from "@/components/Announcement/AnnouncementForm.vue";

const route = useRoute();
const router = useRouter();

useTitle(`Edit Announcement - ${route.params.id} - ${route.params.name} | Normal OJ`);

const formElement = ref<InstanceType<typeof AnnouncementForm>>();

const announcement = ref<Announcement | null>(null);
const edittingAnnouncement = ref<AnnouncementForm | null>(null);

// 載入狀態 & 錯誤（給 data-status-wrapper 用）
const isFetching = ref(true);
const fetchError = ref<unknown | null>(null);

// 進頁面時先把公告詳情抓回來：GET /ann/<course_id>/<ann_id>
onMounted(async () => {
  isFetching.value = true;
  fetchError.value = null;

  try {
    const courseId = route.params.name as string;
    const annId = route.params.id as string;

    const first = await api.Announcement.getOne(courseId, annId);
    console.log(first);
    //const first = (res.data ?? (res as any))[0] as Announcement | undefined;

    if (first) {
      announcement.value = first.data[0];
      // 編輯表單內容一開始用現有公告資料填入
      edittingAnnouncement.value = {
        annId: first.data[0].annId,
        title: first.data[0].title,
        markdown: first.data[0].markdown,
        pinned: first.data[0].pinned,
      } as AnnouncementForm;
    }
  } catch (e) {
    console.error("[FETCH announcement error]", e);
    fetchError.value = e;
  } finally {
    isFetching.value = false;
  }
});

function update<K extends keyof AnnouncementForm>(key: K, value: AnnouncementForm[K]) {
  if (!edittingAnnouncement.value) return;
  edittingAnnouncement.value[key] = value;
}

const openPreview = ref<boolean>(false);
const previewPostMockMeta = computed(() => ({
  creator: announcement.value?.creator || { username: "Ijichi Nijika" },
  createTime: announcement.value?.createTime || dayjs().unix(),
  updateTime: announcement.value?.updateTime || dayjs().unix(),
}));

// 送出：PUT /ann/
async function submit() {
  if (!edittingAnnouncement.value || !formElement.value) return;

  const form = edittingAnnouncement.value;

  formElement.value.isLoading = true;
  formElement.value.errorMsg = "";

  try {
    const body = {
      annId: Number(form.annId ?? route.params.id), // 確保是 number
      title: form.title,
      // 後端文件用 context（Markdown，可改用 content），我們用 context 對齊文件
      context: form.markdown,
      is_pinned: form.pinned,
    };

    await api.Announcement.modify(body);

    router.push(`/courses/${route.params.name}/announcements/${route.params.id}`);
  } catch (error) {
    console.error("[UPDATE announcement error]", error);
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      formElement.value.errorMsg = error.response.data.message;
    } else {
      formElement.value.errorMsg = "Unknown error occurred :(";
    }
    throw error;
  } finally {
    formElement.value.isLoading = false;
  }
}

// 刪除：DELETE /ann/
async function delete_() {
  if (!formElement.value) return;
  if (!confirm("Are u sure?")) return;

  formElement.value.isLoading = true;
  formElement.value.errorMsg = "";

  try {
    await api.Announcement.delete({ annId: Number(route.params.id) });
    router.push(`/courses/${route.params.name}/announcements`);
  } catch (error) {
    console.error("[DELETE announcement error]", error);
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      formElement.value.errorMsg = error.response.data.message;
    } else {
      formElement.value.errorMsg = "Unknown error occurred :(";
    }
    throw error;
  } finally {
    formElement.value.isLoading = false;
  }
}

function discard() {
  if (!confirm("Are u sure?")) return;
  router.push(`/courses/${route.params.name}/announcements`);
}
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body">
        <div class="card-title mb-3 flex-wrap justify-between lg:flex-nowrap">
          Edit Announcement
          <div class="flex gap-x-3">
            <button
              :class="['btn btn-outline btn-error btn-sm lg:btn-md', formElement?.isLoading && 'loading']"
              @click="delete_"
            >
              <i-uil-trash-alt class="mr-1 lg:h-5 lg:w-5" /> Delete
            </button>
            <button
              :class="['btn btn-warning btn-sm lg:btn-md', formElement?.isLoading && 'loading']"
              @click="discard"
            >
              <i-uil-times-circle class="mr-1 lg:h-5 lg:w-5" /> Discard Changes
            </button>
          </div>
        </div>

        <data-status-wrapper :error="fetchError" :is-loading="isFetching">
          <template #loading>
            <skeleton-card />
          </template>
          <template #data>
            <template v-if="edittingAnnouncement">
              <announcement-form
                :value="edittingAnnouncement"
                ref="formElement"
                @update="update"
                @submit="submit"
              />

              <div class="divider" />

              <div class="card-title mb-3">
                Preview
                <input v-model="openPreview" type="checkbox" class="toggle" />
              </div>

              <announcement-card
                v-show="openPreview"
                :announcement="{ ...previewPostMockMeta, ...edittingAnnouncement }"
                class="rounded border-2 border-slate-300"
              />
            </template>
          </template>
        </data-status-wrapper>
      </div>
    </div>
  </div>
</template>
