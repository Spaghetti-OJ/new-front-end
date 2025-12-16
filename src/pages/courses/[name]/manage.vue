<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useSession, UserRole } from "@/stores/session";

const route = useRoute();
const session = useSession();

const courseName = route.params.name as string;

// ===== Permission =====
const canEditCourse = computed(() => {
  return session.isAdmin || session.role === UserRole.Teacher;
});

// ===== Demo Course Form (replace with API later) =====
const courseForm = ref({
  name: "",
  teacher: "",
  tas: "",
});

// ===== Demo Summary Data =====
const summary = ref({
  userCount: 35,
  homeworkCount: 5,
  submissionCount: 120,
  problemCount: 12,
});

// ===== Course Code =====
const courseCode = ref("abc1234567");

function generateCourseCode() {
  courseCode.value = Math.random().toString(36).substring(2, 10);
}

function deleteCode() {
  courseCode.value = "";
}

function submitCourseEdit() {
  console.log("Submit course edit:", courseForm.value);
}

function deleteCourse() {
  if (confirm("Are you sure you want to delete this course?")) {
    console.log("Delete course:", courseName);
  }
}
</script>

<template>
  <div class="max-w-6xl p-6">
    <!-- Page Title -->
    <h1 class="mb-8 text-3xl font-bold">Manage Course – {{ courseName }}</h1>

    <!-- ======================= -->
    <!-- Edit Course (Teacher/Admin only) -->
    <!-- ======================= -->
    <div v-if="canEditCourse" class="mb-10 rounded-xl border bg-base-100 p-6 shadow-sm">
      <h2 class="mb-6 text-xl font-semibold">Edit Course</h2>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <!-- Course Name -->
        <div>
          <label class="label">
            <span class="label-text">Course Name</span>
          </label>
          <input
            v-model="courseForm.name"
            type="text"
            class="input input-bordered w-full"
            placeholder="Course name"
          />
        </div>

        <!-- Teacher Assistants -->
        <div>
          <label class="label">
            <span class="label-text">Teacher Assistants</span>
          </label>
          <input
            v-model="courseForm.tas"
            type="text"
            class="input input-bordered w-full"
            placeholder="TA usernames (comma separated)"
          />
        </div>

        <!-- Teacher -->
        <div>
          <label class="label">
            <span class="label-text">Teacher</span>
          </label>
          <input
            v-model="courseForm.teacher"
            type="text"
            class="input input-bordered w-full"
            placeholder="Teacher username"
          />
        </div>
      </div>

      <div class="mt-8 flex gap-4">
        <button class="btn btn-success" @click="submitCourseEdit">Submit</button>

        <button class="btn btn-outline btn-error" @click="deleteCourse">Delete Course</button>
      </div>
    </div>

    <!-- ======================= -->
    <!-- Summary -->
    <!-- ======================= -->
    <div class="mb-10 rounded-xl border bg-base-100 p-6 shadow-sm">
      <h2 class="mb-6 text-xl font-semibold">Summary</h2>

      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div class="stat rounded-lg bg-base-200">
          <div class="stat-title">Users</div>
          <div class="stat-value text-primary">
            {{ summary.userCount }}
          </div>
        </div>

        <div class="stat rounded-lg bg-base-200">
          <div class="stat-title">Homeworks</div>
          <div class="stat-value text-secondary">
            {{ summary.homeworkCount }}
          </div>
        </div>

        <div class="stat rounded-lg bg-base-200">
          <div class="stat-title">Submissions</div>
          <div class="stat-value">
            {{ summary.submissionCount }}
          </div>
        </div>

        <div class="stat rounded-lg bg-base-200">
          <div class="stat-title">Problems</div>
          <div class="stat-value">
            {{ summary.problemCount }}
          </div>
        </div>
      </div>

      <div class="mt-6 flex items-center gap-4">
        <button class="btn btn-success btn-sm" @click="generateCourseCode">Generate course code</button>

        <span class="font-mono text-lg">
          {{ courseCode || "—" }}
        </span>

        <button v-if="courseCode" class="btn btn-ghost btn-sm" @click="deleteCode">🗑</button>
      </div>
    </div>

    <!-- ======================= -->
    <!-- Scoreboard -->
    <!-- ======================= -->
    <div class="rounded-xl border bg-base-100 p-6 shadow-sm">
      <h2 class="mb-6 text-xl font-semibold">Scoreboard</h2>

      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>Rank</th>
            <th>User</th>
            <th>Username</th>
            <th>AC Count</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>1</td>
            <td>dog123</td>
            <td>熙氣ㄧ狗</td>
            <td>66</td>
          </tr>

          <tr>
            <td>2</td>
            <td>cat666</td>
            <td>奧貓</td>
            <td>64</td>
          </tr>

          <tr>
            <td>3</td>
            <td>lion7</td>
            <td>師大大師</td>
            <td>60</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
