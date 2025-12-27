<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/zh-tw";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import { useI18n } from "vue-i18n";
import api from "@/api";
dayjs.extend(LocalizedFormat);

// Type definitions
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
interface CreateForm {
  name: string;
  permissions?: string[];
  expires_at?: string;
}
// Reactive State
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
const { locale, t } = useI18n();
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
//前後端轉換
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
    maskedKey: b.prefix,
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
//加載目前apikey
async function getApiKeyList() {
  const res = await api.Auth.listTokens();
  const raw = Array.isArray(res) ? res : res;
  apiKeys.value = raw.map(mapApiKeyFromBackend);
}

// Load Demo
onMounted(() => {
  getApiKeyList();
});

// Utils
async function generateKey(formData: CreateForm) {
  const res = await api.Auth.generateToken(formData);
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
    createError.value = t("settings.pleaseEnterName");
    return;
  }
  createError.value = null;
  expiresError.value = null;

  const now = new Date();

  let expires: string | undefined = undefined;
  if (createFormExpiresDate.value && createFormExpiresTime.value) {
    const expiresDate = new Date(`${createFormExpiresDate.value}T${createFormExpiresTime.value}`);
    if (expiresDate.getTime() <= now.getTime()) {
      expiresError.value = t("settings.expirationMustBeFuture");
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

  showCreateModal.value = false;
  generatedKey.value = fullKey;
  showGeneratedModal.value = true;
  await getApiKeyList();
}

// Detail
function openDetailModal(key: ApiKeyRow) {
  selectedKey.value = key;
  showDetailModal.value = true;
}

function closeDetailModal() {
  selectedKey.value = null;
  showDetailModal.value = false;
  showDeleteConfirm.value = false;
}

// Delete
async function confirmDeleteSelected() {
  if (!selectedKey.value) return;
  const res = await api.Auth.deleteToken(selectedKey.value.id);
  apiKeys.value = apiKeys.value.filter((k) => k.id !== selectedKey.value!.id);
  closeDetailModal();
  await getApiKeyList();
}

// Copy
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
        <span class="text-lg font-bold">{{ t("settings.apiKeys") }}</span>
        <button class="btn btn-success btn-sm font-semibold uppercase tracking-wide" @click="openCreateModal">
          {{ t("settings.createNewSecretKey") }}
        </button>
      </div>

      <div class="my-2" />

      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th class="text-xs font-semibold text-neutral">{{ t("settings.name").toUpperCase() }}</th>
              <th class="text-xs font-semibold text-neutral">{{ t("settings.status").toUpperCase() }}</th>
              <th class="text-xs font-semibold text-neutral">{{ t("settings.usage").toUpperCase() }}</th>
              <th class="text-xs font-semibold text-neutral">{{ t("settings.createdAt").toUpperCase() }}</th>
              <th class="text-xs font-semibold text-neutral">{{ t("settings.expiresAt").toUpperCase() }}</th>
              <th class="w-20"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="key in apiKeys" :key="key.id" class="hover">
              <td class="font-medium">{{ key.name }}</td>
              <td>
                <span v-if="key.status === 'active'" class="badge badge-success badge-outline">
                  {{ t("settings.active") }}
                </span>
                <span v-else class="badge badge-ghost">{{ t("settings.disabled") }}</span>
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
                {{ t("settings.noApiKeys") }}
                <span class="font-semibold">{{ t("settings.createNewSecretKey") }}</span>
                {{ t("settings.toGetStarted") }}
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
      <h3 class="mb-4 text-xl font-bold">{{ t("settings.createApiKey") }}</h3>

      <div class="mb-4">
        <label class="label">
          <span class="label-text font-semibold">{{ t("settings.name") }}</span>
        </label>
        <input
          v-model="createFormName"
          type="text"
          :placeholder="t('settings.placeholderKeyName')"
          class="input input-bordered w-full"
        />
        <p v-if="createError" class="mt-1 text-sm text-error">{{ createError }}</p>
      </div>

      <div class="mb-4">
        <p class="mb-2 font-semibold">{{ t("settings.permissions") }}</p>
        <div class="overflow-x-auto rounded-2xl border bg-base-100">
          <table class="table w-full">
            <thead>
              <tr>
                <th>{{ t("settings.types") }}</th>
                <th class="text-center">{{ t("settings.read") }}</th>
                <th class="text-center">{{ t("settings.write") }}</th>
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
        <p class="mb-2 font-semibold">{{ t("settings.expirationDate") }}</p>
        <div class="flex gap-3">
          <input v-model="createFormExpiresDate" type="date" class="input input-bordered w-full" />
          <input v-model="createFormExpiresTime" type="time" class="input input-bordered w-full" />
        </div>
        <p v-if="expiresError" class="mt-1 text-sm text-error">{{ expiresError }}</p>
      </div>

      <div class="modal-action justify-between">
        <button class="btn btn-ghost" @click="showCreateModal = false">{{ t("settings.close") }}</button>
        <button class="btn btn-success" @click="handleCreateKey">{{ t("settings.create") }}</button>
      </div>
    </div>
  </div>

  <!-- Proper DaisyUI Backdrop -->
  <div v-if="showCreateModal" class="modal-backdrop" @click="showCreateModal = false" />

  <!-- GENERATED KEY MODAL -->
  <div class="modal" :class="{ 'modal-open': showGeneratedModal }">
    <div class="modal-box max-w-lg">
      <h3 class="mb-3 text-xl font-bold">{{ t("settings.newApiKey") }}</h3>
      <p class="mb-3 text-sm text-warning">{{ t("settings.keyShownOnce") }}</p>

      <div class="mb-4 flex items-center justify-between rounded-xl bg-base-200 px-4 py-3">
        <code class="mr-3 break-all text-sm">{{ generatedKey }}</code>
        <button class="btn btn-outline btn-sm gap-2" @click="copyGeneratedKey">
          <template v-if="copyState === 'copied'">
            <i-uil-check class="h-4 w-4" />
            <span>{{ t("settings.copied") }}</span>
          </template>
          <template v-else-if="copyState === 'error'">
            <i-uil-exclamation-circle class="h-4 w-4" />
            <span>{{ t("settings.retry") }}</span>
          </template>
          <template v-else>
            <i-uil-copy class="h-4 w-4" />
            <span>{{ t("settings.copy") }}</span>
          </template>
        </button>
      </div>

      <div class="modal-action justify-end">
        <button class="btn" @click="closeGeneratedModal">{{ t("settings.iHaveStoredIt") }}</button>
      </div>
    </div>
  </div>

  <div v-if="showGeneratedModal" class="modal-backdrop" @click="closeGeneratedModal" />

  <!-- DETAIL MODAL -->
  <div class="modal" :class="{ 'modal-open': showDetailModal }">
    <div class="modal-box max-w-xl">
      <h3 class="mb-4 text-xl font-bold">{{ t("settings.apiKeyDetails") }}</h3>

      <div v-if="selectedKey">
        <div class="mb-3">
          <p class="text-xs text-neutral">{{ t("settings.name") }}</p>
          <p class="font-semibold">{{ selectedKey.name }}</p>
        </div>

        <div class="mb-3 flex gap-8">
          <div>
            <p class="text-xs text-neutral">{{ t("settings.status") }}</p>
            <p class="font-semibold">{{ selectedKey.status }}</p>
          </div>
          <div>
            <p class="text-xs text-neutral">{{ t("settings.usage") }}</p>
            <p class="font-semibold">{{ selectedKey.usage }}</p>
          </div>
        </div>

        <p class="mb-2 font-semibold">{{ t("settings.permissions") }}</p>
        <div class="mb-6 overflow-x-auto rounded-2xl border bg-base-100">
          <table class="table w-full">
            <thead>
              <tr>
                <th>{{ t("settings.types") }}</th>
                <th class="text-center">{{ t("settings.read") }}</th>
                <th class="text-center">{{ t("settings.create") }}</th>
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
        <button class="btn btn-outline btn-error" @click="showDeleteConfirm = true">
          {{ t("settings.delete") }}
        </button>
        <button class="btn" @click="closeDetailModal">{{ t("settings.close") }}</button>
      </div>
    </div>
  </div>

  <div v-if="showDetailModal" class="modal-backdrop" @click="closeDetailModal" />

  <!-- Delete confirmation modal -->
  <div class="modal" :class="{ 'modal-open': showDeleteConfirm }">
    <div class="modal-box max-w-sm">
      <h3 class="text-lg font-bold">{{ t("settings.deleteApiKey") }}</h3>
      <p class="mt-3 text-sm">
        {{ t("settings.areYouSureDelete") }}
        <span class="font-semibold">"{{ selectedKey?.name }}"</span>?
      </p>
      <div class="modal-action">
        <button class="btn btn-ghost" @click="showDeleteConfirm = false">{{ t("settings.cancel") }}</button>
        <button class="btn btn-error" @click="confirmDeleteSelected">{{ t("settings.delete") }}</button>
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
