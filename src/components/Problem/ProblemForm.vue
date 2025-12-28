<script setup lang="ts">
import { ref, watch, inject, Ref, watchEffect, onMounted, onBeforeUnmount, computed } from "vue";
import useVuelidate from "@vuelidate/core";
import { required, maxLength, minValue, between, helpers } from "@vuelidate/validators";
import { ZipReader, BlobReader } from "@zip.js/zip.js";

import ProblemFormComponent from "@/components/Problem/ProblemForm.vue";
import ProblemSubtaskItem from "@/components/Problem/ProblemSubtaskItem.vue";

// TODO: handling error when `problem` or `problem.value` is undefined
// This component only renders when `problem` is not undefined
const problem = inject<Ref<ProblemForm>>("problem") as Ref<ProblemForm>;
type GeneratedCase = {
  input: string;
  output: string;
};
const props = defineProps<{
  testdata: File | null;
  generatedCases: GeneratedCase[];
  isGenerating: boolean;
  checker: File | null;
}>();
const isLoading = ref(false);
const errorMsg = ref("");
const contentSection = ref<HTMLElement | null>(null);
const testdataSection = ref<HTMLElement | null>(null);
const checkerSection = ref<HTMLElement | null>(null);
defineExpose({ isLoading, errorMsg, contentSection, testdataSection, checkerSection });
const emits = defineEmits<{
  (e: "update", key: keyof ProblemForm, value: ProblemForm[typeof key]): void;
  (e: "update:testdata", value: File | null): void;
  (e: "submit"): void;
  (e: "save-solution"): void;
  (e: "generate", payload: GeneratePayload): void;
  (e: "update:checker", value: File | null): void;
}>();
const hasForbidFunctions = computed(() => (problem.value.staticAnalysis ?? []).includes("forbid-functions"));

const forbidFnInput = ref(""); // 輸入框用
const forbidFnError = ref("");
const fnNameRegex = /^[A-Za-z_][A-Za-z0-9_]*$/;

function addForbidFunction() {
  const v = forbidFnInput.value.trim();
  if (!v) return;

  if (!fnNameRegex.test(v)) {
    forbidFnError.value = "Invalid function name (e.g., foo, my_func, printf)";
    return;
  }

  forbidFnError.value = "";
  const cur = problem.value.forbidFunctions ?? [];
  if (!cur.includes(v)) update("forbidFunctions", [...cur, v]);

  forbidFnInput.value = "";
}

function removeForbidFunction(name: string) {
  const cur = problem.value.forbidFunctions ?? [];
  update(
    "forbidFunctions",
    cur.filter((x) => x !== name),
  );
}
const rules = {
  problemName: { required, maxLength: maxLength(64) },
  description: {
    description: { maxLength: maxLength(10000) },
    input: { maxLength: maxLength(10000) },
    output: { maxLength: maxLength(10000) },
    hint: { maxLength: maxLength(10000) },
    sampleInput: {
      itemMaxLength: helpers.withMessage("The length of each sample input should <= 1024", (v: string[]) =>
        v.every((d) => d.length <= 1024),
      ),
    },
    sampleOutput: {
      itemMaxLength: helpers.withMessage("The length of each sample input should <= 1024", (v: string[]) =>
        v.every((d) => d.length <= 1024),
      ),
    },
  },
  courses: {},
  tags: { itemMaxLength: (v: string[]) => v.every((d) => d.length <= 16) },
  allowedLanguage: { required, between: between(1, 7) },
  quota: { required, minValue: minValue(-1) },
  type: {},
  status: {},
  testCaseInfo: {
    tasks: {
      scoreSum: helpers.withMessage(
        "The sum of all subtasks score should be 100",
        (tasks: ProblemTestCase[]) => {
          return tasks.reduce((acc: number, cur: ProblemTestCase) => acc + cur.taskScore, 0) === 100;
        },
      ),
    },
  },
  canViewStdout: {},
  defaultCode: {},
  solution: { maxLength: maxLength(20000) },
  staticAnalysis: {},
  allowedDomains: {},
  forbidFunctions: {
    requiredWhenEnabled: helpers.withMessage(
      "Please provide at least one forbidden function.",
      (v: string[]) => {
        const enabled = (problem.value.staticAnalysis ?? []).includes("forbid-functions");
        return !enabled || (Array.isArray(v) && v.length > 0);
      },
    ),
  },
};
const v$ = useVuelidate(rules, problem.value);

