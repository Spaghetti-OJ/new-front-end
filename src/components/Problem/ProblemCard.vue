<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import { useSession } from "@/stores/session";
import api from "@/api";
import { isQuotaUnlimited } from "@/constants";
import { useRoute } from "vue-router";
const route = useRoute();
interface Props {
  problem: ProblemInfo;
  preview?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  preview: false,
});
const subtasks = ref<Subtasks[] | null>(null);
const session = useSession();
async function getSubtasks() {
  const res = (await api.Problem.getSubtasks(Number(route.params.id))).data;
  subtasks.value = res;
}
async function downloadTestCase(problemId: number) {
  const res = await api.Problem.getTestCaseUrl(problemId);

  const url = URL.createObjectURL(res.data);

  const a = document.createElement("a");
  a.href = url;
  a.download = `problem-${problemId}-testcases.zip`;
  a.click();

  URL.revokeObjectURL(url);
}

const samples = computed(() => {
  const input = props.problem.description.sampleInput;
  const output = props.problem.description.sampleOutput;
  const inputs = Array.isArray(input) ? input : [input];
  const outputs = Array.isArray(output) ? output : [output];
  // If inputs/outputs are single strings, we treat them as one sample.
  // If they are arrays, we assume parallel arrays for multiple samples.
  // Exception: If the user intended lines of a single sample to be an array?
  // User instruction implies array = multiple samples.

  const length = Math.max(inputs.length, outputs.length);
  return Array.from({ length }, (_, i) => ({
    input: inputs[i] || "",
    output: outputs[i] || "",
  }));
});

const descriptionHasHeading = computed(() =>
  /^\s*#{1,6}\s+/m.test(props.problem.description.description || ""),
);
const hasInput = computed(() => Boolean(props.problem.description.input?.trim()));
const hasOutput = computed(() => Boolean(props.problem.description.output?.trim()));
const hasHint = computed(() => Boolean(props.problem.description.hint?.trim()));
const hasSubtask = computed(() => Boolean(props.problem.subtaskDescription?.trim()));

const likes = ref(0);
const isLiked = ref(false);
const isLiking = ref(false);

async function loadLikes() {
  const problemId = Number(route.params.id);
  try {
    const res = await api.Problem.getLikes(problemId);
    const count = res.data?.data?.likes_count ?? (res as any).data?.likes_count;
    if (typeof count === "number") {
      likes.value = count;
    }
  } catch {}
}

async function loadLikedState() {
  try {
    const res = await api.Problem.listLiked();
    const data = res.data?.data ?? (res as any).data;
    const results = data?.results ?? [];
    const problemId = Number(route.params.id);
    isLiked.value = results.some((p: { id: number }) => p.id === problemId);
  } catch {}
}

watch(
  () => props.problem,
  (value) => {
    if (typeof value.like_count === "number") {
      likes.value = value.like_count;
    }
    if (typeof value.is_liked_by_user === "boolean") {
      isLiked.value = value.is_liked_by_user;
    }
  },
  { immediate: true },
);

const toggleLike = async () => {
  if (isLiking.value) return;
  isLiking.value = true;
  const problemId = Number(route.params.id);
  try {
    if (isLiked.value) {
      const res = await api.Problem.unlike(problemId);
      const count = res.data?.data?.likes_count ?? (res as any).data?.likes_count;
      if (typeof count === "number") likes.value = count;
      isLiked.value = false;
    } else {
      const res = await api.Problem.like(problemId);
      const count = res.data?.data?.likes_count ?? (res as any).data?.likes_count;
      if (typeof count === "number") likes.value = count;
      isLiked.value = true;
    }
  } catch (err) {
    // Keep existing UI state on error.
  } finally {
    isLiking.value = false;
  }
};

onMounted(() => {
  getSubtasks();
  if (props.problem.like_count == null) {
    loadLikes();
  }
  if (props.problem.is_liked_by_user == null) {
    loadLikedState();
  }
});
</script>

