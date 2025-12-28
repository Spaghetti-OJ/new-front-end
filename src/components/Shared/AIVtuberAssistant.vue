<script setup lang="ts">
import { ref, nextTick, computed } from "vue";
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
// ===== Draggable + Snap + Inertia AI Vtuber =====
import { onMounted, onBeforeUnmount } from "vue";

const position = ref({
  x: window.innerWidth - 220,
  y: window.innerHeight - 200,
});
const viewport = ref({
  width: window.innerWidth,
  height: window.innerHeight,
});

const AVATAR_SIZE = 128;
const AVATAR_TOTAL_HEIGHT = 160;
const CHAT_WIDTH = 512;
const CHAT_HEIGHT = 520;
const MARGIN = 20;
const CHAT_GAP = 16;
const INERTIA_VELOCITY_MULTIPLIER = 20;
const INERTIA_FRICTION = 0.95;
const INERTIA_THRESHOLD = 0.05;
const DRAG_THRESHOLD = 4;

const isDragging = ref(false);
const hasDragged = ref(false);
const dragStart = { x: 0, y: 0 };
let offsetX = 0;
let offsetY = 0;

let lastX = 0;
let lastY = 0;
let lastTime = 0;

let velocityX = 0;
let velocityY = 0;
let resizeHandler: (() => void) | null = null;

// 拖曳開始
function startDrag(e: MouseEvent) {
  if ((e.target as HTMLElement).closest("input, button, textarea, a")) return;

  isDragging.value = true;
  hasDragged.value = false;
  dragStart.x = e.clientX;
  dragStart.y = e.clientY;

  // 拖曳透明度變化
  document.body.classList.add("dragging-vtuber");

  offsetX = e.clientX - position.value.x;
  offsetY = e.clientY - position.value.y;

  lastX = e.clientX;
  lastY = e.clientY;
  lastTime = performance.now();

  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", stopDrag);

  e.preventDefault();
}

// 拖曳中
function onDrag(e: MouseEvent) {
  if (!isDragging.value) return;

  if (!hasDragged.value) {
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      hasDragged.value = true;
    }
  }

  const now = performance.now();
  const dt = now - lastTime;

  if (dt > 0) {
    velocityX = (e.clientX - lastX) / dt;
    velocityY = (e.clientY - lastY) / dt;
  } else {
    velocityX = 0;
    velocityY = 0;
  }

  lastX = e.clientX;
  lastY = e.clientY;
  lastTime = now;

  position.value.x = e.clientX - offsetX;
  position.value.y = e.clientY - offsetY;

  clampAvatarPosition();
}

function clampAvatarPosition() {
  const maxX = viewport.value.width - AVATAR_SIZE - MARGIN;
  const maxY = viewport.value.height - AVATAR_TOTAL_HEIGHT - MARGIN;

  position.value.x = maxX;
  position.value.y = Math.max(MARGIN, Math.min(maxY, position.value.y));
}

function clampPosition() {
  clampAvatarPosition();
}

const chatPosition = computed(() => {
  const leftX = position.value.x - CHAT_WIDTH - CHAT_GAP;
  const rightX = position.value.x + AVATAR_SIZE + CHAT_GAP;

  const fitsLeft = leftX >= MARGIN;
  const fitsRight = rightX + CHAT_WIDTH <= viewport.value.width - MARGIN;

  let left = MARGIN;
  if (fitsLeft) {
    left = leftX;
  } else if (fitsRight) {
    left = rightX;
  }

  const maxTop = viewport.value.height - CHAT_HEIGHT - MARGIN;
  const top = Math.max(MARGIN, Math.min(maxTop, position.value.y));

  return { left, top };
});

// 拖曳停止 + 慣性 + 吸附邊界
function stopDrag() {
  isDragging.value = false;

  document.body.classList.remove("dragging-vtuber");

  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);

  applyInertiaAndSnap();

  if (hasDragged.value) {
    void nextTick(() => {
      hasDragged.value = false;
    });
  }
}

