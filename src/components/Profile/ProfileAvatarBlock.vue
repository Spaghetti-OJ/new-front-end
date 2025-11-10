<template>
  <div class="flex flex-col items-center gap-8">
    <!-- 頭貼區 -->
    <div class="relative">
      <div class="avatar">
        <div class="w-64 h-64 rounded-full ring ring-base-300 ring-offset-base-100 ring-offset-2 overflow-hidden bg-base-200">
          <!-- 有上傳頭貼則顯示圖片，否則用預設灰色底 -->
          <img
            v-if="currentAvatarUrl"
            :src="currentAvatarUrl"
            :alt="altText"
            class="object-cover w-full h-full"
          />
          <div
            v-else
            class="flex items-center justify-center w-full h-full bg-base-300 text-base-content/30"
          >
            <span class="text-sm">No Image</span>
          </div>
        </div>
      </div>

      <!-- 可編輯頭貼時的 + 按鈕（右下角） -->
      <div v-if="editableAvatar" class="absolute bottom-5 right-5">
        <div class="dropdown dropdown-end">
          <label tabindex="0" class="btn btn-circle btn-sm btn-primary shadow-md">
            +
          </label>

          <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40 mt-2">
            <li>
              <button type="button" @click="openFilePicker('file')">
                上傳檔案
              </button>
            </li>
            <li>
              <button type="button" @click="openFilePicker('camera')">
                使用相機 / 裝置
              </button>
            </li>
          </ul>
        </div>

        <!-- 隱藏 input -->
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onFileSelected"
        />
        <input
          ref="cameraInput"
          type="file"
          accept="image/*"
          capture="environment"
          class="hidden"
          @change="onFileSelected"
        />
      </div>
    </div>

    <!-- 下方按鈕 -->
    <div v-if="buttons?.length" class="flex flex-col w-full gap-4 mt-3">
      <button
        v-for="(btn, idx) in buttons"
        :key="idx"
        class="btn btn-outline font-bold w-full text-lg"
        :class="[
            btn.variant === 'primary' ? 'btn-primary' :
            btn.variant === 'error' ? 'btn-error' :
            btn.variant === 'secondary' ? 'btn-secondary' :
            btn.variant ? `btn-${btn.variant}` : 'btn-primary'
        ]"
        @click="() => emit('click', btn.action)"
        >
        {{ btn.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  avatarUrl: {
    type: String,
    default: ''
  },
  editableAvatar: {
    type: Boolean,
    default: false
  },
  buttons: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['click', 'upload'])

/* 頭貼預覽用 URL */
const currentAvatarUrl = ref(props.avatarUrl)
watch(
  () => props.avatarUrl,
  (val) => {
    currentAvatarUrl.value = val || ''
  }
)

/* 上傳相關 */
const fileInput = ref(null)
const cameraInput = ref(null)

function openFilePicker(type) {
  if (type === 'file') fileInput.value?.click()
  else if (type === 'camera') cameraInput.value?.click()
}

function onFileSelected(e) {
  const input = e.target
  const file = input.files?.[0]
  if (!file) return

  const url = URL.createObjectURL(file)
  currentAvatarUrl.value = url
  emit('upload', file) // 之後給外面串 API 用

  input.value = ''
}
</script>