function update(key: keyof ProblemForm, value: ProblemForm[typeof key]) {
  emits("update", key, value);
  v$.value[key].$touch();
}

async function submit() {
  const isFormCorrect = await v$.value.$validate();
  if (isFormCorrect) {
    emits("submit");
  }
}

const llmMode = ref<LlmMode>("");

type TestdataMode = "uploadfile" | "LLMgenerate" | null;
const testdataMode = ref<TestdataMode>(null);
const isDrag = ref(false);
const isCheckerDrag = ref(false);
watch(
  () => props.testdata,
  () => {
    isDrag.value = false;
    if (!props.testdata) {
      update("testCaseInfo", { ...problem.value.testCaseInfo, tasks: [] });
      return;
    }
    const reader = new ZipReader(new BlobReader(props.testdata));
    reader.getEntries().then((entries) => {
      const filenames = entries.map(({ filename }) => filename);
      const inputs = filenames.filter((filename) => filename.endsWith(".in"));
      const outputs = filenames.filter((filename) => filename.endsWith(".out"));
      if (inputs.length !== outputs.length) {
        alert(`Input and output files are not matched. (got ${inputs.length} .in, ${outputs.length} .out)`);
        emits("update:testdata", null);
        return;
      }
      let i = 0;
      const testCase = [];
      while (true) {
        const caseCount = inputs.filter((filename) => filename.startsWith(`0${i}`.slice(-2))).length;
        if (caseCount > 0) {
          testCase.push({ caseCount, memoryLimit: 134218, taskScore: 0, timeLimit: 1000 });
          i++;
        } else {
          break;
        }
      }
      if (testCase.length > 0) {
        update("testCaseInfo", { ...problem.value.testCaseInfo, tasks: testCase });
      } else {
        alert("No Test Data found in the zip file! (壓縮檔內只需要測資文字檔，不需要資料夾)");
      }
    });
  },
);

watch(testdataMode, (mode) => {
  if (mode === "uploadfile" && !props.testdata) {
    update("testCaseInfo", {
      ...problem.value.testCaseInfo,
      tasks: [],
    });
    v$.value.testCaseInfo?.tasks?.$reset?.();
  } else if (mode === "LLMgenerate" && problem.value.testCaseInfo.tasks.length === 0) {
    update("testCaseInfo", {
      ...problem.value.testCaseInfo,
      tasks: [{ caseCount: 1, taskScore: 100, memoryLimit: 134218, timeLimit: 1000 }],
    });
  }
});

function addSubtask() {
  update("testCaseInfo", {
    ...problem.value.testCaseInfo,
    tasks: [
      ...problem.value.testCaseInfo.tasks,
      { caseCount: 0, taskScore: 0, memoryLimit: 0, timeLimit: 0 },
    ],
  });
}
function removeLastSubtask() {
  const tasks = problem.value.testCaseInfo.tasks ?? [];
  if (tasks.length === 0) return;

  update("testCaseInfo", {
    ...problem.value.testCaseInfo,
    tasks: tasks.slice(0, -1),
  });
}

function updateSubtask(index: number, newTask: ProblemTestCase) {
  const currentTasks = problem.value.testCaseInfo.tasks;
  update("testCaseInfo", {
    ...problem.value.testCaseInfo,
    tasks: [...currentTasks.slice(0, index), newTask, ...currentTasks.slice(index + 1)],
  });
}

const staticAnalysisOptions = [
  { label: "forbid-functions", value: "forbid-functions" },
  { label: "forbid-stl", value: "forbid-stl" },
  { label: "forbid-loops", value: "forbid-loops" },
  { label: "forbid-arrays", value: "forbid-arrays" },
];
const staticAnalysisSummary = computed(() => {
  const picked = problem.value.staticAnalysis?.filter(Boolean) ?? [];
  return picked.length ? picked.join(", ") : "Select analysis rules";
});
const toggleStaticAnalysis = (value: string) => {
  const set = new Set(problem.value.staticAnalysis ?? []);

  if (set.has(value)) set.delete(value);
  else set.add(value);

  const order = new Map(staticAnalysisOptions.map((o, i) => [o.value, i]));
  update(
    "staticAnalysis",
    Array.from(set).sort((a, b) => (order.get(a) ?? 1e9) - (order.get(b) ?? 1e9)),
  );
};

