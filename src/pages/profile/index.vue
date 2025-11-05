<script setup lang="ts">
import { reactive, toRef } from "vue";
import { useRouter } from "vue-router";
import api from "@/api";
import { useSession } from "@/stores/session";
import { useTitle } from "@vueuse/core";
import { required, sameAs, helpers } from "@vuelidate/validators";
import useVuelidate from "@vuelidate/core";
import axios from "axios";
import { useI18n } from "vue-i18n";
import ProfileLayout from "@/components/Profile/ProfileLayout.vue";
import ProfileAvatarBlock from "@/components/Profile/ProfileAvatarBlock.vue";
import ProfileField from "@/components/Profile/ProfileField.vue";
import ProfileProgressBar from "@/components/Profile/ProfileProgressBar.vue";

useTitle("Profile | Normal OJ");
const router = useRouter();
const session = useSession();
const ROLE = ["Admin", "Teacher", "Student"];
const { t } = useI18n();
const refreshtype = {
  refresh: session.refreshtoken,
};

const changePasswordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
  isLoading: false,
  errorMsg: "",
  isFinished: false,
});
// TODO: integrate vue-i18n & Vuelidate error message
const rules = {
  newPassword: { required },
  oldPassword: { required },
  confirmPassword: {
    required,
    sameAsRef: helpers.withMessage(
      t("profile.rules.confirmPassword.sameAsRef"),
      sameAs(toRef(changePasswordForm, "newPassword")),
    ),
  },
};
const v$ = useVuelidate(rules, changePasswordForm);

async function changePassword() {
  const isFormCorrect = await v$.value.$validate();
  if (!isFormCorrect) return;
  changePasswordForm.errorMsg = "";
  changePasswordForm.isFinished = false;
  changePasswordForm.isLoading = true;
  try {
    await api.Auth.changePassword({
      old_password: changePasswordForm.oldPassword,
      new_password: changePasswordForm.newPassword,
    });
    clearForm();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.data.message === "Wrong Password") {
        changePasswordForm.errorMsg = t("profile.wrongPassword");
      } else {
        changePasswordForm.errorMsg = t("profile.operationFailed");
      }
    } else {
      throw error;
    }
  } finally {
    changePasswordForm.isLoading = false;
  }
}

function clearForm() {
  changePasswordForm.oldPassword = "";
  changePasswordForm.newPassword = "";
  changePasswordForm.confirmPassword = "";
  changePasswordForm.isFinished = true;
  v$.value.$reset();
}

const user = {
  realName: "陳育渝",
  username: "doggggg",
  role: "Student",
  email: "41247057S@gapps.ntnu.edu.tw",
  id: "41247057S",
  studentId: "41247057S",
  intro: "哈囉我是資工116",
  avatar: "",
};
const heatmapData = [
  { date: "2025-01-01", count: 5 },
  { date: "2025-01-02", count: 1 },
  { date: "2025-01-03", count: 0 },
  { date: "2025-01-04", count: 8 },
  { date: "2025-01-05", count: 3 },
  { date: "2025-01-06", count: 2 },
  { date: "2025-01-07", count: 6 },
  { date: "2025-01-08", count: 0 },
  { date: "2025-01-09", count: 10 },
  { date: "2025-01-10", count: 4 },
  { date: "2025-01-11", count: 7 },
  { date: "2025-01-12", count: 2 },
  { date: "2025-01-13", count: 1 },
  { date: "2025-01-14", count: 9 },
  { date: "2025-01-15", count: 3 },
  { date: "2025-01-16", count: 0 },
  { date: "2025-01-17", count: 6 },
  { date: "2025-01-18", count: 4 },
  { date: "2025-01-19", count: 1 },
  { date: "2025-01-20", count: 5 },
  { date: "2025-01-21", count: 3 },
  { date: "2025-01-22", count: 2 },
  { date: "2025-01-23", count: 8 },
  { date: "2025-01-24", count: 10 },
  { date: "2025-01-25", count: 0 },
];

const form = reactive({ ...user });

function onAvatarAction(action: "Edit" | "Sign Out") {
  if (action === "Edit") {
    // 這裡之後接 API，把 form 丟出去
    console.log("Save profile", { ...form });
  }
  if (action === "Sign Out") {
    // 還原成原本 user
    Object.assign(form, user);
    console.log("Cancel edit, reset form");
  }
}

