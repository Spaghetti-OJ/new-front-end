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
      // Login failed after successful signup
      if (axios.isAxiosError(loginError)) {
        signupForm.errorMsg = t("errorCode.ERR001");
      } else {
        signupForm.errorMsg = t("errorCode.UNKNOWN");
      }
      return;
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
      <div class="card-body space-y-3 pt-0">
        <div class="card-title mb-2">Sign up</div>
        <div class="alert alert-error shadow-lg" v-if="signupForm.errorMsg">
          <div>
            <i-uil-times-circle />
            <span>{{ signupForm.errorMsg }}</span>
          </div>
        </div>
        <!-- Username -->
        <div class="form-control">
          <label class="label"><span class="label-text">Username</span></label>
          <input
            v-model="v$.username.$model"
            type="text"
            placeholder="username"
            class="input input-bordered"
            :class="v$.username.$error && 'input-error'"
          />
          <label class="label" v-if="v$.username.$error">
            <span class="label-text-alt text-error">Required</span>
          </label>
        </div>

        <!-- Email -->
        <div class="form-control">
          <label class="label"><span class="label-text">Email</span></label>
          <input
            v-model="v$.email.$model"
            type="email"
            placeholder="email"
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
          <label class="label"><span class="label-text">Real name</span></label>
          <input
            v-model="v$.realname.$model"
            type="text"
            placeholder="your full name"
            class="input input-bordered"
            :class="v$.realname.$error && 'input-error'"
          />
          <label class="label" v-if="v$.realname.$error">
            <span class="label-text-alt text-error">Required</span>
          </label>
        </div>

        <!-- Student ID -->
        <div class="form-control">
          <label class="label"><span class="label-text">Student ID</span></label>
          <input
            v-model="v$.studentID.$model"
            type="text"
            placeholder="student ID"
            class="input input-bordered"
            :class="v$.studentID.$error && 'input-error'"
          />
        </div>

        <!-- Password -->
        <div class="form-control">
          <label class="label"><span class="label-text">Password</span></label>
          <input
            v-model="v$.password.$model"
            type="password"
            placeholder="password"
            class="input input-bordered"
            :class="v$.password.$error && 'input-error'"
          />
          <label class="label" v-if="v$.password.$error">
            <span class="label-text-alt text-error">Required</span>
          </label>
        </div>

        <!-- Confirm Password -->
        <div class="form-control">
          <label class="label"><span class="label-text">Confirm Password</span></label>
          <input
            v-model="v$.confirmPassword.$model"
            type="password"
            placeholder="confirm password"
            class="input input-bordered"
            :class="v$.confirmPassword.$error && 'input-error'"
          />
          <label class="label" v-if="v$.confirmPassword.$error">
            <span class="label-text-alt text-error">Password does not match</span>
          </label>
        </div>

        <div class="form-control mt-4">
          <button class="btn btn-primary w-full" @click="signup">SIGN UP</button>
        </div>
      </div>
    </div>
  </div>
</template>
