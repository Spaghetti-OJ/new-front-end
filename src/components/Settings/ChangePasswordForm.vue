<script setup lang="ts">
import { reactive, toRef } from "vue";
import useVuelidate from "@vuelidate/core";
import { required, sameAs, helpers } from "@vuelidate/validators";
import api from "@/api";
const form = reactive({
  newPassword: "",
  confirmPassword: "",
  currentPassword: "",
  errorMsg: "",
  success: false,
});
const passwordForm = {
  old_password: "",
  new_password: "",
};
const rules = {
  newPassword: { required },
  confirmPassword: {
    required,
    sameAsNew: helpers.withMessage("Passwords do not match", sameAs(toRef(form, "newPassword"))),
  },
  currentPassword: { required },
};

const v$ = useVuelidate(rules, form);

async function change() {
  try {
    const res = await api.Auth.changePassword(passwordForm);
    if (res.status === "ok") {
      form.success = true;
    }
  } catch (e: any) {
    const errorData = e?.response?.data?.data;
    if (errorData) {
      if (errorData.old_password) {
        form.errorMsg = errorData.old_password[0];
      } else if (errorData.new_password) {
        form.errorMsg = errorData.new_password[0];
      }
    }
  }
}
async function submit() {
  const isFormCorrect = await v$.value.$validate();
  if (!isFormCorrect) return;
  form.success = false;
  form.errorMsg = "";
  passwordForm.old_password = form.currentPassword;
  passwordForm.new_password = form.newPassword;
  change();
}
</script>

<template>
  <div class="max-w-xl space-y-6">
    <h2 class="text-2xl font-semibold">{{ $t("settings.password.change") }}</h2>
    <!-- Current Password -->
    <div class="form-control">
      <label class="label">
        <span class="label-text">{{ $t("settings.password.current") }}</span>
      </label>
      <input
        type="password"
        v-model="v$.currentPassword.$model"
        class="input input-bordered"
        :placeholder="$t('settings.password.placeholder.current')"
        :class="v$.currentPassword.$error && 'input-error'"
      />
      <label class="label" v-if="v$.currentPassword.$error">
        <span class="label-text-alt text-error">{{ $t("settings.password.required") }}</span>
      </label>
    </div>

    <!-- New Password -->
    <div class="form-control">
      <label class="label">
        <span class="label-text">{{ $t("settings.password.new") }}</span>
      </label>
      <input
        type="password"
        v-model="v$.newPassword.$model"
        class="input input-bordered"
        :placeholder="$t('settings.password.placeholder.new')"
        :class="v$.newPassword.$error && 'input-error'"
      />
      <label class="label" v-if="v$.newPassword.$error">
        <span class="label-text-alt text-error">{{ $t("settings.password.required") }}</span>
      </label>
    </div>

    <!-- Confirm New Password -->
    <div class="form-control">
      <label class="label">
        <span class="label-text">{{ $t("settings.password.confirm") }}</span>
      </label>
      <input
        type="password"
        v-model="v$.confirmPassword.$model"
        class="input input-bordered"
        :placeholder="$t('settings.password.placeholder.again')"
        :class="v$.confirmPassword.$error && 'input-error'"
      />
      <label class="label" v-if="v$.confirmPassword.$error">
        <span class="label-text-alt text-error">
          {{
            v$.confirmPassword.required.$invalid
              ? $t("settings.password.required")
              : $t("profile.wrongPassword")
          }}
        </span>
      </label>
    </div>

    <!-- Submit Button -->
    <button class="btn btn-primary mt-4 w-full" @click="submit">{{ $t("settings.password.submit") }}</button>
    <div class="alert alert-error shadow-lg" v-if="form.errorMsg">
      <div>
        <i-uil-times-circle />
        <span>{{ form.errorMsg }}</span>
      </div>
    </div>
    <div class="alert alert-success shadow-lg" v-if="form.success">
      <div>
        <i-uil-times-circle />
        <span>{{ $t("settings.password.success") }}</span>
      </div>
    </div>
  </div>
</template>
