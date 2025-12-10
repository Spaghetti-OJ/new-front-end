<script setup lang="ts">
import { ref, provide, Ref } from "vue";
import { useTitle } from "@vueuse/core";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import api from "@/api";
import ProblemForm from "@/components/Problem/ProblemForm.vue";

const route = useRoute();
const router = useRouter();
useTitle(`New Problem - ${route.params.name} | Normal OJ`);

const formElement = ref<InstanceType<typeof ProblemForm>>();

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
    newProblem.value[key] = value(newProblem.value[key]);
  } else {
    newProblem.value[key] = value;
  }
}
provide<Ref<ProblemForm>>("problem", newProblem);
const testdata = ref<File | null>(null);

  function mapNewProblemToPayload(p: ProblemForm, courseId: string) {
  const emptyToNull = (s: string | undefined) =>
    s && s.trim() !== "" ? s : null;

  return {
    title: p.problemName,
    description: p.description.description,
    course_id: courseId, // 後端要 UUID

    difficulty: "medium", // TODO: 如果你有 UI，再改成 p.difficulty
    is_public: p.status === 0 ? "public" : "hidden",  // 舊 status → 新 is_public

    max_score: 100,
    total_quota: p.quota ?? -1,

    input_description: emptyToNull(p.description.input),
    output_description: emptyToNull(p.description.output),
    sample_input: emptyToNull(p.description.sampleInput?.join("\n")),
    sample_output: emptyToNull(p.description.sampleOutput?.join("\n")),
    hint: emptyToNull(p.description.hint),

    subtask_description: null,

    // 後端允許不填 → 讓後端用預設 languages
    supported_languages: undefined,

    // 後端 tags 要 ID 陣列
    tags: (p.tags as any[]).map((t) => t.id),
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
    console.log(payload);
    const { problemId } = (
      await api.Problem.create(payload)
    ).data;
      console.log(problemId);
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
  owner: "",
  highScore: 0,
  submitCount: 0,
  ACUser: 0,
  submitter: 0,
};

const openJSON = ref<boolean>(false);
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body">
        <div class="card-title mb-3 justify-between">{{ $t("course.problem.new.title") }}</div>

        <problem-form ref="formElement" v-model:testdata="testdata" @update="update" @submit="submit" />

        <div class="divider" />

        <div class="card-title mb-3">
          {{ $t("course.problem.new.preview") }}
          <input v-model="openPreview" type="checkbox" class="toggle" />
        </div>

        <problem-card
          v-if="openPreview"
          :problem="{ ...mockProblemMeta, ...newProblem, testCase: newProblem.testCaseInfo.tasks }"
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