function onAvatarUpload(file: File) {
  console.log("avatar file for upload:", file);
  // 之後接 API，上傳成功後更新 form.avatar
}
</script>

<template>
  <ProfileLayout>
    <!-- 左邊：頭貼，可編輯 -->
    <template #left>
      <ProfileAvatarBlock :avatar-url="form.avatar" :editable-avatar="false" :buttons="[
        { label: t('profile.edit'), variant: 'primary', action: 'Edit' },
        { label: t('profile.signOut'), variant: 'error', action: 'Sign Out' },
      ]" @click="onAvatarAction" @upload="onAvatarUpload" />
    </template>

    <!-- 右邊：可編輯資訊欄 -->
    <template #right>
      <section class="w-full">
        <div class="grid grid-cols-1 gap-x-[33px] gap-y-4 md:grid-cols-[minmax(0,35%)_minmax(0,65%)]">
          <ProfileField :label="t('profile.realName')" :model-value="form.realName" :editable="false" />
          <ProfileField :label="t('profile.username')" :model-value="form.username" :editable="false" />
          <ProfileField :label="t('profile.role')" :model-value="form.role" :editable="false" />
          <ProfileField :label="t('profile.email')" :model-value="form.email" :editable="false" type="email" />
          <ProfileField :label="t('profile.userId')" :model-value="form.id" :editable="false" />
          <ProfileField :label="t('profile.studentId')" :model-value="user.studentId" />
          <ProfileField :label="t('profile.introduction')" :model-value="form.intro" :editable="false" type="textarea"
            container-class="md:col-span-2" />
        </div>
        <div class="mt-4">
          <ProfileProgressBar :contributions="heatmapData" :submission="204" :acceptance="100" :totalsolved="135"
            :data="{ easy: 75, med: 40, hard: 20 }" :beatrate="15.27" />
        </div>
      </section>
    </template>
  </ProfileLayout>
</template>

<style scoped>
:root {
  --pad: 23px;
}

/* 版面 */
.profile {
  max-width: 1120px;
  margin: 24px auto 56px;
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 32px;
  color: var(--ink);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
}

/* 左欄 */
.left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px
}

.avatar-wrap {
  width: 260px;
  height: 260px
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #eee;
  object-fit: cover;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 220px
}

.btn {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 24px;
  border: 2px solid;
  font-weight: 700;
  background: #fff;
  cursor: pointer;
}

.btn-edit {
  border-color: #A0B4F0;
  color: #A0B4F0;
}

.btn-signout {
  border-color: #F0A0A0;
  color: #F0A0A0
}

/* 右欄：資訊格 */
.right {
  display: flex;
  flex-direction: column;
  gap: 24px
}

.info-grid {
  display: grid;
  grid-template-columns: 275px 342px;
  column-gap: 33px;
  /* 固定間隔 */
  row-gap: 18px;
  justify-content: start;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 14px;
  letter-spacing: .08em;
  font-weight: 800
}

.box {
  background-color: #D9D9D9;
  color: #000;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 20px;
  height: 48px;
  display: flex;
  align-items: center;
}

.w-275 {
  width: 275px;
}

.w-342 {
  width: 342px;
}

.w-650 {
  width: 650px;
}


/* 統計區 */

.stats,
.stats * {
  box-sizing: border-box;
  /* 寬高計算含 padding + border，不會超出規劃 */
}

.stats .heatmap-card {
  width: 650px;
  height: 266px;
  background: #D9D9D9;
  border-radius: 32px;
  padding: 23px;
  display: flex;
}

.stats>label {
  display: block;
  /* 讓 label 佔整行 */
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 12px;
  /* 🔸加這行：跟下面框距離 12px，可自行調整 */
}

.stats-grid {
  display: grid;
  grid-template-columns: 372px 209px;
  /* 左自適應 + 右 209 */
  column-gap: 22px;
  /* 左右欄間距 22 */
  width: 100%;
  height: 220px !important;
}

