<script setup lang="ts">
import { reactive } from "vue";
import useVuelidate from "@vuelidate/core";
import { required, email } from "@vuelidate/validators";

const signupForm = reactive({
  username: "",
  email: "",
  realname: "",
  studentID: "",
  password: "",
  confirmPassword: "",
});

const rules = {
  username: { required },
  email: { required, email },
  realname: { required },
  studentID: { required },
  password: { required },
  confirmPassword: {
    required,
    sameAsPassword(value: string) {
      return value === signupForm.password;
    },
  },
};

const v$ = useVuelidate(rules, signupForm);

function signup() {
  v$.value.$validate();
}
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body pt-0">
        <div class="card-title mb-2">Sign up</div>

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
              {{ v$.email.email ? "Invalid email" : "Required" }}
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
          <label class="label" v-if="v$.studentID.$error">
            <span class="label-text-alt text-error">Required</span>
          </label>
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
