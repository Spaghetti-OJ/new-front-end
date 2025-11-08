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
    error.value = "Failed to reach AI server.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="fixed bottom-8 right-8 z-50 flex flex-col items-end">
    <!-- VTuber Avatar -->
    <div
      class="relative cursor-pointer transition-transform duration-300 hover:scale-110"
      @click="toggleAssistant"
    >
      <img
        src="/vtuber-avatar.png"
        alt="AI Vtuber"
        class="h-32 w-32 rounded-full shadow-2xl transition-transform duration-300 hover:scale-110"
      />
      <div
        v-if="!isOpen"
        class="absolute -top-1 -right-1 h-4 w-4 animate-pulse rounded-full bg-green-400 ring ring-white"
      ></div>
      <p class="text-xs text-indigo-400 mt-1 text-center font-medium">AI Vtuber</p>
    </div>

    <!-- Chat Box -->
    <transition name="fade">
      <div
        v-if="isOpen"
        class="mt-4 w-96 rounded-2xl border border-slate-700 bg-slate-800/90 backdrop-blur-md shadow-2xl overflow-hidden"
      >
        <!-- Header -->
        <div
          class="flex justify-between items-center px-4 py-2 border-b border-slate-700 bg-slate-900/70"
        >
          <h3 class="text-sm font-semibold text-blue-200">💫 AI Vtuber Assistant</h3>
          <button
            class="text-slate-400 hover:text-red-400 transition text-xs"
            @click="toggleAssistant"
          >
            ✕
          </button>
        </div>

        <!-- Messages -->
        <div
          id="chat-scroll"
          class="h-72 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth text-sm"
        >
          <template v-for="(msg, i) in messages" :key="i">
            <div
              v-if="msg.sender === 'ai'"
              class="flex items-start gap-2"
            >
              <img src="/vtuber-avatar.png" class="h-8 w-8 rounded-full" />
              <div
                class="px-4 py-2 rounded-xl bg-slate-700/70 text-slate-100 max-w-[80%] border border-slate-600"
              >
                {{ msg.text }}
              </div>
            </div>

            <div
              v-else
              class="flex justify-end"
            >
              <div
                class="px-4 py-2 rounded-xl bg-blue-600 text-white max-w-[80%]"
              >
                {{ msg.text }}
              </div>
            </div>
          </template>

          <div v-if="loading" class="text-xs text-slate-400 italic mt-2">
            Typing<span class="animate-pulse">...</span>
          </div>
        </div>

        <!-- Input -->
        <div
          class="flex items-center border-t border-slate-700 bg-slate-900/80 px-3 py-2"
        >
          <input
            v-model="question"
            type="text"
            placeholder="Ask me about your code..."
            class="flex-1 bg-transparent text-sm focus:outline-none text-slate-200 placeholder-slate-500"
            :disabled="loading"
            @keyup.enter="askQuestion"
          />
          <button
            class="ml-2 px-3 py-1 text-sm rounded-md bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
            @click="askQuestion"
            :disabled="loading || !question.trim()"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            <span v-else>Send</span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background-color: rgba(120, 120, 120, 0.3);
  border-radius: 10px;
}
</style>