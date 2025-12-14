<script setup lang="ts">
import { ref, watchEffect, provide, Ref ,onMounted} from "vue";
import { useTitle } from "@vueuse/core";
import { useAxios } from "@vueuse/integrations/useAxios";
import { useRoute, useRouter } from "vue-router";
import api, { fetcher } from "@/api";
import axios from "axios";
import ProblemFormComponent from "@/components/Problem/ProblemForm.vue";

const route = useRoute();
const router = useRouter();
useTitle(`Edit Problem - ${route.params.id} - ${route.params.name} | Normal OJ`);

const formElement = ref<InstanceType<typeof ProblemFormComponent>>();
const LANGUAGE_BIT_MAP = [
  { bit: 1, name: "c" },
  { bit: 2, name: "cpp" },
  { bit: 4, name: "java" },
];
function mapAllowedLanguageToSupportedLanguages(mask: number): string[] {
  return LANGUAGE_BIT_MAP
    .filter((lang) => (mask & lang.bit) !== 0)
    .map((lang) => lang.name);
}
const {
  data: problem,
  error: fetchError,
  isLoading: isFetching,
} = useAxios<ProblemInfo>(`/problem/${route.params.id}`, fetcher);
async function getmanage() {
  
  const problemId=route.params.id as string;
  const managedata=await api.Problem.getManageData(problemId);
}
onMounted(getmanage);
const edittingProblem = ref<ProblemForm>();
watchEffect(() => {
  if (problem.value) {
    edittingProblem.value = {
      problemName: problem.value.problemName,
      description: {
        description: problem.value.description.description,
        input: problem.value.description.input,
        output: problem.value.description.output,
        hint: problem.value.description.hint,
        sampleInput: (problem.value.description.sampleInput || "").split("\n"),
        sampleOutput: (problem.value.description.sampleOutput || "").split("\n"),
      },
      courses: problem.value.courses.map((c) => c.name),
      tags: problem.value.tags.map((t) => String(t.id)),
      allowedLanguage: problem.value.allowedLanguage,
      quota: problem.value.quota,
      type: problem.value.type,
      status: problem.value.status === "public" ? 0 : 1, // 0: visible, 1: hidden
      testCaseInfo: {
        language: 0,
        fillInTemplate: problem.value.fillInTemplate || "",
        tasks: problem.value.testCase,
      },
      canViewStdout: true,
      defaultCode: typeof problem.value.defaultCode === "string" ? problem.value.defaultCode : "", // Handle object/string mismatch if any
    };
  }
});
function update<K extends keyof ProblemForm>(key: K, value: ProblemForm[K]) {
  if (!edittingProblem.value) return;
  edittingProblem.value[key] = value;
}
provide<Ref<ProblemForm | undefined>>("problem", edittingProblem);
const testdata = ref<File | null>(null);

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
    tags: p.tags.map((t) => Number(t))
  };
}

async function submit() {
  if (!edittingProblem.value || !formElement.value || !problem.value) return;

  formElement.value.isLoading = true;
  try {
    const payload = mapNewProblemToPayload(edittingProblem.value,String(route.params.name));
    await api.Problem.modify(route.params.id as string, payload);
    const tasks=edittingProblem.value.testCaseInfo.tasks;
    const subtaskres=await api.Problem.getSubtasks(Number(route.params.id));
    for (const subtask of subtaskres.data) {
  await api.Problem.deleteSubtaks(Number(route.params.id), subtask.id);
}
for (let i = 0; i < tasks.length; i++) {
  const t = tasks[i];
  
   const sub= await api.Problem.createSubtasks(Number(route.params.id), {
    subtask_no: i + 1,
    weight: t.taskScore,
    time_limit_ms: t.timeLimit,
    memory_limit_mb: Math.ceil(t.memoryLimit), 
  });
}
    if (testdata.value) {
      //await uploadTestCase();
    }
    router.push(`/courses/${route.params.name}/problems/${route.params.id}`);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      formElement.value.errorMsg = error.response.data.message;
    } else {
      formElement.value.errorMsg = "Unknown error occurred :(";
    }
    throw error;
  } finally {
    formElement.value.isLoading = false;
  }
}

