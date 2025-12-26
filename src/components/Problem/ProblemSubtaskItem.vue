<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  modelValue: ProblemTestCase;
  index: number;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: ProblemTestCase): void;
}>();

const { t } = useI18n();

const task = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

function updateField<K extends keyof ProblemTestCase>(key: K, value: string | number) {
  emit("update:modelValue", {
    ...props.modelValue,
    [key]: Number(value),
  });
}
</script>

<template>
  <div class="col-span-2">
    <div class="mt-2 font-semibold">{{ t("components.problem.forms.subtask", { no: index + 1 }) }}</div>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div class="form-control w-full">
        <label class="label">
          <span class="label-text">{{ t("components.problem.forms.numOfCases") }}</span>
        </label>
        <input type="text" class="input input-bordered w-full max-w-xs" :value="task.caseCount" readonly />
      </div>

      <div class="form-control w-full">
        <label class="label">
          <span class="label-text">{{ t("components.problem.forms.score") }}</span>
        </label>
        <input
          type="text"
          class="input input-bordered w-full max-w-xs"
          :value="task.taskScore"
          @input="updateField('taskScore', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <div class="form-control w-full">
        <label class="label">
          <span class="label-text">{{ t("components.problem.forms.memoryLimit") }}</span>
        </label>
        <input
          type="text"
          class="input input-bordered w-full max-w-xs"
          :value="task.memoryLimit"
          @input="updateField('memoryLimit', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <div class="form-control w-full">
        <label class="label">
          <span class="label-text">{{ t("components.problem.forms.timeLimit") }}</span>
        </label>
        <input
          type="text"
          class="input input-bordered w-full max-w-xs"
          :value="task.timeLimit"
          @input="updateField('timeLimit', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>
  </div>
</template>
