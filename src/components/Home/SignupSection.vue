<script setup lang="ts">
import { reactive, ref } from "vue";
import useVuelidate from "@vuelidate/core";
import { required, email } from "@vuelidate/validators";
import axios from "axios";
import api from "@/api";
import { useSession } from "@/stores/session";
import { useI18n } from "vue-i18n";
import LoginSection from "./LoginSection.vue";

const signupForm = reactive({
  username: "",
  email: "",
  realname: "",
  studentID: "",
  password: "",
  confirmPassword: "",
  errorMsg: "",
});
const isLoading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const session = useSession();
const { t } = useI18n();
const rules = {
  username: { required },
  email: { required, email },
  realname: { required },
  studentID: {},
  password: { required },
  confirmPassword: {
    required,
    sameAsPassword(value: string) {
      return value === signupForm.password;
    },
  },
};

const v$ = useVuelidate(rules, signupForm);
async function signup() {
  if (isLoading.value) return;
  const isFormCorrect = await v$.value.$validate();
  if (!isFormCorrect) return;
  isLoading.value = true;
  signupForm.errorMsg = "";

  const body = {
    username: signupForm.username,
    email: signupForm.email,
    password: signupForm.password,
    real_name: signupForm.realname,
    role: "student" as const,
    student_id: signupForm.studentID || undefined,
    bio: "",
  };

  try {
    await api.Auth.signup(body);
    try {
      const tokens = await api.Auth.login({ username: signupForm.username, password: signupForm.password });
      await session.setTokens(tokens.access, tokens.refresh);
    } catch (loginError) {
      signupForm.errorMsg = axios.isAxiosError(loginError) ? t("errorCode.ERR001") : t("errorCode.UNKNOWN");
    }
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response?.status;
      const data = error.response?.data;
      if (data && typeof data === "object" && !Array.isArray(data)) {
        const firstKey = Object.keys(data)[0];
        const firstMsg = Array.isArray((data as any)[firstKey])
          ? (data as any)[firstKey][0]
          : String((data as any)[firstKey]);
        if (status === 400 && firstMsg === "A user with that username already exists.") {
          signupForm.errorMsg = t("errorCode.ERR003");
        } else if (status === 400 && firstMsg === "user with this email already exists.") {
          signupForm.errorMsg = t("errorCode.ERR004");
        } else {
          signupForm.errorMsg = t("errorCode.UNKNOWN");
        }
      } else {
        signupForm.errorMsg = t("errorCode.UNKNOWN");
      }
    } else {
      signupForm.errorMsg = t("errorCode.UNKNOWN");
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="card-container">
    <LoginSection v-if="session.isLogin" />
    <div v-else class="card min-w-full">
      <form class="card-body space-y-3 pt-0" @submit.prevent="signup">
        <div class="card-title mb-2">{{ $t("components.loginSection.signup") }}</div>
        <div class="alert alert-error shadow-lg" v-if="signupForm.errorMsg">
          <div>
            <i-uil-times-circle />
            <span>{{ signupForm.errorMsg }}</span>
          </div>
        </div>
        <!-- Username -->
        <div class="form-control">
          <label class="label"><span class="label-text">{{ $t("profile.username") }}</span></label>
          <input
            v-model="v$.username.$model"
            type="text"
            :placeholder="t('profile.username-placeholder')"
            class="input input-bordered"
            :class="v$.username.$error && 'input-error'"
          />
          <label class="label" v-if="v$.username.$error">
            <span class="label-text-alt text-error">{{ $t("profile.required") }}</span>
          </label>
        </div>

        <!-- Email -->
        <div class="form-control">
          <label class="label"><span class="label-text">{{ $t("profile.email") }}</span></label>
          <input
            v-model="v$.email.$model"
            type="email"
            :placeholder="t('profile.email')"
            class="input input-bordered"
            :class="v$.email.$error && 'input-error'"
          />
          <label class="label" v-if="v$.email.$error">
            <span class="label-text-alt text-error">
              {{ v$.email.required.$invalid ? "Required" : v$.email.email.$invalid ? "Invalid email" : "" }}
            </span>
          </label>
        </div>

        <!-- Real Name -->
        <div class="form-control">
          <label class="label"><span class="label-text">{{ $t("profile.realName") }}</span></label>
          <input
            v-model="v$.realname.$model"
            type="text"
            :placeholder="t('profile.realName')"
            class="input input-bordered"
            :class="v$.realname.$error && 'input-error'"
          />
          <label class="label" v-if="v$.realname.$error">
            <span class="label-text-alt text-error">{{ $t("profile.required") }}</span>
          </label>
        </div>

        <!-- Student ID -->
        <div class="form-control">
          <label class="label"><span class="label-text">{{ $t("profile.studentId") }}</span></label>
          <input
            v-model="v$.studentID.$model"
            type="text"
            :placeholder="t('profile.studentId')"
            class="input input-bordered"
            :class="v$.studentID.$error && 'input-error'"
          />
        </div>

        <!-- Password -->
        <div class="form-control">
          <label class="label"><span class="label-text">{{ $t("profile.password") }}</span></label>
          <input
            v-model="v$.password.$model"
            type="password"
            :placeholder="t('profile.password')"
            class="input input-bordered"
            :class="v$.password.$error && 'input-error'"
          />
          <label class="label" v-if="v$.password.$error">
            <span class="label-text-alt text-error">{{ $t("profile.required") }}</span>
          </label>
        </div>

        <!-- Confirm Password -->
        <div class="form-control">
          <label class="label"><span class="label-text">{{ $t("profile.confirm") }}</span></label>
          <input
            v-model="v$.confirmPassword.$model"
            type="password"
            :placeholder="t('profile.confirm')"
            class="input input-bordered"
            :class="v$.confirmPassword.$error && 'input-error'"
          />
          <label class="label" v-if="v$.confirmPassword.$error">
            <span class="label-text-alt text-error">{{ $t("profile.rules.confirmPassword.sameAsRef") }}</span>
          </label>
        </div>

        <div class="form-control mt-4">
          <button
            class="btn btn-primary w-full"
            :class="isLoading && 'loading'"
            type="submit"
            :disabled="isLoading"
          >
            {{ $t("components.loginSection.signup") }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