async function uploadTestCase() {
  const problemId = Number.parseInt(route.params.id as string, 10);
  const length = testdata.value?.size;
  if (!length) {
    console.error("No file to upload or file size is 0");
    return;
  }
  const partSize = 5 * 1024 * 1024;
  const uploadInfo = (
    await api.Problem.initiateTestCaseUpload(problemId, {
      length,
      partSize,
    })
  ).data;

  const parts = [];
  const partCount = uploadInfo.urls.length;
  for (let i = 0; i < partCount; i++) {
    const start = i * partSize;
    const end = Math.min((i + 1) * partSize, length);
    const part = testdata.value?.slice(start, end);
    if (!part) {
      console.error("Failed to slice file");
      return;
    }
    const resp = await fetch(uploadInfo.urls[i], { method: "PUT", body: part });
    parts.push({
      ETag: resp.headers.get("ETag")!,
      PartNumber: i + 1,
    });
  }

  await api.Problem.completeTestCaseUpload(problemId, uploadInfo.upload_id, parts);
}

async function discard() {
  if (!confirm("Are u sure?")) return;
  router.push(`/courses/${route.params.name}/problems`);
}
async function delete_() {
  if (!formElement.value) return;
  formElement.value.isLoading = true;
  if (!confirm("Are u sure?")) return;
  try {
    const problemId = Number(route.params.id);
    const subtaskres=await api.Problem.getSubtasks(problemId);
    for (const subtask of subtaskres.data) {
  await api.Problem.deleteSubtaks(problemId, subtask.id);
}
     const deleteres =await api.Problem.delete(route.params.id as string);
    router.push(`/courses/${route.params.name}/problems`);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      formElement.value.errorMsg = error.response.data.detail;
      
    } else {
      formElement.value.errorMsg = "Unknown error occurred :(";
    }
    throw error;
  } finally {
    formElement.value.isLoading = false;
  }
}
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body">
        <div class="card-title mb-3 justify-between">
          Edit Problem: {{ $route.params.id }} - {{ edittingProblem?.problemName }}
          <div class="flex gap-x-3">
            <button
              :class="['btn btn-outline btn-error btn-sm lg:btn-md', formElement?.isLoading && 'loading']"
              @click="delete_"
            >
              <i-uil-trash-alt class="mr-1 lg:h-5 lg:w-5" /> Delete
            </button>
            <button
              :class="['btn btn-warning btn-sm lg:btn-md', formElement?.isLoading && 'loading']"
              @click="discard"
            >
              <i-uil-times-circle class="mr-1 lg:h-5 lg:w-5" /> Discard Changes
            </button>
          </div>
        </div>

        <data-status-wrapper :error="fetchError" :is-loading="isFetching">
          <template #loading>
            <skeleton-card />
          </template>
          <template #data>
            <template v-if="edittingProblem">
              <problem-form-component
                ref="formElement"
                v-model:testdata="testdata"
                @update="update"
                @submit="submit"
              />

              <div class="divider" />

              <div class="card-title mb-3">
                Preview
                <input v-model="openPreview" type="checkbox" class="toggle" />
              </div>

              <problem-card
                v-if="openPreview"
                :problem="{
                  ...mockProblemMeta,
                  ...edittingProblem,
                  testCase: edittingProblem.testCaseInfo.tasks,
                  fillInTemplate: edittingProblem.testCaseInfo.fillInTemplate,
                  tags: edittingProblem.tags.map((t, i) => ({ id: i, name: t, usage_count: 0 })),
                  courses: edittingProblem.courses.map((c, i) => ({ id: i, name: c })),
                  status: edittingProblem.status === 0 ? 'public' : 'hidden',
                  defaultCode:
                    typeof edittingProblem.defaultCode === 'string' ? {} : edittingProblem.defaultCode,
                  description: {
                    ...edittingProblem.description,
                    sampleInput: edittingProblem.description.sampleInput.join('\n'),
                    sampleOutput: edittingProblem.description.sampleOutput.join('\n'),
                  },
                }"
                preview
              />

              <div class="divider my-4" />

              <div class="card-title mb-3">
                JSON
                <input v-model="openJSON" type="checkbox" class="toggle" />
              </div>

              <pre v-if="openJSON">{{ JSON.stringify(edittingProblem, null, 2) }}</pre>

              <div class="mb-[50%]" />
            </template>
          </template>
        </data-status-wrapper>
      </div>
    </div>
  </div>
</template>
