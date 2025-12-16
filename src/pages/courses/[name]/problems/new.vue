<script setup lang="ts">
import { ref, provide, Ref } from "vue";
import { useTitle } from "@vueuse/core";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { useI18n } from "vue-i18n";
import api from "@/api";
import { LANGUAGE_OPTIONS } from "@/constants";
import ProblemFormComponent from "@/components/Problem/ProblemForm.vue";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
useTitle(`New Problem - ${route.params.name} | Normal OJ`);
function mapAllowedLanguageToSupportedLanguages(mask: number): string[] {
  return LANGUAGE_OPTIONS.filter((lang) => (mask & lang.mask) !== 0).map((lang) => lang.text);
}
const formElement = ref<InstanceType<typeof ProblemFormComponent>>();
const newProblem = ref<ProblemForm>({
  problemName: "",
  description: {
    description: "",
    input: "",
    output: "",
    hint: "",
    sampleInput: [""],
    sampleOutput: [""],
  },
  courses: [route.params.name as string],
  defaultCode: "",
  tags: [],
  allowedLanguage: 3,
  quota: 10,
  type: 0,
  status: 1,
  testCaseInfo: {
    language: 0,
    fillInTemplate: "",
    tasks: [],
  },
  canViewStdout: false,
});

function update<K extends keyof ProblemForm>(
  key: K,
  value: ProblemForm[K] | ((arg: ProblemForm[K]) => ProblemForm[K]),
) {
  if (typeof value === "function") {
    // @ts-ignore: complex union type issue
    newProblem.value[key] = value(newProblem.value[key]);
  } else {
    newProblem.value[key] = value;
  }
}
provide<Ref<ProblemForm>>("problem", newProblem);
const testdata = ref<File | null>(null);

function mapNewProblemToPayload(p: ProblemForm, courseId: string) {
  const emptyToNull = (s: string | undefined) => (s && s.trim() !== "" ? s : null);

  return {
    title: p.problemName,
    description: p.description.description,
    course_id: courseId, // 後端要 UUID

    difficulty: "medium" as "easy" | "medium" | "hard",
    is_public: (p.status === 0 ? "public" : "hidden") as "public" | "hidden" | "course",

    max_score: 100,
    total_quota: p.quota ?? -1,

    input_description: emptyToNull(p.description.input),
    output_description: emptyToNull(p.description.output),
    sample_input: emptyToNull(p.description.sampleInput?.join("\n")),
    sample_output: emptyToNull(p.description.sampleOutput?.join("\n")),
    hint: emptyToNull(p.description.hint),

    subtask_description: null,

    supported_languages: mapAllowedLanguageToSupportedLanguages(p.allowedLanguage),
    tags: p.tags.map((t) => Number(t)),
  };
}

async function submit() {
  if (!formElement.value) return;
  if (!testdata.value) {
    alert("Testdata not provided");
    return;
  }
  formElement.value.isLoading = true;
  try {
    const payload = mapNewProblemToPayload(newProblem.value, route.params.name as string);
    const res = await api.Problem.create(payload);
    const problemId = res.data.problem_id;
    const tasks = newProblem.value.testCaseInfo.tasks;
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const sub = await api.Problem.createSubtasks(problemId, {
        subtask_no: i + 1,
        weight: t.taskScore,
        time_limit_ms: t.timeLimit,
        memory_limit_mb: Math.ceil(t.memoryLimit), // 如果你 memoryLimit 是 KB
      });
    }
    const testdataForm = new FormData();
    testdataForm.append("case", testdata.value);
    try {
      await api.Problem.modifyTestdata(problemId, testdataForm);
    } catch (error) {
      const errorMsg =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Unknown error occurred :(";
      alert(`Problem created, but testdata upload failed: ${errorMsg}`);
      router.push(`/courses/${route.params.name}/problems/${problemId}/edit`);
      throw error;
    }
    router.push(`/courses/${route.params.name}/problems/${problemId}`);
  } catch (error) {
    formElement.value.errorMsg =
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : "Unknown error occurred :(";
    throw error;
  } finally {
    formElement.value.isLoading = false;
  }
}

const openPreview = ref<boolean>(false);
const mockProblemMeta = {
  id: 0,
  owner: { id: "0", username: "mock", real_name: "Mock User" },
  highScore: 0,
  submitCount: 0,
  create_at: new Date().toISOString(),
  difficulty: "easy" as const,
  course_id: 0,
};

const openJSON = ref<boolean>(false);
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body">
        <div class="card-title mb-3 justify-between">{{ $t("course.problem.new.title") }}</div>

        <problem-form-component
          ref="formElement"
          v-model:testdata="testdata"
          @update="update"
          @submit="submit"
        />

        <div class="divider" />

        <div class="card-title mb-3">
          {{ $t("course.problem.new.preview") }}
          <input v-model="openPreview" type="checkbox" class="toggle" />
        </div>

        <problem-card
          v-if="openPreview"
          :problem="{
            ...mockProblemMeta,
            ...newProblem,
            testCase: newProblem.testCaseInfo.tasks,
            fillInTemplate: newProblem.testCaseInfo.fillInTemplate,
            tags: newProblem.tags.map((t, i) => ({ id: i, name: t, usage_count: 0 })),
            courses: newProblem.courses.map((c, i) => ({ id: i, name: c })),
            status: newProblem.status === 0 ? 'public' : 'hidden',
            defaultCode: typeof newProblem.defaultCode === 'string' ? {} : newProblem.defaultCode,
            description: {
              ...newProblem.description,
              sampleInput: newProblem.description.sampleInput.join('\n'),
              sampleOutput: newProblem.description.sampleOutput.join('\n'),
            },
          }"
          preview
        />

        <div class="divider my-4" />

        <div class="card-title mb-3">
          {{ $t("course.problem.new.json") }}
          <input v-model="openJSON" type="checkbox" class="toggle" />
        </div>

        <pre v-if="openJSON">{{ JSON.stringify(newProblem, null, 2) }}</pre>

        <div class="mb-[50%]" />
      </div>
    </div>
  </div>
</template>
