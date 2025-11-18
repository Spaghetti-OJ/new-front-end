<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: [String, Number], default: "" },
  editable: { type: Boolean, default: false },
  type: { type: String, default: "text" }, // 'text' | 'email' | 'textarea'
  boxWidth: { type: String, default: "w-full" }, // Tailwind 寬度 class
  containerClass: { type: String, default: "" }, // 外層額外 class（例如 col-span-2）
});

const emit = defineEmits(["update:modelValue", "commit"]);

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const textareaHeight = ref<string>("auto");
const localValue = ref(props.modelValue ?? "");

watch(
  () => props.modelValue,
  (v) => {
    if (v !== localValue.value) localValue.value = v ?? "";
    nextTick(autoResize);
  },
);

watch(
  localValue,
  () => {
    nextTick(autoResize);
  },
  { flush: "post" },
);

watch(
  () => props.editable,
  (isEditable) => {
    if (isEditable && props.type === "textarea") {
      nextTick(autoResize);
    }
  },
  { immediate: true },
);

function commit() {
  emit("update:modelValue", localValue.value);
  emit("commit", localValue.value);
}

function cancel() {
  localValue.value = props.modelValue ?? "";
}

onMounted(() => {
  nextTick(autoResize);
});

function autoResize() {
  if (!textareaRef.value || props.type !== "textarea" || !props.editable) return;
  const el = textareaRef.value;
  el.style.height = "auto";
  const newHeight = `${el.scrollHeight}px`;
  el.style.height = newHeight;
  textareaHeight.value = newHeight;
}
</script>

<template>
  <div class="flex w-full flex-col gap-1 !text-left" :class="containerClass">
    <!-- 標籤 -->
    <label class="text-xs font-semibold tracking-wide text-base-content/80">
      {{ label }}
    </label>

    <!-- 顯示模式：一般欄位（非 textarea） -->
    <div
      v-if="!editable && type !== 'textarea'"
      class="h-[48px] rounded-xl bg-base-200 px-3 py-3 !text-left text-lg text-base-content"
      :class="boxWidth"
    >
      {{ modelValue || "—" }}
    </div>

    <!-- 顯示模式：textarea（例如 INTRODUCTION） -->
    <div
      v-else-if="!editable && type === 'textarea'"
      class="flex min-h-[100px] items-start whitespace-pre-wrap rounded-xl bg-base-200 px-3 py-3 text-lg text-base-content"
      :class="boxWidth"
    >
      {{ modelValue || "—" }}
    </div>

    <!-- 單行輸入 -->
    <input
      v-else-if="type !== 'textarea'"
      v-model="localValue"
      :type="type"
      class="input input-bordered h-[48px] rounded-xl bg-base-200 text-lg"
      :class="boxWidth"
      @keydown.enter.prevent="commit"
      @keydown.esc.prevent="cancel"
      @blur="commit"
    />

    <!-- 多行輸入 -->
    <textarea
      v-else
      ref="textareaRef"
      v-model="localValue"
      class="textarea textarea-bordered rounded-xl bg-base-200 text-lg"
      :class="[boxWidth, 'min-h-[48px] resize-none overflow-hidden']"
      :style="{ height: textareaHeight }"
      rows="1"
      @input="autoResize"
      @keydown.enter.exact.prevent="commit"
      @keydown.shift.enter.stop
      @keydown.esc.prevent="cancel"
      @blur="commit"
    ></textarea>
  </div>
</template>
