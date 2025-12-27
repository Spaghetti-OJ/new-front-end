<script setup lang="ts">
import { ref, computed, reactive, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useTitle } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import api from "@/api";
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
const showDeleteConfirm = ref(false);
const formError = ref<string | null>(null);

const draft = reactive({
  content: "",
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
    const res = await api.Problem.getEditorials(route.params.id as string);
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
  draft.content = selectedEditorial.value.content;
  isCreating.value = false;
  isEditing.value = true;
  formError.value = null;
};

const startCreate = () => {
  draft.content = "";
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
  if (!draft.content.trim()) {
    formError.value = "Content is required.";
    return;
  }

  const payload = {
    content: draft.content,
  };

  try {
    formError.value = null;
    if (isCreating.value) {
      const res = await api.Problem.createEditorial(route.params.id as string, payload);
      const created = res.data ?? res;
      await fetchEditorials();
      if (created?.id) {
        selectedId.value = created.id;
      }
    } else if (selectedEditorial.value) {
      const res = await api.Problem.updateEditorial(
        route.params.id as string,
        selectedEditorial.value.id,
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
  try {
    await api.Problem.deleteEditorial(route.params.id as string, selectedEditorial.value.id);
    selectedId.value = null;
    await fetchEditorials();
    showDeleteConfirm.value = false;
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
        <!-- 上方：標題 + Option -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="card-title md:text-2xl lg:text-3xl">Editorial for Problem #{{ $route.params.id }}</div>

          <div class="flex flex-wrap items-center gap-2">
            <select
              v-if="editorials.length > 1"
              v-model="selectedId"
              class="select select-bordered select-sm"
            >
              <option v-for="item in editorials" :key="item.id" :value="item.id">
                Editorial by {{ item.author_username }}
              </option>
            </select>

            <button v-if="canEdit" type="button" class="btn btn-success" @click="startCreate">
              <i-uil-plus-circle class="mr-1 h-5 w-5" /> New Editorial
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
              @click="showDeleteConfirm = true"
            >
              <i-uil-trash-alt class="mr-1 h-5 w-5" /> Delete
            </button>
          </div>
        </div>

        <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/30" @click="showDeleteConfirm = false"></div>
          <div
            class="relative w-[22rem] max-w-[90vw] rounded-2xl border border-base-300 bg-base-200 p-4 shadow-xl"
          >
            <div class="flex items-center gap-2 text-base font-semibold text-error">
              <i-uil-exclamation-triangle />
              <span>Delete this editorial?</span>
            </div>
            <p class="mt-2 text-sm opacity-70">This action cannot be undone.</p>
            <div class="mt-4 flex justify-end gap-2">
              <button type="button" class="btn btn-ghost btn-sm" @click="showDeleteConfirm = false">
                Cancel
              </button>
              <button type="button" class="btn btn-error btn-sm" @click="deleteEditorial">Confirm</button>
            </div>
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
            <div class="mt-4 flex items-center gap-2 text-sm text-error">
              <i-uil-times-circle />
              <span>{{ t("course.problem.solution.err.load") }}</span>
            </div>
          </template>

          <template v-else>
            <div v-if="isEditing">
              <div class="space-y-5">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-semibold">Content</span>
                  </label>
                  <textarea
                    v-model="draft.content"
                    class="textarea textarea-bordered min-h-[300px] w-full"
                    placeholder="題解內容"
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
