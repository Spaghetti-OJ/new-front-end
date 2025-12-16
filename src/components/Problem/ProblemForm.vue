<script setup lang="ts">
import { ref, watch, inject, Ref } from "vue";
import useVuelidate from "@vuelidate/core";
import { required, maxLength, minValue, between, helpers } from "@vuelidate/validators";
import { ZipReader, BlobReader } from "@zip.js/zip.js";
import LLMSubtaskEditor  from "@/components/Problem/Forms/SubtaskEditor.vue"
import { onMounted, watchEffect } from "vue";



// TODO: handling error when `problem` or `problem.value` is undefined
// This component only renders when `problem` is not undefined
const problem = inject<Ref<ProblemForm>>("problem") as Ref<ProblemForm>;
const props = defineProps<{
  testdata: File | null;
}>();
const isLoading = ref(false);
const errorMsg = ref("");
const contentSection = ref<HTMLElement | null>(null);
const testdataSection = ref<HTMLElement | null>(null);
defineExpose({ isLoading, errorMsg, contentSection, testdataSection });
const emits = defineEmits<{
  (e: "update", key: keyof ProblemForm, value: ProblemForm[typeof key]): void;
  (e: "update:testdata", value: File | null): void;
  (e: "submit"): void;
  (e: "save-solution"): void;
}>();

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

const llmMode = ref<"" | "LLM_INPUT_ONLY" | "LLM_DIRECT">("");
function onGenerateClick() {
  // TODO: connect backend later
}

type TestdataMode = "uploadfile" | "LLMgenerate" | null;
const testdataMode = ref<TestdataMode>(null);
const isDrag = ref(false);
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
const defaultTask = () => ({
  caseCount: 1,
  taskScore: 100,
  memoryLimit: 134218,
  timeLimit: 1000,
});

const llmSubtasks = ref([
  { caseCount: 1, taskScore: 100, memoryLimit: 134218, timeLimit: 1000 },
]);

watchEffect(() => {
  if (testdataMode.value === "LLMgenerate" && problem.value.testCaseInfo.tasks.length === 0) {
    update("testCaseInfo", {
      ...problem.value.testCaseInfo,
      tasks: [defaultTask()],
    });
  }
});
</script>

<template>
  <div v-if="errorMsg" class="alert alert-error shadow-lg">
    <div>
      <i-uil-times-circle />
      <span>{{ errorMsg }}</span>
    </div>
  </div>
  <div ref="contentSection" class="grid grid-cols-2 gap-y-4 scroll-mt-32">
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
          <button
            class="btn btn-sm bg-[#02305f] normal-case shrink-0"
            @click="$emit('save-solution')"
          >
            Save Solution
          </button>
        </div>
      </div>
      <div class="divider mt-8 mb-0" />
    </div>

    <template v-if="problem.type !== 2">
      <section ref="testdataSection" class="col-span-2 scroll-mt-32">
        <div class="form-control w-full">
          <label class="label p-0 flex-col items-start gap-1">
            <span class="text-base font-semibold">Testdata</span>
          </label>

          <div class="flex gap-3 mt-2">
            <button
              type="button"
              class="btn bg-[#02305f] btn-sm normal-case"
              @click="testdataMode = 'LLMgenerate'"
            >
              LLM generate testcase
            </button>

            <button
              type="button"
              class="btn bg-[#02305f] btn-sm normal-case"
              @click="testdataMode = 'uploadfile'"
            >
              Upload testcase
            </button>
          </div>
        </div>

        <div v-if="testdataMode === 'uploadfile'" class="mt-2">
          <label class="label justify-start mt-4">
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

          <!--
          <label
            class="label text-error"
            v-show="v$.testCaseInfo.tasks.$error"
            v-text="v$.testCaseInfo.tasks.$errors[0]?.$message"
          />
          <template v-for="(no, i) in problem.testCaseInfo.tasks.length">
            <div class="col-span-2">
              <div class="font-semibold">{{ $t("components.problem.forms.subtask", { no }) }}</div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">{{ $t("components.problem.forms.numOfCases") }}</span>
                  </label>
                  <input
                    type="text"
                    class="input input-bordered w-full max-w-xs"
                    :value="problem.testCaseInfo.tasks[i].caseCount"
                    readonly
                  />
                </div>

                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">{{ $t("components.problem.forms.score") }}</span>
                  </label>
                  <input
                    type="text"
                    class="input input-bordered w-full max-w-xs"
                    :value="problem.testCaseInfo.tasks[i].taskScore"
                    @input="
                      update('testCaseInfo', {
                        ...problem.testCaseInfo,
                        tasks: [
                          ...problem.testCaseInfo.tasks.slice(0, i),
                          {
                            ...problem.testCaseInfo.tasks[i],
                            taskScore: Number(($event.target as HTMLInputElement).value),
                          },
                          ...problem.testCaseInfo.tasks.slice(i + 1),
                        ],
                      })
                    "
                  />
                </div>

                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">{{ $t("components.problem.forms.memoryLimit") }}</span>
                  </label>
                  <input
                    type="text"
                    class="input input-bordered w-full max-w-xs"
                    :value="problem.testCaseInfo.tasks[i].memoryLimit"
                    @input="
                      update('testCaseInfo', {
                        ...problem.testCaseInfo,
                        tasks: [
                          ...problem.testCaseInfo.tasks.slice(0, i),
                          {
                            ...problem.testCaseInfo.tasks[i],
                            memoryLimit: Number(($event.target as HTMLInputElement).value),
                          },
                          ...problem.testCaseInfo.tasks.slice(i + 1),
                        ],
                      })
                    "
                  />
                </div>

                <div class="form-control w-full">
                  <label class="label">
                    <span class="label-text">{{ $t("components.problem.forms.timeLimit") }}</span>
                  </label>
                  <input
                    type="text"
                    class="input input-bordered w-full max-w-xs"
                    :value="problem.testCaseInfo.tasks[i].timeLimit"
                    @input="
                      update('testCaseInfo', {
                        ...problem.testCaseInfo,
                        tasks: [
                          ...problem.testCaseInfo.tasks.slice(0, i),
                          {
                            ...problem.testCaseInfo.tasks[i],
                            timeLimit: Number(($event.target as HTMLInputElement).value),
                          },
                          ...problem.testCaseInfo.tasks.slice(i + 1),
                        ],
                      })
                    "
                  />
                </div>
              </div>
            </div>
          </template>-->
        </div>

        <div v-if="testdataMode === 'LLMgenerate'" class="mt-2">
          <div class="flex gap-4 mt-4">
            <div class="text-lg font-semibold ">
              AI generate testdata
            </div>

            <button type="button" class="btn btn-success btn-sm" @click="onGenerateClick">
              GENERATE
            </button>
          </div>

          <p class="mt-2 text-sm opacity-70">
            LLM will generate test cases that refer to your solution and description.
            AI may generate error output. Please double-check before you publish the problem.
          </p>

          <p class="mt-2 text-base font-semibold">
            Mode
          </p>

          <select v-model="llmMode" class="select select-bordered w-full max-w-xl mt-2 px-3 py-1 text-sm">
            <option disabled value="">
              Please select mode
            </option>
            <option value="LLM_INPUT_ONLY">
              LLM_INPUT_ONLY (LLM 只生 input + output 用正解跑)
            </option>
            <option value="LLM_DIRECT">
              LLM_DIRECT (LLM 直接生 input + output，不依賴正解)
            </option>
          </select>

          <LLMSubtaskEditor v-model="llmSubtasks" />


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
