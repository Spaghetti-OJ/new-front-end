<script setup lang="ts">
import { reactive, watchEffect, computed, ref, onMounted } from "vue";
import hljs from "highlight.js";

import { useRoute, useRouter } from "vue-router";
import useVuelidate from "@vuelidate/core";
import { required, between, helpers } from "@vuelidate/validators";
import api from "@/api";
import { useTitle, useStorage } from "@vueuse/core";
import { LANGUAGE_OPTIONS, LOCAL_STORAGE_KEY } from "@/constants";
import { useI18n } from "vue-i18n";

const route = useRoute();
const { t } = useI18n();

useTitle(`Submit - ${route.params.id} - ${route.params.courseId} | Normal OJ`);
const router = useRouter();
const problem = ref<ProblemInfo | null>(null);
const error = ref<any>(null);
const isLoading = ref<boolean>(false);
async function loadProblem() {
  isLoading.value = true;
  error.value = null;

  try {
    const res = await api.Problem.getProblemInfo(Number(route.params.id));
    problem.value = res.data ?? res;
  } catch (err) {
    console.error(err);
    error.value = err;
  } finally {
    isLoading.value = false;
  }
}
const lang = useStorage(LOCAL_STORAGE_KEY.LAST_USED_LANG, -1);
const form = reactive({
  code: "",
  lang,
  isLoading: false,
  isSubmitError: false,
});
const testForm = reactive({
  input: "", // 使用者輸入的 testcase
  output: "", // 顯示出來的輸出
  isLoading: false,
  isError: false,
});

const rules = {
  code: { required: helpers.withMessage(t("course.problem.submit.err.code"), required) },
  lang: { betweenValue: helpers.withMessage(t("course.problem.submit.err.lang"), between(0, 3)) },
};
const v$ = useVuelidate(rules, form);

const LANGUAGE_EXTENSION = [".c", ".cpp", ".py"];
const langOptions = computed<LangOption[]>(() => {
  if (!problem.value) return [];
  const _problem = problem.value;
  const availables: LangOption[] = [];
  LANGUAGE_OPTIONS.forEach((option) => {
    if (_problem.allowedLanguage & option.mask) {
      availables.push(option);
    }
  });
  if (availables.length === 1) {
    form.lang = availables[0].value;
  }
  return availables;
});

// detect python only
watchEffect(() => {
  const detectedLang = hljs.highlightAuto(form.code, ["c", "cpp", "python"]).language;
  if (detectedLang === "python" && langOptions.value.some((op) => op.value === 2)) {
    form.lang = 2;
  }
});

