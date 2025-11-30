<script setup lang="ts">
import ApiKeyTable from "@/components/ApiKeys/ApiKeyTable.vue";
import ApiKeyEditModal from "@/components/ApiKeys/ApiKeyEditModal.vue";
import { ref } from "vue";

interface ApiKey {
  id: number;
  name: string;
  status: string;
  usage: number;
}

const showModal = ref(false);
const selectedKey = ref<ApiKey | null>(null);

function openEditModal(key: ApiKey) {
  selectedKey.value = key;
  showModal.value = true;
}
function openCreateModal() {
  selectedKey.value = null; // new mode
  showModal.value = true;
}
</script>

<template>
  <div class="mx-auto w-full max-w-5xl space-y-8 p-6">
    <h1 class="text-3xl font-bold">API Keys</h1>

    <!-- Create New Key Button -->
    <button class="btn btn-success mb-4" @click="openCreateModal">CREATE NEW SECRET KEY</button>

    <!-- API Key Table -->
    <ApiKeyTable @edit="openEditModal" />

    <!-- Edit Modal -->
    <ApiKeyEditModal v-if="showModal" :key-data="selectedKey" @close="showModal = false" />
  </div>
</template>
