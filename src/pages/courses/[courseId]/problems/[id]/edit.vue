<script setup lang="ts">
import { ref, provide, Ref, onMounted, computed } from "vue";
import { useTitle } from "@vueuse/core";
import { useRoute, useRouter } from "vue-router";
import api from "@/api";
import axios from "axios";
import { LANGUAGE_OPTIONS } from "@/constants";
import ProblemFormComponent from "@/components/Problem/ProblemForm.vue";
import { ZipReader, BlobReader } from "@zip.js/zip.js";

type Pair = { ss: number; tt: number; inFile: string; outFile: string };

function basename(path: string): string {
  const slashIndex = path.lastIndexOf("/");
  const backslashIndex = path.lastIndexOf("\\");
  const index = Math.max(slashIndex, backslashIndex);
  return index === -1 ? path : path.slice(index + 1);
}

function parseZipFilenames(filenames: string[]) {
  const re = /^(\d{2})(\d{2})\.(in|out)$/;

  const inSet = new Set<string>();
  const outSet = new Set<string>();

  for (const f of filenames) {
    const base = basename(f);
    const m = base.match(re);
    if (!m) continue;

    const stem = `${m[1]}${m[2]}`; // sstt
    if (m[3] === "in") inSet.add(stem);
    else outSet.add(stem);
  }

  const allStems = new Set([...inSet, ...outSet]);
  for (const stem of allStems) {
    if (!inSet.has(stem) || !outSet.has(stem)) {
      throw new Error(`Input/Output not matched at ${stem}`);
    }
  }

  const pairs: Pair[] = [];
  for (const stem of allStems) {
    pairs.push({
      ss: Number(stem.slice(0, 2)),
      tt: Number(stem.slice(2, 4)),
      inFile: `${stem}.in`,
      outFile: `${stem}.out`,
    });
  }

  pairs.sort((a, b) => a.ss - b.ss || a.tt - b.tt);
  return { pairs };
}

async function getZipFilenames(file: File): Promise<string[]> {
  const reader = new ZipReader(new BlobReader(file));
  const entries = await reader.getEntries();
  await reader.close();
  return entries.map((e) => e.filename);
}
const route = useRoute();
const router = useRouter();
useTitle(`Edit Problem - ${route.params.id} - ${route.params.courseId} | Normal OJ`);

const formElement = ref<InstanceType<typeof ProblemFormComponent>>();
function mapAllowedLanguageToSupportedLanguages(mask: number): string[] {
  return LANGUAGE_OPTIONS.filter((lang) => (mask & lang.mask) !== 0).map((lang) => lang.text);
}
const isFetching = ref(true);
const fetchError = ref<any>(null);

async function getManage() {
  try {
    isFetching.value = true;
    const problemId = Number(route.params.id);

    const { data: problemData } = await api.Problem.getManageData(problemId);
    const { data: subtasks } = await api.Problem.getSubtasks(problemId);
    const { data: publicInfo } = (await api.Problem.getProblemInfo(problemId)) as { data: any };

    const publicTestCases = publicInfo.testCase || publicInfo.test_case || publicInfo.test_cases || [];

    const sortedSubtasks = subtasks.sort((a: any, b: any) => a.subtask_no - b.subtask_no);

    edittingProblem.value = {
      problemName: problemData.title,
      description: {
        description: problemData.description,
        input: problemData.input_description || "",
        output: problemData.output_description || "",
        hint: problemData.hint || "",
        sampleInput: (problemData.sample_input || "").split("\n"),
        sampleOutput: (problemData.sample_output || "").split("\n"),
      },
      courses: [route.params.courseId as string], // Assuming context
      tags: problemData.tags.map((t: any) => String(t.id)),
      allowedLanguage: publicInfo.allowedLanguage ?? publicInfo.allowed_languages,
      quota: problemData.total_quota,
      type: 0, // Default or map if available
      status: problemData.is_public === "public" ? 0 : 1,
      subtaskDescription: problemData.subtask_description || "",
      testCaseInfo: {
        language: 0,
        fillInTemplate: "",
        tasks: sortedSubtasks.map((s: any, index: number) => {
          const info = publicTestCases[index];
          return {
            caseCount: info?.caseCount ?? info?.case_count ?? 0,
            memoryLimit: s.memory_limit_mb,
            taskScore: s.weight,
            timeLimit: s.time_limit_ms,
          };
        }),
      },
      canViewStdout: true,
      defaultCode: "",
      staticAnalysis: problemData.static_analysis_rules ?? [],
      solution: "",
      solutionLanguage: problemData.solution_language ?? 0,
      allowedDomains: [],
      forbidFunctions: problemData.forbidden_functions ?? [],
    };
  } catch (err) {
    fetchError.value = err;
    console.error(err);
  } finally {
    isFetching.value = false;
  }
}
onMounted(getManage);
const edittingProblem = ref<ProblemForm>();
provide<Ref<ProblemForm | undefined>>("problem", edittingProblem);
function update<K extends keyof ProblemForm>(key: K, value: ProblemForm[K]) {
  if (!edittingProblem.value) return;
  edittingProblem.value[key] = value;
}
provide<Ref<ProblemForm | undefined>>("problem", edittingProblem);
const testdata = ref<File | null>(null);
const checker = ref<File | null>(null);

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