<template>
  <div class="card min-w-full">
    <div class="card-body">
      <div class="flex flex-wrap items-start justify-between gap-y-4">
        <div class="flex flex-col gap-4">
          <div class="card-title md:text-2xl lg:text-3xl">
            {{ $t("components.problem.card.title") }}{{ $route.params.id }} - {{ problem.problemName }}
          </div>
          <div class="flex">
            <span class="badge badge-info mr-1" v-for="tag in problem.tags" :key="tag.id">{{
              tag.name
            }}</span>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-y-4">
          <div class="stats py-1">
            <div class="stat place-items-center py-0">
              <div class="stat-title">{{ $t("components.problem.card.quota") }}</div>
              <div class="stat-value">
                <template v-if="isQuotaUnlimited(problem.quota)">
                  <span class="text-sm">{{ $t("components.problem.card.unlimited") }}</span>
                </template>
                <template v-else>
                  <span>{{ problem.quota - problem.submitCount }}</span>
                  <span class="text-sm font-normal">{{ ` / ${problem.quota}` }}</span>
                </template>
              </div>
            </div>
            <div class="stat place-items-center py-0">
              <div class="stat-title">{{ $t("components.problem.card.score") }}</div>
              <div class="stat-value">
                <span>{{ problem.highScore }}</span>
                <span class="text-sm font-normal">{{ " / 100" }}</span>
              </div>
            </div>
          </div>

          <div class="mx-4 flex items-center justify-center">
            <button
              type="button"
              class="btn btn-ghost btn-lg gap-2 px-4"
              :class="{ loading: isLiking }"
              :disabled="isLiking"
              @click="toggleLike"
            >
              <span class="text-2xl leading-none">
                {{ isLiked ? "♥" : "♡" }}
              </span>
              <span class="text-lg">{{ likes }}</span>
            </button>
          </div>

          <div class="ml-3 flex flex-wrap place-items-center gap-x-3" v-if="!preview">
            <router-link
              class="btn md:btn-md lg:btn-lg"
              :to="`/courses/${$route.params.courseId}/problems/${$route.params.id}/submit`"
            >
              <i-uil-file-upload-alt class="lg:h-5 lg:w-5" /> {{ $t("components.problem.card.submit") }}
            </router-link>
            <router-link
              class="btn md:btn-md lg:btn-lg"
              :to="`/courses/${$route.params.courseId}/problems/${$route.params.id}/editorial`"
            >
              <i-uil-book-open class="lg:h-5 lg:w-5" /> Editorial
            </router-link>
            <router-link
              class="btn md:btn-md lg:btn-lg"
              :to="`/courses/${$route.params.courseId}/problems/${$route.params.id}/stats`"
            >
              <i-uil-chart-line class="lg:h-5 lg:w-5" /> {{ $t("components.problem.card.stats") }}
            </router-link>
            <router-link
              v-if="session.hasCourseAccess(route.params.courseId as string)"
              :class="['btn tooltip tooltip-bottom btn-ghost btn-sm', 'inline-flex']"
              :data-tip="$t('components.problem.card.copycat')"
              :to="`/courses/${$route.params.courseId}/problems/${$route.params.id}/copycat`"
            >
              <i-uil-file-exclamation-alt class="lg:h-5 lg:w-5" />
            </router-link>
            <router-link
              v-if="session.hasCourseAccess(route.params.courseId as string)"
              class="btn btn-circle btn-ghost btn-sm"
              :data-tip="$t('components.problem.card.edit')"
              :to="`/courses/${$route.params.courseId}/problems/${$route.params.id}/edit`"
            >
              <i-uil-edit class="lg:h-5 lg:w-5" />
            </router-link>
            <button
              v-if="session.hasCourseAccess(route.params.courseId as string)"
              :class="['btn tooltip tooltip-bottom btn-ghost btn-sm', 'inline-flex']"
              :data-tip="$t('components.problem.card.downloadTestCase')"
              @click="downloadTestCase(Number.parseInt($route.params.id as string, 10))"
            >
              <i-uil-folder-download class="lg:h-5 lg:w-5" />
            </button>
          </div>
        </div>
      </div>

      <div class="divider" />

      <div class="card min-w-full rounded-none">
        <div class="card-body p-0">
          <div v-if="!descriptionHasHeading" class="card-title md:text-xl lg:text-2xl">
            {{ $t("components.problem.card.desc") }}
          </div>
          <markdown-renderer
            v-if="problem.description.description"
            class="prose prose-lg mb-10 max-w-none prose-headings:text-2xl"
            :md="problem.description.description"
          />

          <div v-if="hasInput" class="card-title md:text-xl lg:text-2xl">
            {{ $t("components.problem.card.input") }}
          </div>
          <markdown-renderer
            v-if="hasInput"
            class="prose prose-lg mb-10 max-w-none prose-headings:text-2xl"
            :md="problem.description.input"
          />

          <div v-if="hasOutput" class="card-title md:text-xl lg:text-2xl">
            {{ $t("components.problem.card.output") }}
          </div>
          <markdown-renderer
            v-if="hasOutput"
            class="prose prose-lg mb-10 max-w-none prose-headings:text-2xl"
            :md="problem.description.output"
          />

          <div class="card-title md:text-xl lg:text-2xl">{{ $t("components.problem.card.ex") }}</div>
          <div class="mb-10">
            <table class="table w-full">
              <thead>
                <tr>
                  <th>{{ $t("components.problem.card.sample.id") }}</th>
                  <th>{{ $t("components.problem.card.sample.input") }}</th>
                  <th>{{ $t("components.problem.card.sample.output") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(sample, index) in samples" :key="index">
                  <td class="align-top">{{ index + 1 }}</td>
                  <td class="align-top">
                    <sample-code-block v-if="sample.input" :code="sample.input"></sample-code-block>
                    <span v-else class="italic opacity-70">{{
                      $t("components.problem.card.noContent")
                    }}</span>
                  </td>
                  <td class="align-top">
                    <sample-code-block v-if="sample.output" :code="sample.output"></sample-code-block>
                    <span v-else class="italic opacity-70">{{
                      $t("components.problem.card.noContent")
                    }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!--subtask description-->
          <div v-if="problem.subtaskDescription" class="mt-4">
            <div class="card-title md:text-xl lg:text-2xl">Subtask Description</div>

            <markdown-renderer
              v-if="hasSubtask"
              class="prose prose-lg mb-10 max-w-none space-y-4 leading-8 prose-headings:mb-3 prose-headings:mt-6 prose-p:my-3"
              :md="problem.subtaskDescription"
            />
          </div>

          <div v-if="hasHint" class="card-title md:text-xl lg:text-2xl">
            {{ $t("components.problem.card.hint") }}
          </div>
          <markdown-renderer
            v-if="hasHint"
            class="prose prose-lg mb-10 max-w-none prose-headings:text-2xl"
            :md="problem.description.hint"
          />

          <div class="card-title md:text-xl lg:text-2xl">
            {{ $t("components.problem.card.subtasks.title") }}
          </div>
          <table class="table w-full">
            <thead>
              <tr>
                <th>{{ $t("components.problem.card.subtasks.id") }}</th>
                <th>{{ $t("components.problem.card.subtasks.tl") }}</th>
                <th>{{ $t("components.problem.card.subtasks.ml") }}</th>
                <th>{{ $t("components.problem.card.subtasks.score") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="{ memory_limit_mb, time_limit_ms, weight, subtask_no } in subtasks || []"
                :key="subtask_no"
              >
                <td>{{ subtask_no }}</td>
                <td>{{ time_limit_ms }} ms</td>
                <td>{{ memory_limit_mb }} MB</td>
                <td>{{ weight }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
