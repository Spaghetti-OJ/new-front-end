<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
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

function openFilePicker() {
  fileInput.value?.click();
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

<template>
  <div class="flex flex-col items-center gap-8">
    <!-- 頭貼區 -->
    <div class="relative">
      <div class="avatar">
        <div
          class="h-64 w-64 overflow-hidden rounded-full bg-base-200 ring ring-base-300 ring-offset-2 ring-offset-base-100"
        >
          <!-- 有上傳頭貼則顯示圖片，否則用預設灰色底 -->
          <img
            v-if="currentAvatarUrl"
            :src="currentAvatarUrl"
            alt="altText"
            class="h-full w-full object-cover"
          />
          <div v-else class="flex h-full w-full items-center justify-center bg-base-300 text-base-content/30">
            <span class="text-sm">{{ t("profile.noImage") }}</span>
          </div>
        </div>
      </div>

      <!-- 可編輯頭貼時的 + 按鈕（右下角） -->
      <div v-if="editableAvatar" class="absolute bottom-5 right-5">
        <button
          type="button"
          class="btn btn-circle btn-primary btn-sm shadow-md"
          aria-label="Upload avatar"
          @click="openFilePicker"
        >
          +
        </button>

        <!-- 隱藏 input -->
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileSelected" />
      </div>
    </div>

    <!-- 下方按鈕 -->
    <div v-if="buttons?.length" class="mt-3 flex w-full flex-col gap-4">
      <button
        v-for="(btn, idx) in buttons"
        :key="idx"
        class="btn btn-outline w-full text-lg font-bold"
        :class="btn.variant ? `btn-${btn.variant}` : 'btn-primary'"
        @click="() => emit('click', btn.action)"
      >
        {{ btn.label }}
      </button>
    </div>
  </div>
</template>
