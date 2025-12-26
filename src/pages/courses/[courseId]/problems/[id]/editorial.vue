<script setup lang="ts">
import { ref, computed, reactive, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useTitle } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { fetcher } from "@/api";
import { useSession } from "@/stores/session";

const route = useRoute();
const { t } = useI18n();
const session = useSession();

useTitle(`Editorial - ${route.params.id} - ${route.params.courseId} | Normal OJ`);

const editorials = ref<Editorial[]>([]);
const selectedId = ref<string | null>(null);
const error = ref<string | null>(null);
const isLoading = ref(false);
const isEditing = ref(false);
const isCreating = ref(false);
const formError = ref<string | null>(null);

const draft = reactive({
  title: "",
  content: "",
  difficulty_rating: "",
  is_official: false,
});

const canEdit = computed(() => session.isAdmin || session.isTeacher);

const selectedEditorial = computed(() => {
  if (!selectedId.value) return null;
  return editorials.value.find((item) => item.id === selectedId.value) || null;
});

async function fetchEditorials() {
  isLoading.value = true;
  error.value = null;
  try {
    const res = await fetcher.get<Editorial[]>(`/editorials/problem/${route.params.id}/solution/`);
    const list = Array.isArray(res.data) ? res.data : Array.isArray(res) ? (res as Editorial[]) : [];
    editorials.value = list;
    if (!selectedId.value && list.length > 0) {
      selectedId.value = list[0].id;
    }
  } catch (err: any) {
    error.value =
      err?.response?.data?.error ||
      err?.response?.data?.detail ||
      err?.message ||
      "Failed to load editorials.";
  } finally {
    isLoading.value = false;
  }
}

const startEdit = () => {
  if (!selectedEditorial.value) return;
  draft.title = selectedEditorial.value.title;
  draft.content = selectedEditorial.value.content;
  draft.difficulty_rating =
    selectedEditorial.value.difficulty_rating != null
      ? String(selectedEditorial.value.difficulty_rating)
      : "";
  draft.is_official = selectedEditorial.value.is_official;
  isCreating.value = false;
  isEditing.value = true;
  formError.value = null;
};

const startCreate = () => {
  draft.title = "";
  draft.content = "";
  draft.difficulty_rating = "";
  draft.is_official = false;
  isCreating.value = true;
  isEditing.value = true;
  formError.value = null;
};

const cancelEdit = () => {
  isEditing.value = false;
  isCreating.value = false;
  formError.value = null;
};

const saveEditorial = async () => {
  if (!draft.title.trim() || !draft.content.trim()) {
    formError.value = "Title and content are required.";
    return;
  }

  const payload = {
    title: draft.title.trim(),
    content: draft.content,
    difficulty_rating: draft.difficulty_rating ? Number(draft.difficulty_rating) : undefined,
    is_official: draft.is_official,
  };

  try {
    formError.value = null;
    if (isCreating.value) {
      const res = await fetcher.post<Editorial>(`/editorials/problem/${route.params.id}/solution/`, payload);
      const created = res.data ?? res;
      await fetchEditorials();
      if (created?.id) {
        selectedId.value = created.id;
      }
    } else if (selectedEditorial.value) {
      const res = await fetcher.put<Editorial>(
        `/editorials/problem/${route.params.id}/solution/${selectedEditorial.value.id}/`,
        payload,
      );
      const updated = res.data ?? res;
      await fetchEditorials();
      if (updated?.id) {
        selectedId.value = updated.id;
      }
    }
    isEditing.value = false;
    isCreating.value = false;
  } catch (err: any) {
    formError.value =
      err?.response?.data?.error ||
      err?.response?.data?.detail ||
      err?.message ||
      "Failed to save editorial.";
  }
};

const deleteEditorial = async () => {
  if (!selectedEditorial.value) return;
  if (!window.confirm("Delete this editorial?")) return;
  try {
    await fetcher.delete(`/editorials/problem/${route.params.id}/solution/${selectedEditorial.value.id}/`);
    selectedId.value = null;
    await fetchEditorials();
  } catch (err: any) {
    error.value =
      err?.response?.data?.error ||
      err?.response?.data?.detail ||
      err?.message ||
      "Failed to delete editorial.";
  }
};

const editorialContent = computed(
  () => selectedEditorial.value?.content || "There isn't any editorial for this problem.",
);

onMounted(fetchEditorials);
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body">
        <!-- 上方：標題 + 愛心 -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="card-title md:text-2xl lg:text-3xl">Editorial for Problem #{{ $route.params.id }}</div>

          <div class="flex flex-wrap items-center gap-2">
            <select
              v-if="editorials.length > 1"
              v-model="selectedId"
              class="select select-bordered select-sm"
            >
              <option v-for="item in editorials" :key="item.id" :value="item.id">
                {{ item.is_official ? "⭐ " : "" }}{{ item.title }}
              </option>
            </select>

            <button v-if="canEdit" type="button" class="btn btn-success" @click="startCreate">
              <i-uil-plus class="mr-1 h-5 w-5" /> New Editorial
            </button>
            <button
              v-if="canEdit && selectedEditorial && !isEditing"
              type="button"
              class="btn btn-outline"
              @click="startEdit"
            >
              <i-uil-edit class="mr-1 h-5 w-5" /> Edit
            </button>
            <button
              v-if="canEdit && selectedEditorial && !isEditing"
              type="button"
              class="btn btn-ghost text-error"
              @click="deleteEditorial"
            >
              <i-uil-trash-alt class="mr-1 h-5 w-5" /> Delete
            </button>
          </div>
        </div>

        <!-- 內容: Editorial -->
        <div class="mt-6">
          <template v-if="isLoading">
            <div class="flex justify-center py-10">
              <ui-spinner class="h-10 w-10" />
            </div>
          </template>

          <template v-else-if="error">
            <div class="alert alert-error mt-4 shadow-lg">
              <div>
                <i-uil-times-circle />
                <span>{{ t("course.problem.solution.err.load") }}</span>
              </div>
            </div>
          </template>

          <template v-else>
            <div v-if="isEditing">
              <div class="space-y-4">
                <input
                  v-model="draft.title"
                  class="input input-bordered w-full"
                  placeholder="Editorial title"
                />
                <textarea
                  v-model="draft.content"
                  class="textarea textarea-bordered min-h-[300px] w-full"
                  placeholder="Write editorial content..."
                />
                <div class="flex flex-wrap items-center gap-4">
                  <label class="flex items-center gap-2 text-sm">
                    <input v-model="draft.is_official" type="checkbox" class="checkbox checkbox-sm" />
                    Official
                  </label>
                  <input
                    v-model="draft.difficulty_rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    class="input input-bordered input-sm w-32"
                    placeholder="Rating"
                  />
                </div>
              </div>
              <div v-if="formError" class="mt-3 text-sm text-error">{{ formError }}</div>
              <div class="mt-4 flex items-center gap-2">
                <button type="button" class="btn btn-primary" @click="saveEditorial">Save</button>
                <button type="button" class="btn btn-ghost" @click="cancelEdit">Cancel</button>
              </div>
            </div>
            <div v-else>
              <markdown-renderer class="prose max-w-none" :md="editorialContent" />
              <div v-if="selectedEditorial" class="mt-4 text-xs opacity-70">
                {{ selectedEditorial.author_username }} · {{ selectedEditorial.updated_at }}
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
