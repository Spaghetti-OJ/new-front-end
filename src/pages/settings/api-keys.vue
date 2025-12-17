<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/zh-tw";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import { useI18n } from "vue-i18n";
import api from "@/api";
import Name from "../courses/[name].vue";
dayjs.extend(LocalizedFormat);

// ===== Type definitions ===== //
type PermissionType = "submissions" | "courses" | "problems" | "user";

interface PermissionRow {
  type: PermissionType;
  read: boolean;
  write: boolean;
}

interface ApiKeyRow {
  id: string;
  name: string;
  status: "active" | "disabled";
  usage: number;
  maskedKey: string;
  permissions: PermissionRow[];
  createdAt: string;
  expiresAt?: string;
}
interface createForm {
  name: string;
  permissions?: string[];
  expires_at?: string;
}
// ===== Reactive State ===== //
const apiKeys = ref<ApiKeyRow[]>([]);

const showCreateModal = ref(false);
const showDetailModal = ref(false);
const showGeneratedModal = ref(false);

const createFormName = ref("");
const createFormPermissions = ref<PermissionRow[]>([
  { type: "submissions", read: false, write: false },
  { type: "courses", read: false, write: false },
  { type: "problems", read: false, write: false },
  { type: "user", read: false, write: false },
]);

const createFormExpiresDate = ref("");
const createFormExpiresTime = ref("");

const selectedKey = ref<ApiKeyRow | null>(null);
const generatedKey = ref<string | null>(null);
const copyState = ref<"idle" | "copied" | "error">("idle");
const createError = ref<string | null>(null);
const expiresError = ref<string | null>(null);
const showDeleteConfirm = ref(false);

// Sync dayjs locale with i18n locale
const { locale } = useI18n();
watch(
  locale,
  (val) => {
    dayjs.locale(val || "en");
  },
  { immediate: true },
);

// 標籤翻譯
const permissionLabel: Record<PermissionType, string> = {
  submissions: "Submissions",
  courses: "Courses",
  problems: "Problems",
  user: "User",
};
//前後端轉換//
function mapPermissions(perms: string[]): PermissionRow[] {
  const base: PermissionRow[] = [
    { type: "submissions", read: false, write: false },
    { type: "courses", read: false, write: false },
    { type: "problems", read: false, write: false },
    { type: "user", read: false, write: false },
  ];

  for (const p of perms) {
    const [action, resource] = p.split(":"); // e.g. read:problems
    const row = base.find((r) => r.type === resource);
    if (!row) continue;

    if (action === "read") row.read = true;
    if (action === "write") row.write = true;
  }

  return base;
}
function mapApiKeyFromBackend(b: any): ApiKeyRow {
  return {
    id: b.id,
    name: b.name,
    status: b.is_active ? "active" : "disabled",
    usage: b.usage_count,
    maskedKey: b.prefix, // 你 UI 用 maskedKey
    permissions: mapPermissions(b.permissions),
    createdAt: b.created_at,
    expiresAt: b.expires_at ?? undefined,
  };
}
function mapPermissionsToApi(permissions: PermissionRow[]): string[] {
  return permissions.flatMap((p) => {
    const result: string[] = [];
    if (p.read) result.push(`read:${p.type}`);
    if (p.write) result.push(`write:${p.type}`);
    return result;
  });
}
//加載目前apikey//
async function getapikeylist() {
  const res = await api.Auth.listtokens();
  const raw = Array.isArray(res) ? res : res;
  apiKeys.value = raw.map(mapApiKeyFromBackend);
}

// ===== Load Demo ===== //
onMounted(() => {
  getapikeylist();
});

// ===== Utils ===== //
async function generateKey(formData: createForm) {
  const res = await api.Auth.generatetoken(formData);
  return res.full_token;
}

function masked(key: string) {
  return `${key.slice(0, 8)}****${key.slice(-4)}`;
}

function resetCreateForm() {
  createFormName.value = "";
  createFormPermissions.value = [
    { type: "submissions", read: false, write: false },
    { type: "courses", read: false, write: false },
    { type: "problems", read: false, write: false },
    { type: "user", read: false, write: false },
  ];
  createFormExpiresDate.value = "";
  createFormExpiresTime.value = "";
  createError.value = null;
  expiresError.value = null;
}

function openCreateModal() {
  resetCreateForm();
  showCreateModal.value = true;
}

