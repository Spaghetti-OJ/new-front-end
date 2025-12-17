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
      showToast(error.response.data.message, "error");
    } else {
      alert("Failed to generate code");
    }
  }
}

// UI State
const toast = ref<{ message: string; type: "success" | "error" | "info" } | null>(null);

function showToast(message: string, type: "success" | "error" | "info" = "info") {
  toast.value = { message, type };
  setTimeout(() => {
    toast.value = null;
  }, 3000);
}

const deleteConfirm = ref<{
  show: boolean;
  target: "course" | "code";
  onConfirm: () => Promise<void>;
}>({
  show: false,
  target: "course",
  onConfirm: async () => {},
});

function deleteCode() {
  if (!courseCode.value) return;

  deleteConfirm.value = {
    show: true,
    target: "code",
    onConfirm: async () => {
      try {
        await api.Course.deleteInviteCode(courseId, courseCode.value);
        courseCode.value = "";
        showToast("Invite code deleted successfully.", "success");
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data?.message) {
          showToast(error.response.data.message, "error");
        } else {
          showToast("Failed to delete code", "error");
        }
      }
    },
  };
}

async function submitCourseEdit() {
  try {
    await api.Course.editCourse({
      course_id: Number(courseId),
      new_course: courseForm.value.name,
      teacher: courseForm.value.teacher,
    });
    showToast("Course updated successfully.", "success");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      showToast(error.response.data.message, "error");
    } else {
      showToast("Failed to update course", "error");
    }
  }
}

function deleteCourse() {
  deleteConfirm.value = {
    show: true,
    target: "course",
    onConfirm: async () => {
      try {
        await api.Course.deleteCourse({ course_id: Number(courseId) });
        showToast("Course deleted successfully.", "success");
        router.push("/courses");
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data?.message) {
          showToast(error.response.data.message, "error");
        } else {
          showToast("Failed to delete course", "error");
        }
      }
    },
  };
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
      homeworkCount: 0,
      submissionCount: 0,
      problemCount: 0,
    };

    try {
      const { data: summaryData } = await api.Course.getSummary();
      const currentCourseSummary = summaryData.breakdown.find(
        (c) => c.course === data.course.course || c.course === courseForm.value.name,
      );

      if (currentCourseSummary) {
        summary.value = {
          userCount: currentCourseSummary.userCount,
          homeworkCount: currentCourseSummary.homeworkCount,
          submissionCount: currentCourseSummary.submissionCount,
          problemCount: currentCourseSummary.problemCount,
        };
      }
    } catch (err) {
      console.warn("Could not fetch detailed summary:", err);
    }
  } catch (error) {
    console.error("Failed to fetch course info:", error);
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      showToast(error.response.data.message, "error");
    }
  }
}

onMounted(() => {
  fetchCourseInfo();
});
</script>

<template>
  <div>
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
              <div class="stat-title">Students</div>
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

    <!-- Toast -->
    <div v-if="toast" class="toast toast-end toast-bottom z-50">
      <div
        class="alert"
        :class="{
          'alert-success': toast.type === 'success',
          'alert-error': toast.type === 'error',
          'alert-info': toast.type === 'info',
        }"
      >
        <div>
          <span>{{ toast.message }}</span>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <input type="checkbox" id="delete-confirm-modal" class="modal-toggle" :checked="deleteConfirm.show" />
    <div class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">
          Confirm Delete
          {{ deleteConfirm.target === "course" ? "Course" : "Invite Code" }}
        </h3>
        <p class="py-4">
          Are you sure you want to delete this
          {{ deleteConfirm.target === "course" ? "course" : "invite code" }}?
          <span v-if="deleteConfirm.target === 'course'" class="font-bold text-error">
            This action cannot be undone.
          </span>
        </p>
        <div class="modal-action">
          <button class="btn" @click="deleteConfirm.show = false">Cancel</button>
          <button
            class="btn btn-error"
            @click="
              deleteConfirm.onConfirm();
              deleteConfirm.show = false;
            "
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
