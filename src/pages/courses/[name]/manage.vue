<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSession, UserRole } from "@/stores/session";
import api from "@/api";
import axios from "axios";

const route = useRoute();
const router = useRouter();
const session = useSession();

const courseId = route.params.name as string;

// Permission
const canEditCourse = computed(() => {
  return session.isAdmin || session.role === UserRole.Teacher;
});

// Course Form (replace with API later)
const courseForm = ref({
  name: "",
  teacher: "",
  tas: "",
});

// Summary Data
const summary = ref({
  userCount: 35,
  homeworkCount: 5,
  submissionCount: 120,
  problemCount: 12,
});

// Course Code
const courseCode = ref("");

async function generateCourseCode() {
  try {
    const { data } = await api.Course.generateInviteCode(courseId);
    courseCode.value = data.joinCode;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      alert(error.response.data.message);
    } else {
      alert("Failed to generate code");
    }
  }
}

async function deleteCode() {
  if (!courseCode.value) return;
  if (!confirm("Are you sure you want to delete this invite code?")) return;

  try {
    await api.Course.deleteInviteCode(courseId, courseCode.value);
    courseCode.value = "";
    alert("Invite code deleted successfully.");
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      alert(error.response.data.message);
    } else {
      alert("Failed to delete code");
    }
  }
}

async function submitCourseEdit() {
  if (!confirm("Are you sure you want to update this course?")) return;
  try {
    await api.Course.editCourse({
      course_id: Number(courseId),
      new_course: courseForm.value.name,
      teacher: courseForm.value.teacher,
    });
    alert("Course updated successfully.");
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      alert(error.response.data.message);
    } else {
      alert("Failed to update course");
    }
  }
}

async function deleteCourse() {
  if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;

  try {
    await api.Course.deleteCourse({ course_id: Number(courseId) });
    alert("Course deleted successfully.");
    router.push("/courses");
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      alert(error.response.data.message);
    } else {
      alert("Failed to delete course");
    }
  }
}

async function fetchCourseInfo() {
  try {
    const { data } = await api.Course.info(courseId);
    courseForm.value = {
      name: data.course.course,
      teacher: data.teacher.username,
      tas: data.TAs.map((ta) => ta.username).join(", "),
    };
    courseCode.value = data.course.joinCode;
    summary.value = {
      userCount: data.course.studentCount,
      // TODO: need more api support
      homeworkCount: 0,
      submissionCount: 0,
      problemCount: 0,
    };
  } catch (error) {
    console.error("Failed to fetch course info:", error);
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      alert(error.response.data.message);
    }
  }
}

onMounted(() => {
  fetchCourseInfo();
});
</script>

<template>
  <div class="card-container">
    <div class="card min-w-full">
      <div class="card-body">
        <div class="card-title mb-6">Manage Course – {{ courseId }}</div>

        <!-- Edit Course (Teacher/Admin only) -->
        <template v-if="canEditCourse">
          <div class="flex items-center gap-2 text-lg font-semibold">
            <i-uil-edit class="h-6 w-6" /> Edit Course
          </div>
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <!-- Course Name -->
            <div class="form-control w-full">
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

            <!-- Teacher -->
            <div class="form-control w-full">
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

            <!-- Teacher Assistants -->
            <div class="form-control w-full md:col-span-2">
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
          </div>

          <div class="mt-8 flex gap-4">
            <button class="btn btn-success" @click="submitCourseEdit">Submit</button>
            <button class="btn btn-outline btn-error" @click="deleteCourse">Delete Course</button>
          </div>
          <div class="divider my-8" />
        </template>

        <!-- Summary -->
        <div class="flex items-center gap-2 text-lg font-semibold">
          <i-uil-analytics class="h-6 w-6" /> Summary
        </div>

        <div class="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div class="stat rounded-lg bg-base-200">
            <div class="stat-figure text-primary">
              <i-uil-users-alt class="h-8 w-8" />
            </div>
            <div class="stat-title">Users</div>
            <div class="stat-value text-primary">
              {{ summary.userCount }}
            </div>
          </div>

          <div class="stat rounded-lg bg-base-200">
            <div class="stat-figure text-secondary">
              <i-uil-file-alt class="h-8 w-8" />
            </div>
            <div class="stat-title">Homeworks</div>
            <div class="stat-value text-secondary">
              {{ summary.homeworkCount }}
            </div>
          </div>

          <div class="stat rounded-lg bg-base-200">
            <div class="stat-figure text-accent">
              <i-uil-upload class="h-8 w-8" />
            </div>
            <div class="stat-title">Submissions</div>
            <div class="stat-value text-accent">
              {{ summary.submissionCount }}
            </div>
          </div>

          <div class="stat rounded-lg bg-base-200">
            <div class="stat-figure">
              <i-uil-puzzle-piece class="h-8 w-8" />
            </div>
            <div class="stat-title">Problems</div>
            <div class="stat-value">
              {{ summary.problemCount }}
            </div>
          </div>
        </div>

        <div class="mt-6 flex items-center gap-4">
          <button class="btn btn-success btn-sm" @click="generateCourseCode">Generate course code</button>

          <span class="font-mono text-lg font-bold tracking-wider">
            {{ courseCode || "—" }}
          </span>

          <button v-if="courseCode" class="btn btn-circle btn-ghost btn-sm text-error" @click="deleteCode">
            <i-uil-trash-alt class="h-5 w-5" />
          </button>
        </div>

        <div class="divider my-8" />

        <!-- Scoreboard -->
        <div class="mb-4 flex items-center gap-2 text-lg font-semibold">
          <i-uil-trophy class="h-6 w-6" /> Scoreboard
        </div>

        <div class="overflow-x-auto">
          <table class="table w-full">
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
                <th>1</th>
                <td>dog123</td>
                <td>熙氣ㄧ狗</td>
                <td>66</td>
              </tr>
              <tr>
                <th>2</th>
                <td>cat666</td>
                <td>奧貓</td>
                <td>64</td>
              </tr>
              <tr>
                <th>3</th>
                <td>lion7</td>
                <td>師大大師</td>
                <td>60</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
