<script setup lang="ts">
import { ref, onMounted } from "vue";

// ===== Type definitions ===== //
type PermissionType = "submissions" | "courses" | "homeworks" | "announcements";

interface PermissionRow {
  type: PermissionType;
  read: boolean;
  create: boolean;
}

interface ApiKeyRow {
  id: number;
  name: string;
  status: "active" | "disabled";
  usage: number;
  maskedKey: string;
  permissions: PermissionRow[];
  createdAt: string;
  expiresAt?: string;
}

// ===== Reactive State ===== //
const apiKeys = ref<ApiKeyRow[]>([]);

const showCreateModal = ref(false);
const showDetailModal = ref(false);
const showGeneratedModal = ref(false);

const createFormName = ref("");
const createFormPermissions = ref<PermissionRow[]>([
  { type: "submissions", read: false, create: false },
  { type: "courses", read: false, create: false },
  { type: "homeworks", read: false, create: false },
  { type: "announcements", read: false, create: false },
]);

const createFormExpiresDate = ref("");
const createFormExpiresTime = ref("");

const selectedKey = ref<ApiKeyRow | null>(null);
const generatedKey = ref<string | null>(null);

// 標籤翻譯
const permissionLabel: Record<PermissionType, string> = {
  submissions: "Submissions",
  courses: "Courses",
  homeworks: "Homeworks",
  announcements: "Announcements",
};

// ===== Load Demo ===== //
onMounted(() => {
  apiKeys.value = [
    {
      id: 1,
      name: "my api key 01",
      status: "active",
      usage: 42,
      maskedKey: "sk-live-****abcd",
      permissions: [
        { type: "submissions", read: true, create: false },
        { type: "courses", read: false, create: true },
        { type: "homeworks", read: true, create: false },
        { type: "announcements", read: false, create: true },
      ],
      createdAt: new Date().toISOString(),
      expiresAt: "2026-01-01T00:00:00Z",
    },
  ];
});

// ===== Utils ===== //
function generateKey() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return `sk-live-${result}`;
}

function masked(key: string) {
  return `${key.slice(0, 8)}****${key.slice(-4)}`;
}

function resetCreateForm() {
  createFormName.value = "";
  createFormPermissions.value = [
    { type: "submissions", read: false, create: false },
    { type: "courses", read: false, create: false },
    { type: "homeworks", read: false, create: false },
    { type: "announcements", read: false, create: false },
  ];
  createFormExpiresDate.value = "";
  createFormExpiresTime.value = "";
}

function openCreateModal() {
  resetCreateForm();
  showCreateModal.value = true;
}

// ===== Create API Key ===== //
function handleCreateKey() {
  if (!createFormName.value.trim()) {
    alert("Please enter a name.");
    return;
  }

  const fullKey = generateKey();
  const now = new Date();
  const id = now.getTime();

  const expires =
    createFormExpiresDate.value && createFormExpiresTime.value
      ? new Date(
          `${createFormExpiresDate.value}T${createFormExpiresTime.value}`
        ).toISOString()
      : undefined;

  const newKey: ApiKeyRow = {
    id,
    name: createFormName.value.trim(),
    status: "active",
    usage: 0,
    maskedKey: masked(fullKey),
    createdAt: now.toISOString(),
    expiresAt: expires,
    permissions: JSON.parse(JSON.stringify(createFormPermissions.value)),
  };

  apiKeys.value.push(newKey);

  showCreateModal.value = false;
  generatedKey.value = fullKey;
  showGeneratedModal.value = true;
}

// ===== Detail ===== //
function openDetailModal(key: ApiKeyRow) {
  selectedKey.value = key;
  showDetailModal.value = true;
}

function closeDetailModal() {
  selectedKey.value = null;
  showDetailModal.value = false;
}

// ===== Delete ===== //
function confirmDeleteSelected() {
  if (!selectedKey.value) return;
  if (confirm(`Delete "${selectedKey.value.name}"?`)) {
    apiKeys.value = apiKeys.value.filter(
      (k) => k.id !== selectedKey.value!.id
    );
    closeDetailModal();
  }
}

// ===== Copy ===== //
async function copyGeneratedKey() {
  if (!generatedKey.value) return;
  try {
    await navigator.clipboard.writeText(generatedKey.value);
    alert("Key copied!");
  } catch {
    alert("Copy failed.");
  }
}

function closeGeneratedModal() {
  generatedKey.value = null;
  showGeneratedModal.value = false;
}
</script>

