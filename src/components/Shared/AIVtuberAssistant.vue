<script setup lang="ts">
import { ref, nextTick } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

const isOpen = ref(false);
const isMuted = ref(false); // 🔇 是否靜音
const question = ref("");
const loading = ref(false);
const error = ref<string | null>(null);
const messages = ref<{ sender: "user" | "ai"; html: string }[]>([]);

marked.use({
  async: false,
  renderer: {
    code(this: any, token: any): string {
      const code = token.text || "";
      const infoString = token.lang || "";
      const lang = (infoString || "").trim().toLowerCase();
      const validLang = lang && hljs.getLanguage(lang) ? lang : "plaintext";
      const highlighted = hljs.highlight(code, { language: validLang }).value;
      return `<pre><code class="hljs language-${validLang}">${highlighted}</code></pre>`;
    },
  },
});

function renderMarkdownSafe(text: string): string {
  const html = marked.parse(text) as string;
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "b",
      "i",
      "em",
      "strong",
      "a",
      "p",
      "pre",
      "code",
      "ul",
      "li",
      "ol",
      "br",
      "blockquote",
      "hr",
    ],
    ALLOWED_ATTR: ["href", "target"],
  });
}

// ✅ 開關聊天視窗
function toggleAssistant() {
  isOpen.value = !isOpen.value;
  error.value = null;
}

// ✅ 靜音切換
function toggleMute() {
  isMuted.value = !isMuted.value;
  if (isMuted.value) speechSynthesis.cancel();
}

// ✅ 語音播放
function speak(text: string) {
  if (isMuted.value) return; // 靜音時不播
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "zh-TW";
  utter.rate = 1;
  utter.pitch = 1.1;
  utter.volume = 1;
  speechSynthesis.speak(utter);
}

// ✅ 呼叫 OpenAI API
async function askQuestion() {
  if (!question.value.trim()) {
    error.value = "請輸入問題。";
    return;
  }

  const userMsg = question.value.trim();
  messages.value.push({
    sender: "user",
    html: DOMPurify.sanitize(userMsg),
  });

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
              "你是一位友善的 AI Vtuber 助手，位於線上程式測驗平台中。請以繁體中文回答，語氣自然親切，並使用 Markdown 格式清楚排版、著重重點。",
          },
          { role: "user", content: userMsg },
        ],
      }),
    });

    const data = await res.json();
    const aiReply = data?.choices?.[0]?.message?.content?.trim() || "(無回覆)";
    const safeHtml = renderMarkdownSafe(aiReply);
    messages.value.push({ sender: "ai", html: safeHtml });

    // 🔊 語音觸發條件
    const shouldSpeak =
      /你好|哈囉|這裡有一些|讓你參考|我來說明|總結一下|以下是|我幫你整理/.test(aiReply);

    if (!isMuted.value && shouldSpeak) {
      const plainText = aiReply
        .replace(/```[\s\S]*?```/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*#>`_~]/g, "")
        .replace(/\n+/g, "。");
      speak(plainText);
    }

    await nextTick();
    const chatBox = document.getElementById("chat-scroll");
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
  } catch (err: any) {
    error.value = "⚠️ 無法連線至 AI 伺服器，請稍後再試。";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="fixed bottom-8 right-8 z-50 flex items-end">
    <!-- Chat Box -->
    <transition name="slide-left">
      <div
        v-if="isOpen"
        class="mr-4 w-[32rem] overflow-hidden rounded-2xl border border-base-300 bg-base-200 text-base-content shadow-2xl backdrop-blur-md"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-base-300 bg-base-300 px-4 py-2"
        >
          <h3 class="text-sm font-semibold">💫 AI Vtuber Assistant</h3>
          <div class="flex items-center gap-3">
            <!-- 🔇 靜音切換 -->
            <button
              class="text-xs text-base-content/70 hover:text-primary transition"
              @click="toggleMute"
              :title="isMuted ? '點擊開啟語音' : '點擊靜音'"
            >
              <span v-if="isMuted">🔇</span>
              <span v-else>🔊</span>
            </button>
            <button
              class="text-xs text-base-content/70 transition hover:text-red-400"
              @click="toggleAssistant"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div id="chat-scroll" class="h-[28rem] space-y-4 overflow-y-auto px-5 py-4 text-sm">
          <template v-for="(msg, i) in messages" :key="i">
            <!-- AI -->
            <div v-if="msg.sender === 'ai'" class="flex items-start gap-2">
              <img src="/vtuber-avatar.png" class="h-8 w-8 rounded-full" />
              <div
                class="relative max-w-[90%] rounded-xl border border-base-300 bg-base-300 px-4 py-2 text-base-content prose prose-sm dark:prose-invert"
                v-html="msg.html"
              ></div>
            </div>

            <!-- USER -->
            <div v-else class="flex justify-end">
              <div
                class="max-w-[90%] rounded-xl bg-primary px-4 py-2 text-primary-content text-sm leading-relaxed"
                v-html="msg.html"
              ></div>
            </div>
          </template>

          <div v-if="loading" class="mt-2 text-xs italic opacity-70">
            Typing<span class="animate-pulse">...</span>
          </div>
          <div v-if="error" class="mt-2 text-center text-xs text-error">{{ error }}</div>
        </div>

        <!-- Input -->
        <div class="flex items-center border-t border-base-300 bg-base-300 px-3 py-2">
          <input
            v-model="question"
            type="text"
            placeholder="輸入問題或請教程式相關內容..."
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
            <span v-else>發送</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- Avatar -->
    <div
      class="relative cursor-pointer transition-transform duration-300 hover:scale-110"
      @click="toggleAssistant"
      tabindex="0"
      aria-label="Open AI assistant chat"
      @keyup.enter="toggleAssistant"
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
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-thumb {
  background-color: rgba(120, 120, 120, 0.3);
  border-radius: 10px;
}
</style>