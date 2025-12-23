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
  success: "",
});
const passwordform = {
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
    const res = await api.Auth.changePassword(passwordform);
    if (res.status === "ok") {
      form.success = "1";
    }
  } catch (e) {
    if (e.response?.data.data.old_password) {
      form.errorMsg = e.response?.data.data.old_password[0];
    }
    if (e.response?.data.data.new_password) {
      form.errorMsg = e.response?.data.data.new_password[0];
    }
  }
}
function submit() {
  v$.value.$validate();
  form.success = "";
  form.errorMsg = "";
  passwordform.old_password = form.currentPassword;
  passwordform.new_password = form.newPassword;
  change();
}
</script>

<template>
  <div class="max-w-xl space-y-6">
    <h2 class="text-2xl font-semibold">Change Password</h2>
    <!-- Current Password -->
    <div class="form-control">
      <label class="label">
        <span class="label-text">Current Password</span>
      </label>
      <input
        type="password"
        v-model="v$.currentPassword.$model"
        class="input input-bordered"
        placeholder="current password"
        :class="v$.currentPassword.$error && 'input-error'"
      />
      <label class="label" v-if="v$.currentPassword.$error">
        <span class="label-text-alt text-error">Required</span>
      </label>
    </div>

    <!-- New Password -->
    <div class="form-control">
      <label class="label">
        <span class="label-text">New Password</span>
      </label>
      <input
        type="password"
        v-model="v$.newPassword.$model"
        class="input input-bordered"
        placeholder="new password"
        :class="v$.newPassword.$error && 'input-error'"
      />
      <label class="label" v-if="v$.newPassword.$error">
        <span class="label-text-alt text-error">Required</span>
      </label>
    </div>

    <!-- Confirm New Password -->
    <div class="form-control">
      <label class="label">
        <span class="label-text">Confirm New Password</span>
      </label>
      <input
        type="password"
        v-model="v$.confirmPassword.$model"
        class="input input-bordered"
        placeholder="new password again"
        :class="v$.confirmPassword.$error && 'input-error'"
      />
      <label class="label" v-if="v$.confirmPassword.$error">
        <span class="label-text-alt text-error">
          {{ v$.confirmPassword.required.$invalid ? "Required" : "Passwords do not match" }}
        </span>
      </label>
    </div>

    <!-- Submit Button -->
    <button class="btn btn-primary mt-4 w-full" @click="submit">SUBMIT</button>
    <div class="alert alert-error shadow-lg" v-if="form.errorMsg">
      <div>
        <i-uil-times-circle />
        <span>{{ form.errorMsg }}</span>
      </div>
    </div>
    <div class="alert alert-success shadow-lg" v-if="form.success">
      <div>
        <i-uil-times-circle />
        <span>Password changed successfully.</span>
      </div>
    </div>
  </div>
</template>
