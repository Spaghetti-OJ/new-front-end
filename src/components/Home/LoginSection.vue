<script setup lang="ts">
import { reactive } from "vue";
import { useSession } from "@/stores/session";
import { useRoute, useRouter } from "vue-router";
import useVuelidate from "@vuelidate/core";
import { required } from "@vuelidate/validators";
import api from "@/api";
import axios from "axios";
import { useI18n } from "vue-i18n";
// @ts-ignore
import cowsay from "cowsay2";

const envMode = import.meta.env.MODE;
const envApiBaseUrl = import.meta.env.VITE_APP_API_BASE_URL;

const route = useRoute();
const router = useRouter();
const session = useSession();
const { t } = useI18n();

const loginForm = reactive({
  username: "",
  password: "",
  isLoading: false,
  errorMsg: "",
});
const rules = {
  username: { required },
  password: { required },
};
const v$ = useVuelidate(rules, loginForm);

async function login() {
  const isFormCorrect = await v$.value.$validate();
  if (!isFormCorrect) return;

  loginForm.isLoading = true;
  const body = {
    username: loginForm.username,
    password: loginForm.password,
  };
  try {
    const tokens = await api.Auth.login({ username: loginForm.username, password: loginForm.password });
    console.log(tokens);
    await session.setTokens(tokens.access, tokens.refresh);
    const redirect = (route.query.redirect as string) ?? "/";
    router.replace(redirect);
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.log(error);
      const status = error.response?.status;

      if (status === 401) {
        loginForm.errorMsg = t("errorCode.ERR001");
      } else {
        loginForm.errorMsg = t("errorCode.UNKNOWN");
      }
    } else {
      loginForm.errorMsg = t("errorCode.UNKNOWN");
      throw error;
    }
  } finally {
    loginForm.isLoading = false;
  }
}
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body">
        <div v-if="session.isNotValidated" class="flex justify-center">
          <ui-spinner />
        </div>
        <div v-else class="card-title mb-2">
          {{
            session.isLogin
              ? $t("components.loginSection.welcome", { user: session.username })
              : $t("components.loginSection.signin")
          }}
        </div>
        <template v-if="session.isNotLogin">
          <div class="alert alert-error shadow-lg" v-if="loginForm.errorMsg">
            <div>
              <i-uil-times-circle />
              <span>{{ loginForm.errorMsg }}</span>
            </div>
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">{{ $t("components.loginSection.username") }}</span>
            </label>
            <input
              v-model="v$.username.$model"
              type="text"
              name="username"
              :placeholder="$t('components.loginSection.placeholder.username')"
              :class="['input input-bordered', v$.username.$error && 'input-error']"
            />
            <label class="label" v-show="v$.username.$error">
              <span class="label-text-alt text-error" v-text="v$.username.$errors[0]?.$message" />
            </label>
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">{{ $t("components.loginSection.pw") }}</span>
            </label>
            <input
              v-model="v$.password.$model"
              type="password"
              name="password"
              :placeholder="$t('components.loginSection.placeholder.pw')"
              :class="['input input-bordered', v$.password.$error && 'input-error']"
              @keydown.enter="login"
            />
            <label class="label flex-row-reverse">
              <a href="/password_reset" class="link link-hover label-text-alt">{{
                $t("components.loginSection.forgot")
              }}</a>
              <span
                v-show="v$.password.$error"
                class="label-text-alt text-error"
                v-text="v$.password.$errors[0]?.$message"
              />
            </label>
          </div>
          <div class="form-control mt-6">
            <button :class="['btn btn-primary', loginForm.isLoading && 'loading']" @click="login">
              {{ $t("components.loginSection.button") }}
            </button>
          </div>
        </template>
        <pre class="text-base-100" v-text="cowsay.say(`MODE=${envMode}; API_BASE_URL=${envApiBaseUrl}`)" />
      </div>
    </div>
  </div>
</template>
