<script setup lang="ts">
import { computed } from "vue";

type Subtask = {
  caseCount: number | "";
  taskScore: number | "";
  memoryLimit: number | "";
  timeLimit: number | "";
};

const props = defineProps<{
  modelValue: Subtask[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: Subtask[]): void;
}>();

const tasks = computed(() => props.modelValue ?? []);

function setTasks(next: Subtask[]) {
  emit("update:modelValue", next);
}

function addSubtask() {
  setTasks([
    ...tasks.value,
    { caseCount: "", taskScore: "", memoryLimit: "", timeLimit: "" },
  ]);
}

function removeLastSubtask() {
  if (tasks.value.length === 0) return;
  setTasks(tasks.value.slice(0, -1));
}
</script>

<template>
  <div class="w-full">
    <template v-for="(task, i) in tasks" :key="i">
      <div class="mt-6">
        <div class="font-semibold mb-2">Subtask {{ i + 1 }}</div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="form-control w-full">
            <label class="label"><span class="label-text">The number of testcases</span></label>
            <input
              type="number"
              class="input input-bordered w-full"
              :value="task.caseCount"
              @input="
                setTasks([
                  ...tasks.slice(0, i),
                  { ...task, caseCount: (($event.target as HTMLInputElement).value === ''  ? '' : Number(($event.target as HTMLInputElement).value)) },
                  ...tasks.slice(i + 1),
                ])
              "
            />
          </div>

          <div class="form-control w-full">
            <label class="label"><span class="label-text">Score</span></label>
            <input
              type="number"
              class="input input-bordered w-full"
              :value="task.taskScore"
              @input="
                setTasks([
                  ...tasks.slice(0, i),
                  { ...task, taskScore: (($event.target as HTMLInputElement).value === ''  ? '' : Number(($event.target as HTMLInputElement).value)),},
                  ...tasks.slice(i + 1),
                ])
              "
            />
          </div>

          <div class="form-control w-full">
            <label class="label"><span class="label-text">Memory Limit (KB)</span></label>
            <input
              type="number"
              class="input input-bordered w-full"
              :value="task.memoryLimit"
              @input="
                setTasks([
                  ...tasks.slice(0, i),
                  { ...task, memoryLimit: (($event.target as HTMLInputElement).value === ''  ? '' : Number(($event.target as HTMLInputElement).value)) },
                  ...tasks.slice(i + 1),
                ])
              "
            />
          </div>

          <div class="form-control w-full">
            <label class="label"><span class="label-text">Time Limit (ms)</span></label>
            <input
              type="number"
              class="input input-bordered w-full"
              :value="task.timeLimit"
              @input="
                setTasks([
                  ...tasks.slice(0, i),
                  { ...task, timeLimit: (($event.target as HTMLInputElement).value === ''  ? '' : Number(($event.target as HTMLInputElement).value)) },
                  ...tasks.slice(i + 1),
                ])
              "
            />
          </div>
        </div>
      </div>
    </template>

    <div class="mt-4 flex justify-center gap-3">
      <div class="tooltip" data-tip="append new sample">
        <button type="button" class="btn btn-sm" @click="addSubtask">
          <i-uil-plus class="mr-1" />
        </button>
      </div>
      <div class="tooltip" data-tip="remove last sample">
        <button type="button" class="btn btn-sm" @click="removeLastSubtask">
          <i-uil-minus class="mr-1" />
        </button>
      </div>
    </div>
  </div>
</template>