<script setup lang="ts">
import { ref, watch } from "vue";

interface ApiKey {
  id: number;
  name: string;
  status: string;
  usage: number;
}

const props = defineProps<{
  keyData: ApiKey | null; // null = create mode
}>();

const emit = defineEmits(["close", "save", "create", "delete"]);

// ----------------------
// Radio toggle system
// ----------------------
const permissionState = ref<Record<string, string | null>>({
  Submissions: null,
  Courses: null,
  Homeworks: null,
  Announcements: null,
});

const permissions = ["Submissions", "Courses", "Homeworks", "Announcements"];
const actions = ["Read", "Create", "Edit"];

// toggle function
function togglePermission(type: string, action: string) {
  permissionState.value[type] = permissionState.value[type] === action ? null : action;
}

// ----------------------
// Expired date + time
// ----------------------
const date = ref("");
const time = ref("");

// ----------------------
// Save / Create actions
// ----------------------
function onSave() {
  emit("save", {
    permissions: permissionState.value,
    expired_at: date.value + " " + time.value,
  });
}

function onCreate() {
  emit("create", {
    permissions: permissionState.value,
    expired_at: date.value + " " + time.value,
  });
}

function onDelete() {
  emit("delete");
}
</script>

<template>
  <div class="modal modal-open">
    <div class="modal-box max-w-2xl bg-base-200">
      <h2 class="mb-4 text-xl font-semibold">
        {{ props.keyData ? "Edit API Key" : "Create API Key" }}
      </h2>

      <!-- Permissions -->
      <h3 class="mb-2 font-semibold">Permissions</h3>

      <div class="mb-6 overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>TYPES</th>
              <th class="text-center">PERMISSIONS</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="type in permissions" :key="type">
              <td>{{ type }}</td>

              <td class="flex justify-center gap-6">
                <label v-for="action in actions" :key="action" class="flex cursor-pointer items-center gap-1">
                  <input
                    type="checkbox"
                    class="checkbox"
                    :checked="permissionState[type] === action"
                    @change="togglePermission(type, action)"
                  />
                  {{ action }}
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Expired Date -->
      <h3 class="mb-2 font-semibold">Expired Date</h3>

      <div class="mb-6 flex items-center gap-4">
        <input v-model="date" type="date" class="input input-bordered" />
        <input v-model="time" type="time" class="input input-bordered" />
      </div>

      <!-- BUTTONS -->
      <div class="mt-6 flex items-center justify-between">
        <!-- Delete only in edit mode -->
        <button v-if="props.keyData" class="btn btn-error" @click="onDelete">Delete API Key</button>

        <div class="ml-auto flex gap-3">
          <button class="btn" @click="emit('close')">Close</button>

          <!-- Save / Create -->
          <button v-if="props.keyData" class="btn btn-primary" @click="onSave">Save</button>

          <button v-else class="btn btn-success" @click="onCreate">Create</button>
        </div>
      </div>
    </div>
  </div>
</template>