// ===== Create API Key ===== //
async function handleCreateKey() {
  if (!createFormName.value.trim()) {
    createError.value = "Please enter a name.";
    return;
  }
  createError.value = null;
  expiresError.value = null;

  const now = new Date();
  const id = now.getTime();

  let expires: string | undefined = undefined;
  if (createFormExpiresDate.value && createFormExpiresTime.value) {
    const expiresDate = new Date(`${createFormExpiresDate.value}T${createFormExpiresTime.value}`);
    if (expiresDate.getTime() <= now.getTime()) {
      expiresError.value = "Expiration time must be in the future.";
      return;
    }
    expires = expiresDate.toISOString();
  }
  const input = {
    name: createFormName.value,
    permissions: mapPermissionsToApi(createFormPermissions.value),
    expires_at: expires,
  };

  const fullKey = await generateKey(input);
  const newKey: ApiKeyRow = {
    id: "1",
    name: createFormName.value.trim(),
    status: "active",
    usage: 0,
    maskedKey: fullKey,
    createdAt: now.toISOString(),
    expiresAt: expires,
    permissions: JSON.parse(JSON.stringify(createFormPermissions.value)),
  };

  apiKeys.value.push(newKey);
  showCreateModal.value = false;
  generatedKey.value = fullKey;
  showGeneratedModal.value = true;
  await getapikeylist();
}

// ===== Detail ===== //
function openDetailModal(key: ApiKeyRow) {
  selectedKey.value = key;
  showDetailModal.value = true;
}

function closeDetailModal() {
  selectedKey.value = null;
  showDetailModal.value = false;
  showDeleteConfirm.value = false;
}

// ===== Delete ===== //
async function confirmDeleteSelected() {
  if (!selectedKey.value) return;
  const res = await api.Auth.deletetokens(selectedKey.value.id);
  apiKeys.value = apiKeys.value.filter((k) => k.id !== selectedKey.value!.id);
  closeDetailModal();
  await getapikeylist();
}

// ===== Copy ===== //
async function copyGeneratedKey() {
  if (!generatedKey.value) return;
  try {
    await navigator.clipboard.writeText(generatedKey.value);
    copyState.value = "copied";
  } catch {
    copyState.value = "error";
  }
  setTimeout(() => {
    copyState.value = "idle";
  }, 1500);
}

function closeGeneratedModal() {
  generatedKey.value = null;
  showGeneratedModal.value = false;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = dayjs(value);
  return date.isValid() ? date.format("LL") : value;
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = dayjs(value);
  return date.isValid() ? date.format("LLL") : value;
}
</script>