const contentSection = computed<HTMLElement | null>(() => formElement.value?.contentSection ?? null);
const testdataSection = computed<HTMLElement | null>(() => formElement.value?.testdataSection ?? null);
const checkerSection = computed<HTMLElement | null>(() => formElement.value?.checkerSection ?? null);

const scrollToSection = (el: HTMLElement | null) => {
  if (!el) return;
  el.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

function mapProblemFormToPayload(p: ProblemForm): ProblemCreatePayload {
  const emptyToNull = (s: string | undefined) => (s && s.trim() !== "" ? s : null);

  return {
    title: p.problemName,
    description: p.description.description,
    course_id: String(route.params.courseId), // 後端要 UUID

    difficulty: "medium" as "easy" | "medium" | "hard",
    is_public: (p.status === 0 ? "public" : "hidden") as "public" | "hidden" | "course",

    max_score: 100,
    total_quota: p.quota ?? -1,

    input_description: emptyToNull(p.description.input),
    output_description: emptyToNull(p.description.output),
    sample_input: emptyToNull(p.description.sampleInput?.join("\n")),
    sample_output: emptyToNull(p.description.sampleOutput?.join("\n")),
    hint: emptyToNull(p.description.hint),
    static_analysis_rules: p.staticAnalysis ?? [],
    forbidden_functions: p.forbidFunctions ?? [],
    subtask_description: emptyToNull(p.subtaskDescription),

    supported_languages: mapAllowedLanguageToSupportedLanguages(p.allowedLanguage),
    tags: p.tags.map((t) => Number(t)),
    allowed_domains: p.allowedDomains,
  };
}

async function submit() {
  if (!edittingProblem.value || !formElement.value) return;

  formElement.value.isLoading = true;

  try {
    const problemId = Number(route.params.id);

    const payload = mapProblemFormToPayload(edittingProblem.value);
    await api.Problem.modify(problemId, payload);
    if (!testdata.value) {
      router.push(`/courses/${route.params.courseId}/problems/${route.params.id}`);
      return;
    }
    const tcRes = await api.Problem.getTestCases(problemId);
    const testCases = (tcRes.data as any).data || tcRes.data || [];
    await Promise.all(
      (Array.isArray(testCases) ? testCases : []).map((tc: any) =>
        api.Problem.deleteTestCase(problemId, tc.id),
      ),
    );

    const subtaskRes = await api.Problem.getSubtasks(problemId);
    for (const s of subtaskRes.data ?? []) {
      await api.Problem.deleteSubtasks(problemId, s.id);
    }

    const tasks = edittingProblem.value.testCaseInfo.tasks;
    const subtaskIdByNo = new Map<number, number>();

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const created = await api.Problem.createSubtasks(problemId, {
        subtask_no: i + 1,
        weight: t.taskScore,
        time_limit_ms: t.timeLimit,
        memory_limit_mb: Math.ceil(t.memoryLimit),
      });

      subtaskIdByNo.set(i, created.data.id);
    }

    if (testdata.value) {
      const filenames = await getZipFilenames(testdata.value);
      const { pairs } = parseZipFilenames(filenames);

      if (pairs.length === 0) {
        throw new Error("No valid test case files (XXYY.in/out) found in the zip archive.");
      }

      const createTestCasePromises = pairs.map((p) => {
        const subtaskNo = p.ss;
        const subtaskId = subtaskIdByNo.get(subtaskNo);
        if (!subtaskId) {
          // zip 可能有 ss=03，但你 tasks 只有 2 個 => 直接報錯比較好
          throw new Error(`Zip refers to subtask ss=${p.ss} but subtask_no=${subtaskNo} not found`);
        }

        return api.Problem.createTestCase(problemId, {
          subtask_id: subtaskId,
          idx: p.tt + 1, // YY 從 01 開始（後端限制）
          input_path: p.inFile,
          output_path: p.outFile,
          status: "ready",
        });
      });

      await Promise.all(createTestCasePromises);

      // F) 最後才上傳 zip（題目層級 zip）
      await api.Problem.uploadTestCasesZip(problemId, testdata.value);
    }

    router.push(`/courses/${route.params.courseId}/problems/${problemId}`);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      formElement.value.errorMsg = error.response.data.message;
    } else {
      formElement.value.errorMsg = error instanceof Error ? error.message : "Unknown error occurred :(";
    }
    throw error;
  } finally {
    formElement.value.isLoading = false;
  }
}
async function discard() {
  if (!confirm("Are u sure?")) return;
  router.push(`/courses/${route.params.courseId}/problems`);
}
async function delete_() {
  if (!formElement.value) return;
  formElement.value.isLoading = true;
  if (!confirm("Are u sure?")) return;
  try {
    const problemId = Number(route.params.id);
    const res = await api.Problem.getTestCases(Number(route.params.id));
    const testCases = (res.data as any).data || res.data || [];
    await Promise.all(
      (Array.isArray(testCases) ? testCases : []).map((tc: any) =>
        api.Problem.deleteTestCase(Number(route.params.id), tc.id),
      ),
    );
    const subtaskres = await api.Problem.getSubtasks(problemId);
    for (const subtask of subtaskres.data) {
      await api.Problem.deleteSubtasks(problemId, subtask.id);
    }
    await api.Problem.delete(route.params.id as string);
    router.push(`/courses/${route.params.courseId}/problems`);
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

function onSaveSolution() {
  // TODO: connect solution-only API later
}

type GeneratedCase = {
  input: string;
  output: string;
};

const generatedCases = ref<GeneratedCase[]>([]);
const isGenerating = ref(false);

async function onGenerate(payload: GeneratePayload) {
  // 先讓 UI 顯示
  isGenerating.value = true;
  generatedCases.value = [];

  try {
    // TODO: 之後接後端
    // const res = await api.Problem.generateTestcase(route.params.id as string, payload);
    // generatedCases.value = res.data.cases;
    // 暫時：先不接後端
  } finally {
    //isGenerating.value = false;
  }
}
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body pt-0">
        <div
          class="card-title sticky top-[53px] z-50 mb-3 flex h-20 items-center justify-between bg-base-100"
        >
          <div class="flex items-center gap-x-4">
            <span> Edit Problem: {{ $route.params.id }} - {{ edittingProblem?.problemName }} </span>

            <!-- 三顆 tab 按鈕 -->
            <div class="flex items-center gap-x-4">
              <button
                class="btn btn-primary"
                aria-label="Scroll to Content Section"
                @click="scrollToSection(contentSection)"
              >
                Content
              </button>
              <button
                class="btn btn-primary"
                aria-label="Scroll to Testdata Section"
                @click="scrollToSection(testdataSection)"
              >
                Testdata
              </button>
              <button
                class="btn btn-primary"
                aria-label="Scroll to Checker Section"
                @click="scrollToSection(checkerSection)"
              >
                Checker
              </button>
            </div>
          </div>

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
                v-model:checker="checker"
                @update="update"
                @submit="submit"
                @save-solution="onSaveSolution"
                @generate="onGenerate"
                :generated-cases="generatedCases"
                :is-generating="isGenerating"
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