<template>
  <div class="px-8 py-10 max-w-5xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">API Keys</h1>

    <button
      class="btn btn-success mb-6 font-semibold uppercase tracking-wide"
      @click="openCreateModal"
    >
      Create New Secret Key
    </button>

    <div class="overflow-x-auto rounded-2xl shadow-sm border bg-base-100">
      <table class="table">
        <thead class="bg-base-200">
          <tr>
            <th class="text-xs font-semibold text-neutral">NAME</th>
            <th class="text-xs font-semibold text-neutral">STATUS</th>
            <th class="text-xs font-semibold text-neutral">USAGE</th>
            <th class="w-20"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="key in apiKeys"
            :key="key.id"
            class="hover:bg-base-200/60"
          >
            <td class="font-medium">{{ key.name }}</td>
            <td>
              <span
                v-if="key.status === 'active'"
                class="badge badge-success badge-outline"
              >
                Active
              </span>
              <span v-else class="badge badge-ghost">Disabled</span>
            </td>
            <td>{{ key.usage }}</td>
            <td class="text-right">
              <button
                class="btn btn-ghost btn-sm"
                @click="openDetailModal(key)"
              >
                🔍
              </button>
            </td>
          </tr>

          <tr v-if="apiKeys.length === 0">
            <td
              colspan="4"
              class="text-center text-sm text-neutral py-8"
            >
              No API keys yet. Click
              <span class="font-semibold">Create New Secret Key</span>
              to get started.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ============================= -->
  <!-- CREATE MODAL -->
  <!-- ============================= -->
  <!-- CREATE MODAL -->
    <div class="modal" :class="{ 'modal-open': showCreateModal }">
    <div class="modal-box max-w-xl">
        <h3 class="font-bold text-xl mb-4">Create API Key</h3>

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
        </div>

        <div class="mb-4">
        <p class="font-semibold mb-2">Permissions</p>
        <div class="overflow-x-auto rounded-2xl border bg-base-100">
            <table class="table">
            <thead>
                <tr>
                <th>Types</th>
                <th class="text-center">Read</th>
                <th class="text-center">Create</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="perm in createFormPermissions" :key="perm.type">
                <td class="font-medium">{{ permissionLabel[perm.type] }}</td>
                <td class="text-center">
                    <input type="checkbox" v-model="perm.read" class="checkbox checkbox-sm" />
                </td>
                <td class="text-center">
                    <input type="checkbox" v-model="perm.create" class="checkbox checkbox-sm" />
                </td>
                </tr>
            </tbody>
            </table>
        </div>
        </div>

        <div class="mb-6">
        <p class="font-semibold mb-2">Expired Date</p>
        <div class="flex gap-3">
            <input v-model="createFormExpiresDate" type="date" class="input input-bordered w-full" />
            <input v-model="createFormExpiresTime" type="time" class="input input-bordered w-full" />
        </div>
        </div>

        <div class="modal-action justify-between">
        <button class="btn btn-ghost" @click="showCreateModal = false">Close</button>
        <button class="btn btn-success" @click="handleCreateKey">Create</button>
        </div>
    </div>
    </div>

    <!-- Proper DaisyUI Backdrop -->
    <div
    v-if="showCreateModal"
    class="modal-backdrop"
    @click="showCreateModal = false"
    />

  <!-- ============================= -->
  <!-- GENERATED KEY MODAL -->
  <!-- ============================= -->
  <div class="modal" :class="{ 'modal-open': showGeneratedModal }">
    <div class="modal-box max-w-lg">
        <h3 class="font-bold text-xl mb-3">New API Key</h3>
        <p class="text-sm text-warning mb-3">
        This key will only be shown once. Please store it safely.
        </p>

        <div class="bg-base-200 rounded-xl px-4 py-3 flex items-center justify-between mb-4">
        <code class="text-sm break-all mr-3">{{ generatedKey }}</code>
        <button class="btn btn-outline btn-sm" @click="copyGeneratedKey">Copy</button>
        </div>

        <div class="modal-action justify-end">
        <button class="btn" @click="closeGeneratedModal">I have stored it</button>
        </div>
    </div>
    </div>

    <div
    v-if="showGeneratedModal"
    class="modal-backdrop"
    @click="closeGeneratedModal"
    />

  <!-- ============================= -->
  <!-- DETAIL MODAL -->
  <!-- ============================= -->
  <div class="modal" :class="{ 'modal-open': showDetailModal }">
    <div class="modal-box max-w-xl">
        <h3 class="font-bold text-xl mb-4">API Key Details</h3>

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

        <p class="font-semibold mb-2">Permissions</p>
        <div class="overflow-x-auto rounded-2xl border bg-base-100 mb-6">
            <table class="table">
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
                <td class="text-center" v-if="perm.read">✔</td>
                <td class="text-center" v-else></td>
                <td class="text-center" v-if="perm.create">✔</td>
                <td class="text-center" v-else></td>
                </tr>
            </tbody>
            </table>
        </div>
        </div>

        <div class="modal-action justify-between">
        <button class="btn btn-error btn-outline" @click="confirmDeleteSelected">
            Delete
        </button>
        <button class="btn" @click="closeDetailModal">Close</button>
        </div>
    </div>
    </div>

    <div
    v-if="showDetailModal"
    class="modal-backdrop"
    @click="closeDetailModal"
    />
  
</template>