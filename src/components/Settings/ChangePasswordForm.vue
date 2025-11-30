<script setup lang="ts">
import { reactive } from "vue";
import useVuelidate from "@vuelidate/core";
import { required } from "@vuelidate/validators";

const form = reactive({
  newPassword: "",
  confirmPassword: "",
  currentPassword: "",
});

const rules = {
  newPassword: { required },
  confirmPassword: {
    required,
    sameAsNew(value: string) {
      return value === form.newPassword;
    },
  },
  currentPassword: { required },
};

const v$ = useVuelidate(rules, form);

function submit() {
  v$.value.$validate();
  console.log("UI only submit:", form);
}
</script>

<template>
  <div class="max-w-xl space-y-6">
    <h2 class="text-2xl font-semibold">Change Password</h2>

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
        <span class="label-text-alt text-error">Passwords do not match</span>
      </label>
    </div>

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

    <!-- Submit Button -->
    <button class="btn btn-primary mt-4 w-full" @click="submit">SUBMIT</button>
  </div>
</template>
