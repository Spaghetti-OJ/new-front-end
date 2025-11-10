<!-- components/Profile/ProfileField.vue -->
<template>
  <div class="flex flex-col gap-1 w-full" :class="containerClass">
    <!-- 標籤 -->
    <label class="text-xs font-semibold tracking-wide text-base-content/80">
      {{ label }}
    </label>

    <!-- 顯示模式 -->
    <div
      v-if="!editable"
      class="rounded-xl bg-base-200 text-base-content text-lg px-3 flex items-start py-3 min-h-[48px]"
      :class="boxWidth"
    >
      {{ modelValue || '—' }}
    </div>

    <!-- 單行輸入 -->
    <input
      v-else-if="type !== 'textarea'"
      v-model="localValue"
      :type="type"
      class="input input-bordered text-lg rounded-xl bg-base-200 min-h-[48px]"
      :class="boxWidth"
      @keydown.enter.prevent="commit"
      @keydown.esc.prevent="cancel"
      @blur="commit"
    />

    <!-- 多行輸入 -->
    <textarea
      v-else
      v-model="localValue"
      class="textarea textarea-bordered text-lg rounded-xl bg-base-200"
      :class="[boxWidth, 'min-h-[160px]']"
      @keydown.enter.exact.prevent="commit"
      @keydown.shift.enter.stop
      @keydown.esc.prevent="cancel"
      @blur="commit"
    ></textarea>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: [String, Number], default: '' },
  editable: { type: Boolean, default: false },
  type: { type: String, default: 'text' }, // 'text' | 'email' | 'textarea'
  boxWidth: { type: String, default: 'w-full' }, // Tailwind 寬度 class
  containerClass: { type: String, default: '' }  // 外層額外 class（例如 col-span-2）
})

const emit = defineEmits(['update:modelValue', 'commit'])

const localValue = ref(props.modelValue ?? '')

watch(
  () => props.modelValue,
  v => {
    if (v !== localValue.value) localValue.value = v ?? ''
  }
)

function commit() {
  emit('update:modelValue', localValue.value)
  emit('commit', localValue.value)
}

function cancel() {
  localValue.value = props.modelValue ?? ''
}
</script>