// 點外面關閉 dropdown
const staticDropdownRef = ref<HTMLDetailsElement | null>(null);
const onDocClick = (e: MouseEvent) => {
  const el = staticDropdownRef.value;
  if (!el) return;
  if (!el.contains(e.target as Node)) el.removeAttribute("open");
};
onMounted(() => document.addEventListener("click", onDocClick));
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));

const domainInput = ref("");
const domainError = ref("");
const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;

const addDomain = () => {
  const v = domainInput.value.trim();
  if (!v) return;

  if (!domainRegex.test(v)) {
    domainError.value = "Invalid domain format (e.g., example.com)";
    return;
  }
  domainError.value = "";

  const currentDomains = problem.value.allowedDomains ?? [];
  if (!currentDomains.includes(v)) {
    update("allowedDomains", [...currentDomains, v]);
  }

  domainInput.value = "";
};

const removeDomain = (d: string) => {
  const currentDomains = problem.value.allowedDomains ?? [];
  update(
    "allowedDomains",
    currentDomains.filter((x) => x !== d),
  );
};
</script>

<template>
  <div v-if="errorMsg" class="alert alert-error shadow-lg">
    <div>
      <i-uil-times-circle />
      <span>{{ errorMsg }}</span>
    </div>
  </div>
  <div ref="contentSection" class="grid scroll-mt-32 grid-cols-2 gap-y-4">
    <div class="form-control w-full max-w-xs">
      <label class="label">
        <span class="label-text">{{ $t("components.problem.forms.nameField") }}</span>
      </label>
      <input
        type="text"
        :class="['input input-bordered w-full max-w-xs', v$.problemName.$error && 'input-error']"
        :value="problem.problemName"
        @input="update('problemName', ($event.target as HTMLInputElement).value)"
      />
      <label class="label" v-show="v$.problemName.$error">
        <span class="label-text-alt text-error" v-text="v$.problemName.$errors[0]?.$message" />
      </label>
    </div>

    <div class="form-control">
      <label class="label cursor-pointer justify-start gap-x-4">
        <span class="label-text">{{ $t("components.problem.forms.hiddenToggle") }}</span>
        <input
          type="checkbox"
          class="toggle toggle-success"
          :value="problem.status"
          :checked="problem.status === 1"
          @change="update('status', (problem.status ^ 1) as 0 | 1)"
        />
      </label>
    </div>

    <div class="form-control w-full max-w-xs">
      <label class="label">
        <span class="label-text">{{ $t("components.problem.forms.quotaField") }}</span>
      </label>
      <input
        type="text"
        :class="['input input-bordered w-full max-w-xs', v$.quota.$error && 'input-error']"
        :value="problem.quota"
        @input="update('quota', Number(($event.target as HTMLInputElement).value))"
      />
      <label class="label">
        <span class="label-text-alt">
          {{ v$.quota.$error ? v$.quota.$errors[0]?.$message : $t("components.problem.forms.quotaHint") }}
        </span>
      </label>
    </div>

    <div class="form-control w-full max-w-xs">
      <label class="label">
        <span class="label-text">{{ $t("components.problem.forms.tags") }}</span>
      </label>
      <input
        type="text"
        :class="['input input-bordered w-full max-w-xs', v$.tags.$error && 'input-error']"
        :value="problem.tags.join(',')"
        @input="update('tags', ($event.target as HTMLInputElement).value.split(','))"
      />
      <label class="label">
        <span class="label-text-alt">
          {{ v$.tags.$error ? v$.tags.$errors[0]?.$message : $t("components.problem.forms.tagsHint") }}
        </span>
      </label>
    </div>

    <div class="form-control w-full max-w-xs">
      <label class="label">
        <span class="label-text">{{ $t("components.problem.forms.type") }}</span>
      </label>
      <select
        class="select select-bordered w-full max-w-xs"
        :value="problem.type"
        @input="update('type', Number(($event.target as HTMLSelectElement).value) as 0 | 1 | 2)"
      >
        <option value="0">Programming</option>
        <option value="2">File Upload</option>
      </select>
    </div>

    <div class="form-control w-full max-w-xs">
      <label class="label">
        <span class="label-text">{{ $t("components.problem.forms.allowedLangs") }}</span>
      </label>
      <language-multi-select
        :model-value="problem.allowedLanguage"
        @update:model-value="(newValue) => update('allowedLanguage', newValue)"
      />
      <label class="label" v-show="v$.allowedLanguage.$error">
        <span class="label-text-alt text-error" v-text="v$.allowedLanguage.$errors[0]?.$message" />
      </label>
    </div>

    <ProblemDescriptionForm :v$="v$" @update="(...args) => update(...args)" />

    <div class="form-control col-span-2">
      <label class="label flex-col items-start gap-1">
        <span class="text-base font-semibold">Solution</span>
        <span class="text-sm text-base-content/70">
          Please upload the correct solution for student reference.<!--待修改-->
        </span>
      </label>

      <!-- 用 code-editor 輸入 -->
      <div class="w-1/2">
        <!-- 內層：左右排，底部對齊 -->
        <div class="flex items-end gap-4">
          <!-- Editor -->
          <div class="flex-1">
            <code-editor v-model="problem.solution" />
          </div>

          <!-- Save 按鈕 -->
          <button class="btn btn-sm shrink-0 bg-[#02305f] normal-case" @click="$emit('save-solution')">
            Save Solution
          </button>
        </div>
      </div>
      <div class="divider mb-0 mt-8" />
    </div>

    <template v-if="problem.type !== 2">
      <section ref="testdataSection" class="col-span-2 scroll-mt-32">
        <label class="label flex items-start gap-1">
          <span class="text-base font-semibold">Testdata</span>
        </label>

        <!-- Buttons -->
        <div class="mt-2 flex gap-3">
          <button
            type="button"
            class="btn btn-sm bg-[#02305f] normal-case"
            @click="testdataMode = 'LLMgenerate'"
          >
            LLM generate testcase
          </button>

          <button
            type="button"
            class="btn btn-sm bg-[#02305f] normal-case"
            @click="testdataMode = 'uploadfile'"
          >
            Upload testcase
          </button>
        </div>

        <div v-if="testdataMode === 'uploadfile'" class="mt-2">
          <label class="label mt-4 justify-start">
            <label for="testdata-description" class="modal-button btn btn-xs">{{
              $t("components.problem.forms.howToPack")
            }}</label>
          </label>

          <div
            :class="['textarea textarea-bordered w-full p-4', isDrag ? 'border-accent' : '']"
            @drop.prevent="$emit('update:testdata', $event.dataTransfer!.files![0])"
            @dragover.prevent="isDrag = true"
            @dragleave="isDrag = false"
          >
            <template v-if="!testdata">
              <span class="mb-6 mr-6 text-sm">{{ $t("components.problem.forms.dropFile") }}</span>
              <input
                type="file"
                id="file-uploader"
                accept=".zip"
                @change="$emit('update:testdata', ($event.target as HTMLInputElement).files![0])"
              />
            </template>
            <template v-else>
              <div class="flex">
                <span class="mr-3">{{ testdata.name }}</span>
                <button class="btn btn-sm" @click="$emit('update:testdata', null)">
                  <i-uil-times />
                </button>
              </div>
            </template>
          </div>

          <label
            class="label text-error"
            v-show="v$.testCaseInfo.tasks.$error"
            v-text="v$.testCaseInfo.tasks.$errors[0]?.$message"
          />
          <template v-for="(task, i) in problem.testCaseInfo.tasks" :key="i">
            <problem-subtask-item
              :model-value="task"
              :index="i"
              @update:model-value="updateSubtask(i, $event)"
            />
          </template>
        </div>

        <div v-if="testdataMode === 'LLMgenerate'" class="mt-2">
          <div class="mt-4 flex gap-4">
            <div class="text-lg font-semibold">AI generate testdata</div>

            <button
              type="button"
              class="btn btn-success btn-sm"
              :disabled="!llmMode"
              @click="emits('generate', { llmMode })"
            >
              GENERATE
            </button>
          </div>

          <p class="mb-3 mt-2 text-sm opacity-70">
            LLM will generate test cases that refer to your solution and description. AI may generate error
            output. Please double-check before you publish the problem.
          </p>

          <p class="mt-2 text-base font-semibold">Mode</p>

          <select
            v-model="llmMode"
            class="select select-bordered mb-3 mt-2 w-full max-w-xl px-3 py-1 text-sm"
          >
            <option disabled value="">Please select mode</option>
            <option value="LLM_INPUT_ONLY">LLM_INPUT_ONLY (LLM 只生 input + output 用正解跑)</option>
            <option value="LLM_DIRECT">LLM_DIRECT (LLM 直接生 input + output，不依賴正解)</option>
          </select>

          <label
            class="label text-error"
            v-show="v$.testCaseInfo.tasks.$error"
            v-text="v$.testCaseInfo.tasks.$errors[0]?.$message"
          />
          <template v-for="(task, i) in problem.testCaseInfo.tasks" :key="i">
            <problem-subtask-item
              :model-value="task"
              :index="i"
              @update:model-value="updateSubtask(i, $event)"
            />
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

          <!-- Generate Result -->
          <div v-if="isGenerating || generatedCases.length > 0" class="mt-6">
            <div class="mb-3 text-lg font-semibold">Generate Result</div>

            <!-- 先只顯示你剛剛輸入的 subtasks（沿用同一份 tasks） -->
            <template v-for="(task, i) in problem.testCaseInfo.tasks" :key="i">
              <div class="mb-4">
                <div class="mb-2 font-semibold">Subtask {{ i + 1 }}</div>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div class="form-control w-full">
                    <label class="label"><span class="label-text">The number of testcases</span></label>
                    <input class="input input-bordered w-full" :value="task.caseCount" readonly />
                  </div>

                  <div class="form-control w-full">
                    <label class="label"><span class="label-text">Score</span></label>
                    <input class="input input-bordered w-full" :value="task.taskScore" readonly />
                  </div>

                  <div class="form-control w-full">
                    <label class="label"><span class="label-text">Memory Limit (KB)</span></label>
                    <input class="input input-bordered w-full" :value="task.memoryLimit" readonly />
                  </div>

                  <div class="form-control w-full">
                    <label class="label"><span class="label-text">Time Limit (ms)</span></label>
                    <input class="input input-bordered w-full" :value="task.timeLimit" readonly />
                  </div>
                </div>
              </div>
            </template>

            <div class="overflow-x-auto">
              <table class="table-sm table w-full">
                <thead class="bg-base-200">
                  <tr>
                    <th class="w-16">#</th>
                    <th>input</th>
                    <th>output</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="(c, idx) in generatedCases" :key="idx">
                    <td>{{ idx + 1 }}</td>

                    <td class="align-top">
                      <pre class="max-h-48 overflow-auto whitespace-pre-wrap break-words">{{ c.input }}</pre>
                    </td>

                    <td class="align-top">
                      <pre class="max-h-48 overflow-auto whitespace-pre-wrap break-words">{{ c.output }}</pre>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <div class="divider col-span-2 mb-0" />

      <section ref="checkerSection" class="col-span-2 scroll-mt-32">
        <label class="label flex-col items-start gap-1">
          <div class="item-start flex justify-start gap-2">
            <span class="text-base font-semibold">Checker</span>
            <label for="testdata-description" class="modal-button btn btn-xs">
              {{ $t("components.problem.forms.whatischecker") }}</label
            >
          </div>

          <span class="mt-2 text-sm text-base-content/70">
            If teacher do not upload checker file, system will check submission refer to teacher's testdata.<!--待修改-->
          </span>
        </label>

        <div
          class="textarea textarea-bordered w-full p-4"
          :class="isCheckerDrag ? 'border-accent' : ''"
          @drop.prevent="$emit('update:checker', $event.dataTransfer!.files![0])"
          @dragover.prevent="isCheckerDrag = true"
          @dragleave="isCheckerDrag = false"
        >
          <template v-if="!checker">
            <span class="mb-6 mr-6 text-sm">
              {{ $t("components.problem.forms.dropChecker") }}
            </span>
            <input
              type="file"
              accept=".zip"
              @change="$emit('update:checker', ($event.target as HTMLInputElement).files![0])"
            />
          </template>

          <template v-else>
            <div class="flex items-center">
              <span class="mr-3">{{ checker.name }}</span>
              <button class="btn btn-sm" @click="$emit('update:checker', null)">
                <i-uil-times />
              </button>
            </div>
          </template>
        </div>

        <div class="form-control mt-2 w-1/2">
          <label class="label">
            <span class="label-text font-semibold">Static program analysis</span>
          </label>

          <details ref="staticDropdownRef" class="dropdown w-full">
            <summary
              class="input input-bordered flex cursor-pointer items-center justify-between normal-case"
            >
              <span class="truncate text-sm">
                {{ staticAnalysisSummary }}
              </span>
              <span class="ml-2 opacity-60">▾</span>
            </summary>

            <div
              class="dropdown-content z-[50] mt-1 w-full rounded-md border border-base-300 bg-base-100 p-1 shadow"
            >
              <label
                v-for="opt in staticAnalysisOptions"
                :key="opt.value"
                class="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-base-200"
                @click.stop
              >
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm"
                  :checked="problem.staticAnalysis?.includes(opt.value)"
                  @change="toggleStaticAnalysis(opt.value)"
                />
                <span class="text-sm">{{ opt.label }}</span>
              </label>
            </div>
          </details>
        </div>
        <!-- 勾選 forbid-functions 才顯示 -->
        <div v-if="hasForbidFunctions" class="form-control mt-4 w-1/2">
          <label class="label">
            <span class="label-text font-semibold">Forbidden functions</span>
          </label>

          <!-- 已新增的 function -->
          <div v-if="problem.forbidFunctions?.length" class="mt-2 flex flex-wrap gap-2">
            <div
              v-for="fn in problem.forbidFunctions"
              :key="fn"
              class="flex items-center gap-1 rounded-md border border-base-300 bg-base-100 px-3 py-1 text-sm"
            >
              <span>{{ fn }}</span>
              <button type="button" class="btn btn-ghost btn-xs" @click="removeForbidFunction(fn)">
                <i-uil-times />
              </button>
            </div>
          </div>

          <!-- 輸入 -->
          <div class="mt-2 flex flex-col gap-1">
            <div class="flex gap-3">
              <input
                v-model="forbidFnInput"
                type="text"
                :class="['input input-bordered w-full', forbidFnError && 'input-error']"
                placeholder="e.g., scanf"
                @keydown.enter.prevent="addForbidFunction"
                @input="forbidFnError = ''"
              />
              <button
                type="button"
                :class="['btn btn-success', !forbidFnInput.trim() && 'btn-disabled']"
                @click="addForbidFunction"
              >
                ADD
              </button>
            </div>
            <span v-if="forbidFnError" class="text-xs text-error">{{ forbidFnError }}</span>
            <span class="text-xs opacity-60">Only function name allowed (letters, digits, underscore).</span>
          </div>
        </div>

        <div class="form-control mt-2 w-1/2">
          <label class="label">
            <span class="text-base font-semibold">Allow connect to network</span>
          </label>

          <!-- 已新增的 domain -->
          <div v-if="problem.allowedDomains?.length" class="mt-2 flex flex-wrap gap-2">
            <div
              v-for="d in problem.allowedDomains"
              :key="d"
              class="flex items-center gap-1 rounded-md border border-base-300 bg-base-100 px-3 py-1 text-sm"
            >
              <span>{{ d }}</span>
              <button type="button" class="btn btn-ghost btn-xs" @click="removeDomain(d)">
                <i-uil-times />
              </button>
            </div>
          </div>

          <!-- 輸入 -->
          <div class="mt-2 flex flex-col gap-1">
            <div class="flex gap-3">
              <input
                v-model="domainInput"
                type="text"
                :class="['input input-bordered w-full', domainError && 'input-error']"
                placeholder="Please add domain."
                @keydown.enter.prevent="addDomain"
                @input="domainError = ''"
              />

              <button
                type="button"
                :class="['btn btn-success', !domainInput.trim() && 'btn-disabled']"
                @click="addDomain"
              >
                ADD DOMAIN
              </button>
            </div>
            <span v-if="domainError" class="text-xs text-error">{{ domainError }}</span>
          </div>
        </div>
      </section>
    </template>

    <ProblemTestdataDescriptionModal />
  </div>
  <div class="mt-4 flex justify-end">
    <button :class="['btn btn-success', isLoading && 'loading']" @click="submit">
      <i-uil-file-upload-alt class="mr-1 lg:h-5 lg:w-5" /> {{ $t("components.problem.forms.submit") }}
    </button>
  </div>
</template>
