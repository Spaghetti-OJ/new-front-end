<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/api";
import { useTitle } from "@vueuse/core";
import { useSession, UserRole } from "@/stores/session";
import axios from "axios";

const route = useRoute();
const router = useRouter();
const session = useSession();
useTitle(`Members - ${route.params.name} | Normal OJ`);
enum MemberTableColumn {
  USERNAME = "username",
  REAL_NAME = "real_name",
  ROLE = "role",
}
const sortBy = ref<MemberTableColumn>(
  Object.values(MemberTableColumn).includes(route.query.sort as MemberTableColumn)
    ? (route.query.sort as MemberTableColumn)
    : MemberTableColumn.USERNAME,
);
watch(sortBy, () => {
  router.replace({ query: { sort: sortBy.value || MemberTableColumn.USERNAME } });
});

const rawMembers = ref<UserInfo[]>([]);
const members = computed(() => {
  return [...rawMembers.value].sort((a, b) => {
    if (sortBy.value === "username") {
      return a.username.localeCompare(b.username);
    } else if (sortBy.value === "real_name") {
      return a.real_name.localeCompare(b.real_name);
    } else {
      return a.role.localeCompare(b.role);
    }
  });
});

const error = ref<any>(undefined);
const isLoading = ref(true);
const selectedUsernames = ref<string[]>([]);
const removeLoading = ref(false);
const removeError = ref<string | null>(null);
const addUsername = ref("");
const addLoading = ref(false);
const addError = ref<string | null>(null);

const loadMembers = async () => {
  try {
    const res = await api.Course.info(route.params.name as string);
    if (res?.data.TAs && res?.data.students && res?.data.teacher) {
      rawMembers.value = [res.data.teacher, ...res.data.students, ...res.data.TAs];
    }
  } catch (err: any) {
    error.value = err;
    members.value = [];
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  void loadMembers();
});

const rolesCanCreateCourse = [UserRole.Admin, UserRole.Teacher];
const rolesCanRemove = [UserRole.Admin, UserRole.Teacher];
const canRemove = computed(() => rolesCanRemove.includes(session.role));

const isOpen = ref(false);
const newMembers = ref<File | null>();
const newMembersCSVString = ref("");
const forceUpdate = ref(false);
const isProcessingSignup = ref(false);
const errorMsg = ref("");
const previewCSV = ref<{ headers?: string[]; body?: string[][] }>({});

watch(newMembers, () => {
  if (!newMembers.value) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    if (typeof evt.target?.result !== "string") return;
    newMembersCSVString.value = evt.target?.result;

    const rows = newMembersCSVString.value.split("\n");
    previewCSV.value.headers = rows[0].split(",");
    previewCSV.value.body = rows.slice(1).map((r) => r.split(","));
  };
  reader.readAsText(newMembers.value);
});
async function submit() {
  if (!newMembersCSVString.value) return;
  isProcessingSignup.value = true;
  const csv = newMembersCSVString.value;

  try {
    if (!newMembers.value) return;
    await api.Course.importCSV(route.params.name as string, newMembers.value, forceUpdate.value);
    router.go(0);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      errorMsg.value = error.response.data.message;
    } else {
      errorMsg.value = "Unknown error occurred :(";
    }
    throw error;
  } finally {
    isProcessingSignup.value = false;
  }
}

function toggleSelect(username?: string) {
  if (!username) return;
  const idx = selectedUsernames.value.indexOf(username);
  if (idx === -1) selectedUsernames.value.push(username);
  else selectedUsernames.value.splice(idx, 1);
}

async function removeSelected() {
  if (!selectedUsernames.value.length) return;
  removeLoading.value = true;
  removeError.value = null;
  try {
    await api.Course.editMember(route.params.name as string, { remove: selectedUsernames.value, new: [] });
    selectedUsernames.value = [];
    await loadMembers();
  } catch (err: any) {
    removeError.value = err?.response?.data?.message || err?.message || "Failed to remove members.";
  } finally {
    removeLoading.value = false;
  }
}

