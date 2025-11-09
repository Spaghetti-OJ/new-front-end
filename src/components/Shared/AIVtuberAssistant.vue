<script setup lang="ts">
import { ref, nextTick } from "vue";

const isOpen = ref(false);
const question = ref("");
const loading = ref(false);
const error = ref<string | null>(null);
const messages = ref<{ sender: "user" | "ai"; text: string }[]>([]);

// ✅ 切換開關
function toggleAssistant() {
  isOpen.value = !isOpen.value;
  error.value = null;
}

// ✅ 呼叫 OpenAI API
async function askQuestion() {
  if (!question.value.trim()) {
    error.value = "Please enter a question.";
    return;
  }

  const userMsg = question.value.trim();
  messages.value.push({ sender: "user", text: userMsg });
  question.value = "";
  loading.value = true;
  error.value = null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an AI Vtuber assistant inside an Online Judge. Be friendly, encouraging, and explain code clearly.",
          },
          { role: "user", content: userMsg },
        ],
      }),
    });

    const data = await res.json();
    const aiReply = data?.choices?.[0]?.message?.content?.trim() || "(No response)";
    messages.value.push({ sender: "ai", text: aiReply });

    await nextTick();
    const chatBox = document.getElementById("chat-scroll");
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
  } catch (err: any) {
    error.value = "⚠️ Failed to reach AI server. Please try again later.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="fixed bottom-8 right-8 z-50 flex items-end">
    <!-- Chat Box（左側滑出） -->
    <transition name="slide-left">
      <div
        v-if="isOpen"
        class="mr-4 w-96 overflow-hidden rounded-2xl border border-base-300 bg-base-200 text-base-content shadow-2xl backdrop-blur-md"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-base-300 bg-base-300 px-4 py-2">
          <h3 class="text-sm font-semibold">💫 AI Vtuber Assistant</h3>
          <button
            class="text-xs text-base-content/70 transition hover:text-red-400"
            @click="toggleAssistant"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        <!-- Messages -->
        <div id="chat-scroll" class="h-72 space-y-3 overflow-y-auto px-4 py-3 text-sm">
          <template v-for="(msg, i) in messages" :key="i">
            <div v-if="msg.sender === 'ai'" class="flex items-start gap-2">
              <img src="/vtuber-avatar.png" class="h-8 w-8 rounded-full" />
              <div
                class="max-w-[80%] rounded-xl border border-base-300 bg-base-300 px-4 py-2 text-base-content"
              >
                {{ msg.text }}
              </div>
            </div>

            <div v-else class="flex justify-end">
              <div class="max-w-[80%] rounded-xl bg-primary px-4 py-2 text-primary-content">
                {{ msg.text }}
              </div>
            </div>
          </template>

          <div v-if="loading" class="mt-2 text-xs italic opacity-70">
            Typing<span class="animate-pulse">...</span>
          </div>
          <div v-if="error" class="mt-2 text-center text-xs text-error">
            {{ error }}
          </div>
        </div>

        <!-- Input -->
        <div class="flex items-center border-t border-base-300 bg-base-300 px-3 py-2">
          <input
            v-model="question"
            type="text"
            placeholder="Ask me about your code..."
            class="flex-1 bg-transparent text-sm text-base-content placeholder-base-content/60 focus:outline-none"
            :disabled="loading"
            @keyup.enter="askQuestion"
          />
          <button
            class="ml-2 rounded-md bg-primary px-3 py-1 text-sm text-primary-content hover:bg-primary/80 disabled:opacity-50"
            @click="askQuestion"
            :disabled="loading || !question.trim()"
          >
            <span v-if="loading" class="loading-spinner loading-sm loading"></span>
            <span v-else>Send</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- Avatar（固定右下） -->
    <div
      class="relative cursor-pointer transition-transform duration-300 hover:scale-110"
      @click="toggleAssistant"
    >
      <img src="/vtuber-avatar.png" alt="AI Vtuber" class="h-32 w-32 rounded-full shadow-2xl" />
      <div
        v-if="!isOpen"
        class="absolute -right-1 -top-1 h-4 w-4 animate-pulse rounded-full bg-green-400 ring ring-white"
      ></div>
      <p class="mt-1 text-center text-xs font-medium text-indigo-400">AI Vtuber</p>
    </div>
  </div>
</template>

<style scoped>
/* ✅ 左滑動畫 */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-left-enter-from {
  transform: translateX(20px);
  opacity: 0;
}
.slide-left-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

/* scrollbar 美化 */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background-color: rgba(120, 120, 120, 0.3);
  border-radius: 10px;
}
</style>
