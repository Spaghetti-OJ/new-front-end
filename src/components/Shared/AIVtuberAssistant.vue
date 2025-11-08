<script setup lang="ts">
import { ref } from "vue";
import { ojAssistant } from "@/api/ojAssistant";

interface Props {
  problem?: { id: number; title: string };
  submission?: { code: string; lang: string };
}

const props = defineProps<Props>();

const question = ref("");
const answer = ref("");
const loading = ref(false);
const error = ref<string | null>(null);
const confidence = ref<number | null>(null);
const sources = ref<string[]>([]);

async function askQuestion() {
  if (!question.value.trim()) {
    error.value = "Please enter a question.";
    return;
  }

  loading.value = true;
  error.value = null;
  answer.value = "";

  try {
    let res;

    if (props.problem && props.submission) {
      res = await ojAssistant.askWithSubmission(question.value, props.problem, props.submission);
    } else if (props.problem) {
      res = await ojAssistant.askWithProblem(question.value, props.problem);
    } else {
      res = await ojAssistant.quickAsk(question.value);
    }

    answer.value = res.answer;
    confidence.value = res.confidence || null;
    sources.value = res.sources || [];
  } catch (err: any) {
    error.value = err instanceof Error ? err.message : "An unknown error occurred.";
  } finally {
    loading.value = false;
  }
}

function clearChat() {
  question.value = "";
  answer.value = "";
  error.value = null;
  confidence.value = null;
  sources.value = [];
}
</script>

<template>
  <div class="space-y-4 rounded-lg bg-base-200 p-6 shadow-md">
    <div class="flex items-center justify-between">
      <h3 class="flex items-center gap-2 text-lg font-semibold">🤖 AI Vtuber Assistant</h3>
      <button class="btn btn-outline btn-xs" @click="clearChat">Clear</button>
    </div>

    <!-- Question input -->
    <div>
      <label class="mb-2 block text-sm font-medium">Ask about this problem</label>
      <div class="flex gap-2">
        <textarea
          v-model="question"
          class="textarea textarea-bordered flex-1 resize-none"
          placeholder="e.g. What’s wrong with my code?"
          rows="3"
          :disabled="loading"
        />
        <button class="btn btn-primary" :disabled="loading || !question.trim()" @click="askQuestion">
          <span v-if="loading" class="loading-spinner loading"></span>
          <span v-else>Ask</span>
        </button>
      </div>
    </div>

    <!-- Context info -->
    <div v-if="props.problem || props.submission" class="rounded-md bg-base-300 p-3 text-sm">
      <p v-if="props.problem">📘 Problem: {{ props.problem.title }}</p>
      <p v-if="props.submission">💻 Code submitted ({{ props.submission.lang }})</p>
    </div>

    <!-- Error -->
    <div v-if="error" class="alert alert-error">
      <i class="uil uil-times-circle"></i>
      <span>{{ error }}</span>
    </div>

    <!-- Answer -->
    <div v-if="answer" class="space-y-2 rounded-md bg-base-300 p-4">
      <div class="flex items-start gap-3">
        <img src="/vtuber-avatar.png" alt="AI" class="h-10 w-10 rounded-full" />
        <div class="text-sm leading-relaxed">{{ answer }}</div>
      </div>

      <div class="flex gap-4 text-xs opacity-70">
        <div v-if="confidence !== null">
          Confidence:
          <span
            :class="{
              'text-success': confidence > 0.8,
              'text-warning': confidence > 0.6,
              'text-error': confidence <= 0.6,
            }"
          >
            {{ Math.round(confidence * 100) }}%
          </span>
        </div>
        <div v-if="sources.length">Sources: {{ sources.join(", ") }}</div>
      </div>
    </div>

    <!-- Tips -->
    <div v-if="!answer && !loading" class="text-xs opacity-70">
      💡 Tips: Ask about problem hints, your code logic, or debugging help.
    </div>
  </div>
</template>

<style scoped>
textarea {
  min-height: 70px;
}
</style>
