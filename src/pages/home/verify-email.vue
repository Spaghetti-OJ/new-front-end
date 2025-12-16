<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTitle } from "@vueuse/core";
import api from "@/api";

useTitle("Verify Email | Normal OJ");

const route = useRoute();
const router = useRouter();

const token = computed(() => (route.query.token as string) ?? "");
const status = ref<"idle" | "verifying" | "success" | "error">("idle");
const message = ref<string | null>(null);

async function verify() {
  if (!token.value) {
    status.value = "error";
    message.value = "Missing token in the link.";
    return;
  }
  status.value = "verifying";
  message.value = null;
  try {
    const res = await api.Auth.verifyEmail({ token: token.value });
    status.value = "success";
    message.value = res?.message ?? "Email verified successfully.";
  } catch (err: any) {
    status.value = "error";
    message.value =
      err?.response?.data?.message || err?.response?.data?.msg || "Verification failed. Please retry.";
  }
}

onMounted(() => {
  verify();
});

function goHome() {
  router.push("/");
}
</script>

<template>
  <div class="mx-auto flex min-h-[70vh] max-w-4xl flex-col px-4 py-10">
    <div class="card w-full shadow-xl">
      <div class="card-body space-y-6">
        <div class="flex items-center gap-3">
          <div class="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <i-uil-envelope-check class="h-7 w-7" />
          </div>
          <div>
            <h1 class="text-2xl font-bold">Verify your email</h1>
            <p class="text-sm text-neutral">We’re confirming the token from your email link.</p>
          </div>
        </div>

        <div class="rounded-2xl border bg-base-100">
          <div class="border-b px-6 py-4 text-sm font-semibold text-neutral">Status</div>
          <div class="px-6 py-5">
            <div v-if="status === 'verifying'" class="flex items-center gap-3 text-sm">
              <span class="loading-spinner loading-md loading text-primary" />
              <span>Verifying your email…</span>
            </div>
            <div v-else-if="status === 'success'" class="flex items-center gap-3 text-sm text-success">
              <i-uil-check-circle class="h-5 w-5" />
              <span class="text-base font-semibold uppercase">Success!</span>
            </div>
            <div v-else-if="status === 'error'" class="flex items-center gap-3 text-sm text-error">
              <i-uil-exclamation-circle class="h-5 w-5" />
              <span class="text-base font-semibold uppercase">Failed!</span>
            </div>
            <div v-else class="text-sm text-neutral">Ready to verify your token.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