<template>
  <div class="card mx-auto max-w-6xl shadow-xl">
    <div class="card-body">
      <div class="card-title justify-between">
        <span class="text-lg font-bold">API Keys</span>
        <button class="btn btn-success btn-sm font-semibold uppercase tracking-wide" @click="openCreateModal">
          Create New Secret Key
        </button>
      </div>

      <div class="my-2" />

      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th class="text-xs font-semibold text-neutral">NAME</th>
              <th class="text-xs font-semibold text-neutral">STATUS</th>
              <th class="text-xs font-semibold text-neutral">USAGE</th>
              <th class="text-xs font-semibold text-neutral">CREATED AT</th>
              <th class="text-xs font-semibold text-neutral">EXPIRES AT</th>
              <th class="w-20"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="key in apiKeys" :key="key.id" class="hover">
              <td class="font-medium">{{ key.name }}</td>
              <td>
                <span v-if="key.status === 'active'" class="badge badge-success badge-outline"> Active </span>
                <span v-else class="badge badge-ghost">Disabled</span>
              </td>
              <td>{{ key.usage }}</td>
              <td>{{ formatDate(key.createdAt) }}</td>
              <td>{{ formatDateTime(key.expiresAt) }}</td>
              <td class="text-right">
                <button class="btn btn-ghost btn-sm" @click="openDetailModal(key)">
                  <i-uil-search class="h-5 w-5" />
                </button>
              </td>
            </tr>

            <tr v-if="apiKeys.length === 0">
              <td colspan="6" class="py-8 text-center text-sm text-neutral">
                No API keys yet. Click
                <span class="font-semibold">Create New Secret Key</span>
                to get started.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- CREATE MODAL -->
  <div class="modal" :class="{ 'modal-open': showCreateModal }">
    <div class="modal-box max-w-xl">
      <h3 class="mb-4 text-xl font-bold">Create API Key</h3>

      <div class="mb-4">
        <label class="label">
          <span class="label-text font-semibold">Name</span>
        </label>
        <input
          v-model="createFormName"
          type="text"
          placeholder="e.g. Normal OJ integration key"
          class="input input-bordered w-full"
        />
        <p v-if="createError" class="mt-1 text-sm text-error">{{ createError }}</p>
      </div>

      <div class="mb-4">
        <p class="mb-2 font-semibold">Permissions</p>
        <div class="overflow-x-auto rounded-2xl border bg-base-100">
          <table class="table w-full">
            <thead>
              <tr>
                <th>Types</th>
                <th class="text-center">Read</th>
                <th class="text-center">Write</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="perm in createFormPermissions" :key="perm.type">
                <td class="font-medium">{{ permissionLabel[perm.type] }}</td>
                <td class="text-center">
                  <input type="checkbox" v-model="perm.read" class="checkbox checkbox-sm" />
                </td>
                <td class="text-center">
                  <input type="checkbox" v-model="perm.write" class="checkbox checkbox-sm" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mb-6">
        <p class="mb-2 font-semibold">Expiration Date</p>
        <div class="flex gap-3">
          <input v-model="createFormExpiresDate" type="date" class="input input-bordered w-full" />
          <input v-model="createFormExpiresTime" type="time" class="input input-bordered w-full" />
        </div>
        <p v-if="expiresError" class="mt-1 text-sm text-error">{{ expiresError }}</p>
      </div>

      <div class="modal-action justify-between">
        <button class="btn btn-ghost" @click="showCreateModal = false">Close</button>
        <button class="btn btn-success" @click="handleCreateKey">Create</button>
      </div>
    </div>
  </div>

  <!-- Proper DaisyUI Backdrop -->
  <div v-if="showCreateModal" class="modal-backdrop" @click="showCreateModal = false" />

  <!-- GENERATED KEY MODAL -->
  <div class="modal" :class="{ 'modal-open': showGeneratedModal }">
    <div class="modal-box max-w-lg">
      <h3 class="mb-3 text-xl font-bold">New API Key</h3>
      <p class="mb-3 text-sm text-warning">This key will only be shown once. Please store it safely.</p>

      <div class="mb-4 flex items-center justify-between rounded-xl bg-base-200 px-4 py-3">
        <code class="mr-3 break-all text-sm">{{ generatedKey }}</code>
        <button class="btn btn-outline btn-sm gap-2" @click="copyGeneratedKey">
          <template v-if="copyState === 'copied'">
            <i-uil-check class="h-4 w-4" />
            <span>Copied</span>
          </template>
          <template v-else-if="copyState === 'error'">
            <i-uil-exclamation-circle class="h-4 w-4" />
            <span>Retry</span>
          </template>
          <template v-else>
            <i-uil-copy class="h-4 w-4" />
            <span>Copy</span>
          </template>
        </button>
      </div>

      <div class="modal-action justify-end">
        <button class="btn" @click="closeGeneratedModal">I have stored it</button>
      </div>
    </div>
  </div>

  <div v-if="showGeneratedModal" class="modal-backdrop" @click="closeGeneratedModal" />

  <!-- DETAIL MODAL -->
  <div class="modal" :class="{ 'modal-open': showDetailModal }">
    <div class="modal-box max-w-xl">
      <h3 class="mb-4 text-xl font-bold">API Key Details</h3>

      <div v-if="selectedKey">
        <div class="mb-3">
          <p class="text-xs text-neutral">Name</p>
          <p class="font-semibold">{{ selectedKey.name }}</p>
        </div>

        <div class="mb-3 flex gap-8">
          <div>
            <p class="text-xs text-neutral">Status</p>
            <p class="font-semibold">{{ selectedKey.status }}</p>
          </div>
          <div>
            <p class="text-xs text-neutral">Usage</p>
            <p class="font-semibold">{{ selectedKey.usage }}</p>
          </div>
        </div>

        <p class="mb-2 font-semibold">Permissions</p>
        <div class="mb-6 overflow-x-auto rounded-2xl border bg-base-100">
          <table class="table w-full">
            <thead>
              <tr>
                <th>Types</th>
                <th class="text-center">Read</th>
                <th class="text-center">Create</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="perm in selectedKey.permissions" :key="perm.type">
                <td>{{ permissionLabel[perm.type] }}</td>
                <td class="text-center">
                  <i-uil-check v-if="perm.read" class="mx-auto h-7 w-7 text-black" />
                </td>
                <td class="text-center">
                  <i-uil-check v-if="perm.write" class="mx-auto h-7 w-7 text-black" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="modal-action justify-between">
        <button class="btn btn-outline btn-error" @click="showDeleteConfirm = true">Delete</button>
        <button class="btn" @click="closeDetailModal">Close</button>
      </div>
    </div>
  </div>

  <div v-if="showDetailModal" class="modal-backdrop" @click="closeDetailModal" />

  <!-- Delete confirmation modal -->
  <div class="modal" :class="{ 'modal-open': showDeleteConfirm }">
    <div class="modal-box max-w-sm">
      <h3 class="text-lg font-bold">Delete API Key</h3>
      <p class="mt-3 text-sm">
        Are you sure you want to delete
        <span class="font-semibold">"{{ selectedKey?.name }}"</span>?
      </p>
      <div class="modal-action">
        <button class="btn btn-ghost" @click="showDeleteConfirm = false">Cancel</button>
        <button class="btn btn-error" @click="confirmDeleteSelected">Delete</button>
      </div>
    </div>
  </div>

  <div v-if="showDeleteConfirm" class="modal-backdrop" @click="showDeleteConfirm = false" />
</template>

<style scoped>
.table thead tr {
  background-color: rgba(255, 255, 255, 0.05);
  font-weight: 600;
  text-transform: uppercase;
}

.table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
