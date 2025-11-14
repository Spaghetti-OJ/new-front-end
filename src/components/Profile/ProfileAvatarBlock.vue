<template>
  <div class="flex flex-col items-center gap-8">
    <!-- 頭貼區 -->
    <div class="relative">
      <div class="avatar">
        <div
          class="h-64 w-64 overflow-hidden rounded-full bg-base-200 ring ring-base-300 ring-offset-2 ring-offset-base-100">
          <!-- 有上傳頭貼則顯示圖片，否則用預設灰色底 -->
          <img v-if="currentAvatarUrl" :src="currentAvatarUrl" alt="altText" class="h-full w-full object-cover" />
          <div v-else class="flex h-full w-full items-center justify-center bg-base-300 text-base-content/30">
            <span class="text-sm">No Image</span>
          </div>
        </div>
      </div>

      <!-- 可編輯頭貼時的 + 按鈕（右下角） -->
      <div v-if="editableAvatar" class="absolute bottom-5 right-5">
        <div class="dropdown dropdown-end">
          <label tabindex="0" class="btn btn-circle btn-primary btn-sm shadow-md" aria-label="Upload avatar options"> + </label>

          <ul tabindex="0" class="dropdown-content menu rounded-box mt-2 w-40 bg-base-100 p-2 shadow">
            <li>
              <button type="button" @click="openFilePicker('file')">上傳檔案</button>
            </li>
            <li>
              <button type="button" @click="openFilePicker('camera')">使用相機 / 裝置</button>
            </li>
          </ul>
        </div>

        <!-- 隱藏 input -->
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileSelected" />
        <input ref="cameraInput" type="file" accept="image/*" capture="environment" class="hidden"
          @change="onFileSelected" />
      </div>
    </div>

    <!-- 下方按鈕 -->
    <div v-if="buttons?.length" class="mt-3 flex w-full flex-col gap-4">
      <button v-for="(btn, idx) in buttons" :key="idx" class="btn btn-outline w-full text-lg font-bold" :class="[
        btn.variant === 'primary'
          ? 'btn-primary'
          : btn.variant === 'error'
            ? 'btn-error'
            : btn.variant === 'secondary'
              ? 'btn-secondary'
              : btn.variant
                ? `btn-${btn.variant}`
                : 'btn-primary',
      ]" @click="() => emit('click', btn.action)">
        {{ btn.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  avatarUrl: {
    type: String,
    default: "",
  },
  editableAvatar: {
    type: Boolean,
    default: false,
  },
  buttons: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["click", "upload"]);

/* 頭貼預覽用 URL */
const currentAvatarUrl = ref(props.avatarUrl);
watch(
  () => props.avatarUrl,
  (val) => {
    currentAvatarUrl.value = val || "";
  },
);

/* 上傳相關 */
const fileInput = ref(null);
const cameraInput = ref(null);

function openFilePicker(type) {
  if (type === "file") fileInput.value?.click();
  else if (type === "camera") cameraInput.value?.click();
}

function onFileSelected(e) {
  const input = e.target;
  const file = input.files?.[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  currentAvatarUrl.value = url;
  emit("upload", file); // 之後給外面串 API 用

  input.value = "";
}
</script>