/* 左欄：總高 220 = 99 + 23 + 98 */
.left-col {
  display: grid;
  grid-template-rows: 99px minmax(98px, 1fr);
  row-gap: 23px;
  /* 熱力圖與 KPI 間距 23 */
  height: 220px !important;
}

.heatmap {
  width: 100%;
  height: 99px;
  padding: 6px;
  border-radius: 10px;
  background: #f3f3f3;
  /* 你要純白就改成 #fff 或 transparent */
  display: flex;
  gap: 2px;
  overflow: hidden;
}

/* 每一週一欄（自動算出欄寬，恰好填滿容器寬度） */
.hm-col {
  display: grid;
  grid-template-rows: repeat(7, 1fr);
  gap: var(--gap, 2px);
  /* 讓所有欄平均分配寬度：cols = 週數（由 JS 給） */
  width: calc((100% - (var(--cols) - 1) * var(--gap, 2px)) / var(--cols));
}

/* 每一天一個小方塊；圓角小一點比較像 GitHub */
.hm-cell {
  width: 100%;
  border-radius: 3px;
  background: #e6e6e6;
  /* 會被 inline style 覆蓋 */
}

/* KPI：兩個 175×98，中間要視覺 23。
   用 space-between 精準吃掉左欄寬度，不用 gap 才不會多/少 1px */
.kpi-row {
  display: flex;
  justify-content: space-between;
  /* 中間自然是 23px */
  align-items: stretch;
  width: 100%;
  min-height: 98px;
}

.kpi {
  width: 175px;
  height: 98px;
  background: #fff;
  border-radius: 16px;
  padding: 14px 18px;
  border: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
}

.kpi-title {
  font-size: 14px;
  color: #000000;
  margin: 0 0 6px;
}

.kpi-num {
  font-size: 36px;
  margin: 0;
  line-height: 1;
  font-size: 48px
}

.kpi-num.sub {
  color: #B4A9DA;
}

.kpi-num.acc {
  color: #E6BDBD;
}

.kpi-num .pct {
  font-size: .75em;
}

/* 右欄：209×220，貼齊外框圓弧 */
.totals {
  width: 209px;
  height: 220px;
  background: #fff;
  border-radius: 16px;
  padding: 12px 16px;
  border: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}

.totals-title {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 4px;
}

.totals-line {
  display: flex;
  align-items: baseline;
  /* baseline 對齊字底線最自然 */
  gap: 17px;
  /* 數字與文字間距，可自行調整 */
}

.totals-num {
  font-size: 52px;
  color: #7aa0e8;
  margin: 0;
  line-height: 1;
}

.totals-sub {
  margin: 0;
  /* 移除原本 margin:14px; 避免跑位 */
  font-size: 14px;
  color: #222;
  font-weight: 700;
}

.levels {
  display: flex;
  flex-direction: column;
  /* 🔸垂直方向 */
  align-items: flex-start;
  /* 🔸靠左 */
  gap: 6px;
  /* 🔸每個間距 */
  margin-top: auto;
  margin-bottom: 34px;
  /* 預留右下角空間 */
}

.tag {
  display: inline-flex;
  align-items: center;
  width: 88px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 16px;
  background: transparent;
  /* 改成透明，不用刪掉 */
  border: none;
  /* 不要邊框 */
}

.tag.easy {
  background: #e7f7e7;
  border-color: #d6f0d6
}

.tag.med {
  background: #fff6e0;
  border-color: #ffe6b3
}

.tag.hard {
  background: #ffe8e8;
  border-color: #ffd0d0
}

.tag.beats {
  position: absolute;
  bottom: 14px;
  left: 125px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  /* 對齊右側 */
  justify-content: center;

  background: transparent;
  border: none;
  padding: 0;
  line-height: 1.1;
}

/* 上面的小標題 */
.beats-title {
  font-size: 13px;
  color: #000000;
  font-weight: 600;
  margin-bottom: 12px;
}

/* 下面的數字 */
.beats-num {
  font-size: 20px;
  /* 🔸放大數字 */
  font-weight: 700;
  color: #555;
  /* 🔸藍色一致 */
  line-height: 1;
}

/* % 符號維持原大小，稍微降一點對齊底線 */
.beats-pct {
  font-size: 14px;
  vertical-align: baseline;
  color: #555;
}
</style>