async function addByUsername() {
  const username = addUsername.value.trim();
  if (!username) return;
  addLoading.value = true;
  addError.value = null;
  try {
    await api.Course.editMember(route.params.name as string, { new: [username], remove: [] });
    addUsername.value = "";
    await loadMembers();
  } catch (err: any) {
    addError.value = err?.response?.data?.message || err?.message || "Failed to add member.";
  } finally {
    addLoading.value = false;
  }
}
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body">
        <div class="card-title">
          {{ $t("course.members.title") }}
          <span v-if="members" class="text-sm opacity-70">({{ members.length }})</span>

          <div class="flex-1" />

          <div class="flex items-center gap-2">
            <label v-if="rolesCanCreateCourse.includes(session.role)" for="my-modal" class="btn btn-success">
              <i-uil-plus-circle class="mr-1 lg:h-5 lg:w-5" /> {{ $t("course.members.new") }}
            </label>
          </div>
        </div>

        <div v-if="removeError" class="alert alert-error my-3 shadow-lg">
          <div>
            <i-uil-times-circle />
            <span>{{ removeError }}</span>
          </div>
        </div>

        <div class="mb-4 flex flex-wrap items-end gap-3">
          <div class="form-control w-full max-w-xs">
            <label class="label">
              <span class="label-text">{{ $t("course.members.sortBy") }}</span>
            </label>
            <select v-model="sortBy" class="select select-bordered w-full max-w-xs">
              <option :value="MemberTableColumn.USERNAME">Username</option>
              <option :value="MemberTableColumn.REAL_NAME">Real Name</option>
              <option :value="MemberTableColumn.ROLE">Role</option>
            </select>
          </div>
          <div v-if="rolesCanCreateCourse.includes(session.role)" class="form-control w-full max-w-xs">
            <label class="label">
              <span class="label-text">Add by username</span>
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model="addUsername"
                type="text"
                class="input input-bordered w-full max-w-xs"
                placeholder="username"
              />
              <button
                class="btn btn-primary btn-sm"
                :class="addLoading && 'loading'"
                :disabled="!addUsername.trim()"
                @click="addByUsername"
                style="height: 2.5rem; min-width: 3.5rem"
              >
                Add
              </button>
              <button
                v-if="canRemove"
                class="flex h-10 w-10 items-center justify-center self-center border-none bg-transparent p-0 pl-2 shadow-none"
                :class="removeLoading && 'loading'"
                :disabled="!selectedUsernames.length"
                @click="removeSelected"
                aria-label="Remove selected"
                title="Remove selected"
              >
                <i-uil-trash-alt class="h-6 w-6 text-error" />
              </button>
            </div>
            <p v-if="addError" class="mt-1 text-xs text-error">{{ addError }}</p>
          </div>
        </div>
        <data-status-wrapper :error="error" :is-loading="isLoading">
          <template #loading>
            <skeleton-table :col="canRemove ? 4 : 3" :row="5" />
          </template>
          <template #data>
            <table class="table w-full">
              <thead>
                <tr>
                  <th v-if="canRemove"></th>
                  <th>username</th>
                  <th>real name</th>
                  <th>role</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="{ username, real_name, role } in members" :key="username" class="hover">
                  <td v-if="canRemove">
                    <template v-if="role === 'student'">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-sm"
                        :checked="selectedUsernames.includes(username)"
                        @change="toggleSelect(username)"
                      />
                    </template>
                  </td>
                  <td>
                    <router-link :to="`/profile/${username}`" class="link link-hover">
                      {{ username }}
                    </router-link>
                  </td>
                  <td>{{ real_name }}</td>
                  <td>{{ role }}</td>
                </tr>
              </tbody>
            </table>
          </template>
        </data-status-wrapper>
      </div>
    </div>

    <input v-model="isOpen" type="checkbox" id="my-modal" class="modal-toggle" />
    <div class="modal">
      <div class="modal-box">
        <div>
          {{ $t("course.members.csvUploadHint.header") }}
          <ul class="ml-4 list-disc">
            <li v-for="h in ['username', 'email', 'real_name']">
              <code>{{ h }}</code>
            </li>
            <li v-for="h in ['student_id', 'password']">
              <code>{{ h }}</code> (optional)
            </li>
          </ul>
        </div>
        <div>
          {{ $t("course.members.csvUploadHint.content") }}
        </div>

        <div class="mt-2 font-bold">
          {{ $t("course.members.csvUploadHint.caution") }}
        </div>

        <div class="my-4" />

        <div class="alert alert-error shadow-lg" v-if="errorMsg">
          <div>
            <i-uil-times-circle />
            <span>{{ errorMsg }}</span>
          </div>
        </div>

        <div class="form-control my-4">
          <label class="label cursor-pointer">
            <span class="label-text">{{ $t("course.members.forceUpdate") }}</span>
            <input type="checkbox" class="checkbox checkbox-primary" v-model="forceUpdate" />
          </label>
        </div>

        <template v-if="!newMembers">
          <input
            type="file"
            id="file-uploader"
            accept=".csv"
            @change="newMembers = ($event.target as HTMLInputElement).files?.[0]"
          />
        </template>
        <template v-else>
          <table class="table-auto">
            <thead>
              <tr v-if="previewCSV.headers">
                <th v-for="h in previewCSV.headers">{{ h }}</th>
              </tr>
            </thead>
            <tbody v-if="previewCSV.body">
              <tr v-for="r in previewCSV.body">
                <td v-for="c in r">
                  {{ c }}
                </td>
              </tr>
            </tbody>
          </table>
          <div class="flex">
            <button class="btn btn-sm" @click="newMembers = null">
              <i-uil-times />
            </button>
          </div>
        </template>
        <div class="modal-action">
          <label for="my-modal" class="btn btn-ghost">{{ $t("course.members.cancel") }}</label>
          <div :class="['btn btn-success ml-3', isProcessingSignup && 'loading']" @click="submit">
            {{ $t("course.members.submit") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