// 慣性移動 + 吸附邊界
function applyInertiaAndSnap() {
  let friction = INERTIA_FRICTION;
  let threshold = INERTIA_THRESHOLD;

  function animate() {
    velocityX *= friction;
    velocityY *= friction;

    position.value.x += velocityX * INERTIA_VELOCITY_MULTIPLIER;
    position.value.y += velocityY * INERTIA_VELOCITY_MULTIPLIER;

    clampAvatarPosition();

    if (Math.abs(velocityX) > threshold || Math.abs(velocityY) > threshold) {
      requestAnimationFrame(animate);
    } else {
      snapToEdge();
    }
  }

  animate();
}

// 🔥 自動吸附邊界
function snapToEdge() {
  const width = AVATAR_SIZE;
  const height = AVATAR_TOTAL_HEIGHT;

  const maxX = viewport.value.width - width - MARGIN;
  const maxY = viewport.value.height - height - MARGIN;

  position.value.x = maxX;
  position.value.y = Math.max(MARGIN, Math.min(maxY, position.value.y));
}

onMounted(() => {
  position.value = {
    x: window.innerWidth - 220,
    y: window.innerHeight - AVATAR_TOTAL_HEIGHT - MARGIN,
  };
  resizeHandler = () => {
    viewport.value = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    clampPosition();
  };
  window.addEventListener("resize", resizeHandler);
  clampPosition();
});

onBeforeUnmount(() => {
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
  }
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
function toggleAssistant(event?: Event) {
  if (
    (event instanceof MouseEvent || event instanceof PointerEvent) &&
    (isDragging.value || hasDragged.value)
  ) {
    return;
  }
  isOpen.value = !isOpen.value;
  error.value = null;
  void nextTick(() => {
    clampPosition();
    snapToEdge();
  });
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
  utter.rate = 1.3;
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
    const shouldSpeak = /你好|哈囉|這裡有一些|讓你參考|我來說明|總結一下|以下是|我幫你整理/.test(aiReply);

    if (!isMuted.value && shouldSpeak) {
      const plainText = aiReply
        .replace(/```[\s\S]*?```/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*#>`_~]/g, "")
        .replace(/\n+/g, "。")
        .replace(/\p{Extended_Pictographic}/gu, "");
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
  <div class="pointer-events-none fixed inset-0 z-50">
    <!-- Chat Box -->
    <transition name="slide-left">
      <div
        v-if="isOpen && !isDragging"
        class="pointer-events-auto absolute w-[32rem] overflow-hidden rounded-2xl border border-base-300 bg-base-200 text-base-content shadow-2xl backdrop-blur-md"
        :style="{ top: chatPosition.top + 'px', left: chatPosition.left + 'px' }"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-base-300 bg-base-300 px-4 py-2">
          <h3 class="text-sm font-semibold">💫 AI Vtuber Assistant</h3>
          <div class="flex items-center gap-3">
            <!-- 🔇 靜音切換 -->
            <button
              class="text-xs text-base-content/70 transition hover:text-primary"
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
                class="prose prose-sm relative max-w-[90%] rounded-xl border border-base-300 bg-base-300 px-4 py-2 text-base-content dark:prose-invert"
                v-html="msg.html"
              ></div>
            </div>

            <!-- USER -->
            <div v-else class="flex justify-end">
              <div
                class="max-w-[90%] rounded-xl bg-primary px-4 py-2 text-sm leading-relaxed text-primary-content"
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
            :placeholder="$t('components.ai-vtuber.inputPlaceholder')"
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
            <span v-else>{{ $t("components.ai-vtuber.sendButton") }}</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- Avatar -->
    <div
      class="pointer-events-auto absolute cursor-pointer"
      :style="{ top: position.y + 'px', left: position.x + 'px' }"
      @mousedown="startDrag"
    >
      <div
        class="relative cursor-pointer transition-transform duration-300 hover:scale-110"
        @click="toggleAssistant"
        tabindex="0"
        aria-label="Open AI assistant chat"
        role="button"
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
  </div>
</template>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.dragging-vtuber * {
  opacity: 0.85;
  cursor: grabbing !important;
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
