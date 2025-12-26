<script setup lang="ts">
import { reactive, ref, computed, onBeforeUnmount } from "vue";
import { useTitle } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import useVuelidate from "@vuelidate/core";
import { required, minLength, sameAs } from "@vuelidate/validators";
import api from "@/api";

const route = useRoute();
const router = useRouter();

const tokenParam = computed(() => route.query.token);
const token = computed(() => {
  const t = tokenParam.value;
  if (Array.isArray(t)) return t[0] || "";
  return (t as string) || "";
});

const { t } = useI18n();

const form = reactive({
  username: "",
  password: "",
  confirmPassword: "",
});

const isResetMode = computed(() => !!token.value);
const invalidTokenError = ref("");

const rules = computed(() => {
  if (isResetMode.value) {
    return {
      password: { required, minLength: minLength(6) },
      confirmPassword: { required, sameAs: sameAs(form.password) },
    };
  } else {
    return {
      username: { required },
    };
  }
});

const v$ = useVuelidate(rules, form);

const showError = ref(false);
const errorMessage = ref("");
const success = ref(false);
const loading = ref(false);

let redirectTimer: ReturnType<typeof setTimeout> | null = null;

const validateToken = () => {
  if (tokenParam.value !== undefined) {
    if (!token.value || token.value.trim().length === 0) {
      invalidTokenError.value = "Invalid or missing reset token.";
    } else {
      invalidTokenError.value = "";
    }
  } else {
    invalidTokenError.value = "";
  }
};

import { watchEffect } from "vue";
watchEffect(() => {
  validateToken();
});

const handleForgotSubmit = async () => {
  if (!(await v$.value.$validate())) return;

  loading.value = true;
  showError.value = false;

  try {
    const res: any = await api.Auth.forgotPassword({ username: form.username });
    if (res.status === "ok" || !res.status) {
      success.value = true;
    } else {
      showError.value = true;
      errorMessage.value = res.message || t("password_reset.status.error");
    }
  } catch (err: any) {
    showError.value = true;
    errorMessage.value = err.response?.data?.message || t("password_reset.status.error");
  } finally {
    loading.value = false;
  }
};

const handleResetSubmit = async () => {
  if (invalidTokenError.value) return;
  if (!(await v$.value.$validate())) return;

  loading.value = true;
  showError.value = false;

  try {
    const res: any = await api.Auth.resetPassword({
      token: token.value,
      password: form.password,
    });

    if (res.status === "ok" || !res.status) {
      success.value = true;
      redirectTimer = setTimeout(() => {
        router.push("/");
      }, 3000);
    } else {
      showError.value = true;
      errorMessage.value = res.message || "Failed to reset password.";
    }
  } catch (err: any) {
    showError.value = true;
    errorMessage.value = err.response?.data?.message || "An error occurred.";
  } finally {
    loading.value = false;
  }
};

const handleSubmit = () => {
  if (isResetMode.value) {
    handleResetSubmit();
  } else {
    handleForgotSubmit();
  }
};

onBeforeUnmount(() => {
  if (redirectTimer) {
    clearTimeout(redirectTimer);
  }
});

useTitle(computed(() => (isResetMode.value ? "Reset Password" : "Forgot Password")));
</script>

<template>
  <div class="mx-4 flex max-w-4xl flex-col items-center justify-center gap-4 p-4 md:mx-auto">
    <h1 class="my-12 text-center text-4xl font-bold">
      {{ isResetMode ? "Reset Password" : t("password_reset.forgot-password") }}
    </h1>
    <div class="card w-96 max-w-full bg-base-200 shadow-xl">
      <div v-if="!success" class="card-body">
        <div class="card-title flex-col">
          <div v-if="showError || invalidTokenError" class="alert alert-error text-base">
            {{ invalidTokenError || errorMessage }}
            <div class="flex-none" v-if="!invalidTokenError">
              <button @click="showError = false" class="btn btn-circle btn-ghost btn-sm">X</button>
            </div>
          </div>
          <span class="text-base font-semibold" v-if="!invalidTokenError">
            {{ isResetMode ? "Enter your new password below." : t("password_reset.description") }}
          </span>
        </div>

        <div v-if="invalidTokenError">
          <!-- Empty div or instructions to retry -->
          <div class="text-center">
            <button class="btn btn-primary mt-4" @click="router.push('/reset-password')">
              Request New Link
            </button>
          </div>
        </div>

        <!-- Forgot Password Form -->
        <div v-else-if="!isResetMode" class="form-control">
          <input
            v-model="v$.username.$model"
            type="text"
            name="username"
            :placeholder="$t('auth.username')"
            :class="['input input-bordered', v$.username.$error && 'input-error']"
          />
          <label class="label" v-show="v$.username.$error">
            <span class="label-text-alt text-error" v-text="v$.username.$errors[0]?.$message" />
          </label>
        </div>

        <!-- Reset Password Form -->
        <template v-else>
          <div class="form-control">
            <label class="label">
              <span class="label-text">New Password</span>
            </label>
            <input
              v-model="v$.password.$model"
              type="password"
              placeholder="New Password"
              :class="['input input-bordered', v$.password.$error && 'input-error']"
            />
            <label class="label" v-show="v$.password.$error">
              <span class="label-text-alt text-error" v-text="v$.password.$errors[0]?.$message" />
            </label>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Confirm Password</span>
            </label>
            <input
              v-model="v$.confirmPassword.$model"
              type="password"
              placeholder="Confirm Password"
              :class="['input input-bordered', v$.confirmPassword.$error && 'input-error']"
            />
            <label class="label" v-show="v$.confirmPassword.$error">
              <span class="label-text-alt text-error" v-text="v$.confirmPassword.$errors[0]?.$message" />
            </label>
          </div>
        </template>

        <div class="card-actions mt-4 justify-center" v-if="!invalidTokenError">
          <button class="btn btn-primary" :class="{ loading }" :disabled="loading" @click="handleSubmit">
            {{ isResetMode ? "Reset Password" : t("password_reset.submit") }}
          </button>
        </div>
      </div>
      <div v-else class="card-body">
        <p class="text-lg">
          {{ token ? "Password reset successfully!" : t("password_reset.status.success") }}
        </p>
        <div class="card-actions mt-4 justify-center">
          <button class="btn btn-primary" @click="() => router.push('/')">
            {{ t("password_reset.return-home") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