async function runTest() {
  testForm.isError = false;
  testForm.output = "";

  const isFormCorrect = await v$.value.$validate();
  if (!isFormCorrect) return;

  try {
    testForm.isLoading = true;
    const submitRes = await api.Submission.submitCustomTest(Number(route.params.id), {
      language: Number(form.lang),
      source_code: form.code,
      stdin: testForm.input || undefined,
    });

    const testId = submitRes.data?.test_id;
    if (!testId) {
      throw new Error("Missing test id from custom test response.");
    }

    const maxAttempts = 20;
    const delayMs = 1000;
    let result: CustomTestResultData | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const res = await api.Submission.getCustomTestResult(testId);
      result = res.data;

      if (result?.status && result.status !== "pending") {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    if (!result) {
      throw new Error("Empty custom test result.");
    }

    if (result.status === "pending") {
      testForm.output = "Test is still running. Please try again in a moment.";
      return;
    }

    const outputParts = [
      `Status: ${result.status}`,
      result.message ? `Message: ${result.message}` : "",
      `Time: ${result.time}s`,
      `Memory: ${result.memory}KB`,
      "",
      "Stdout:",
      result.stdout || "(empty)",
      "",
      "Stderr:",
      result.stderr || "(empty)",
    ].filter(Boolean);

    testForm.output = outputParts.join("\n");
  } catch (e) {
    testForm.isError = true;
    testForm.output = "Test failed. Please try again.";
    throw e;
  } finally {
    testForm.isLoading = false;
  }
}

async function submit() {
  const isFormCorrect = await v$.value.$validate();
  if (!isFormCorrect) return;
  form.isLoading = true;
  form.isSubmitError = false;
  try {
    const res = await api.Submission.create({
      problemId: Number(route.params.id),
      languageType: Number(form.lang),
    });

    let submissionId = null;
    const match = (res as any).message.match(/submission received\.\s*(.+)/i);

    if (match && match[1]) {
      submissionId = match[1].trim();
    }

    if (submissionId && typeof submissionId === "string") {
      router.push(`/courses/${route.params.courseId}/submissions/${submissionId}`);
      try {
        await api.Submission.upload(submissionId, { source_code: form.code });
      } catch (e) {
        console.error("Upload failed, but redirecting to submission page.", e);
      }
    } else {
      throw new Error("Failed to get valid submission ID");
    }
  } catch (error) {
    form.isSubmitError = true;
    throw error;
  } finally {
    form.isLoading = false;
  }
}
onMounted(loadProblem);
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body">
        <!-- 標題 -->
        <div class="card-title md:text-2xl lg:text-3xl">
          {{ t("course.problem.submit.card.title") }}{{ $route.params.id }}
        </div>

        <!-- 左右兩欄 -->
        <div class="mt-6 grid lg:grid-cols-2">
          <!-- 左欄: Description -->
          <div class="space-y-4 lg:-mt-2">
            <template v-if="isLoading">
              <div class="flex justify-center py-10">
                <ui-spinner class="h-10 w-10" />
              </div>
            </template>

            <template v-else-if="problem">
              <div>
                <div class="card-title md:text-lg lg:text-xl">
                  {{ t("components.problem.card.desc") }}
                </div>
                <markdown-renderer class="mb-4" :md="problem.description.description" />
              </div>
            </template>
          </div>

          <!-- 右欄 -->
          <div class="flex flex-col lg:-mt-2">
            <!-- 程式編輯區 -->
            <div class="card-title mt-2 md:text-lg lg:text-xl">
              {{ t("course.problem.submit.card.placeholder") }}
            </div>

            <code-editor v-model="form.code" class="mt-2" />
            <span v-show="v$.code.$error" class="mt-2 text-error" v-text="v$.code.$errors[0]?.$message" />

            <div v-if="error" class="alert alert-error mt-4 shadow-lg">
              <div>
                <i-uil-times-circle />
                <span>{{ t("course.problem.submit.err.msg") }}</span>
              </div>
            </div>

            <!-- 語言選擇 -->
            <div class="form-control mt-2 w-full max-w-xs">
              <label class="label">
                <span class="label-text font-semibold">
                  {{ t("course.problem.submit.lang.text") }}
                </span>
                <ui-spinner v-if="isLoading" class="h-6 w-6" />
              </label>

              <select
                v-model="v$.lang.$model"
                :class="['select select-bordered', v$.lang.$error && 'input-error']"
              >
                <option disabled :value="-1">
                  {{ t("course.problem.submit.lang.select") }}
                </option>

                <option v-for="{ text, value } in langOptions" :key="value" :value="value">
                  {{ text }}
                </option>
              </select>

              <label class="label" v-show="v$.lang.$error">
                <span class="label-text-alt text-error" v-text="v$.lang.$errors[0]?.$message" />
              </label>
            </div>

            <!-- 測試區 -->
            <div class="mt-3 space-y-2">
              <!-- Input testcase -->
              <div>
                <label class="label">
                  <span class="label-text font-semibold">Input testcase</span>
                </label>
                <textarea
                  v-model="testForm.input"
                  class="textarea textarea-bordered w-full"
                  rows="3"
                  placeholder="輸入要測試的資料"
                />
              </div>

              <!-- Test output -->
              <div>
                <label class="label">
                  <span class="label-text font-semibold">Test output</span>
                </label>
                <textarea
                  v-model="testForm.output"
                  class="textarea textarea-bordered w-full"
                  rows="4"
                  readonly
                  placeholder="按下TEST，顯示程式輸出"
                />
              </div>
            </div>

            <div class="mt-6 flex items-center justify-end gap-3">
              <!-- Test 按鈕 -->
              <button class="btn" :class="testForm.isLoading && 'loading'" @click="runTest">Test</button>

              <!-- Submit 按鈕 -->
              <button :class="['btn', form.isLoading && 'loading']" @click="submit">
                <i-uil-file-upload-alt class="mr-1 h-5 w-5" />
                {{ t("course.problem.submit.text") }}
              </button>
            </div>

            <span v-if="form.isSubmitError" class="mt-4 text-sm text-error">
              {{ t("course.problem.submit.err.msg") }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
