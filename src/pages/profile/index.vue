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

useTitle("Profile | Normal OJ");
const router = useRouter();
const session = useSession();
const ROLE = ["Admin", "Teacher", "Student"];
const { t } = useI18n();

async function logout() {
  await api.Auth.logout();
  router.push("/");
  session.validateSession();
}

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
      oldPassword: changePasswordForm.oldPassword,
      newPassword: changePasswordForm.newPassword,
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

import { computed } from "vue";

type DayCell = { date: string; value: number };

// 如果 stats 不是 store 型別的一部分，用 any 取值以免 TS 報錯
const stats = computed(() => (session as any).stats ?? {});
const levelCount = computed(() => (stats.value as any).levelCount ?? {});
const contributions = computed<DayCell[]>(() => (stats.value as any).contributions ?? []);

const real = computed(() => ({
  name: (session as any).displayedName ?? (session as any).realName ?? "",
}));

const user = computed(() => ({
  name: session.username ?? "",
  role: session.role ?? "Student",
  email: session.email ?? "",
  id: String((session as any).id ?? ""),
  studentId: String((session as any).studentId ?? ""),
  intro: session.bio ?? "",
  submission: (stats.value as any).submission ?? 0,
  acceptance: (stats.value as any).acceptance ?? 0,
  totalsolved: (stats.value as any).totalSolved ?? 0,
}));

const data = computed(() => ({
  easy: (levelCount.value as any).easy ?? 0,
  med:  (levelCount.value as any).med ?? 0,
  hard: (levelCount.value as any).hard ?? 0,
}));

const beatrate = computed(() => (stats.value as any).beatrate ?? 0);

// 熱力圖資料
const rawData = computed<DayCell[]>(() => contributions.value);

// ---- 熱力圖工具與計算 ----
function padToFullWeeks(data: DayCell[]): DayCell[] {
  if (!data?.length) return [];
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const first = new Date(sorted[0].date);
  const last  = new Date(sorted[sorted.length - 1].date);

  // 週一為起始
  const firstDow = (first.getDay() + 6) % 7; first.setDate(first.getDate() - firstDow);
  const lastDow  = (last.getDay()  + 6) % 7; last.setDate(last.getDate()  + (6 - lastDow));

  const map = new Map(sorted.map(d => [d.date, d.value]));
  const out: DayCell[] = [];
  const cur = new Date(first);
  while (cur <= last) {
    const iso = cur.toISOString().slice(0, 10);
    out.push({ date: iso, value: map.get(iso) ?? 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

const normalized = computed(() => padToFullWeeks(rawData.value));

const weeks = computed<DayCell[][]>(() => {
  const n = normalized.value;
  if (!n.length) return [];
  const arr: DayCell[][] = [];
  for (let i = 0; i < n.length; i += 7) arr.push(n.slice(i, i + 7));
  return arr;
});

const maxV = computed(() => Math.max(1, ...normalized.value.map(d => d.value)));
function color(v: number) {
  if (v === 0) return "#e6e6e6";
  const t = v / maxV.value;
  if (t > .75) return "#4a78ff";
  if (t > .50) return "#7aa0ff";
  if (t > .25) return "#a9bfff";
  return "#d1ddff";
}

// 初次渲染避免讀 weeks.length
const colsStyle = computed(() =>
  weeks.value.length ? ({ ["--cols" as any]: String(weeks.value.length) } as any) : {}
);
</script>

<template>
  <section class="profile">
    <!-- 左欄：頭像與操作 -->
    <aside class="left">
      <div class="avatar-wrap">
        <img class="avatar" src="" alt="" />
      </div>

      <div class="actions">
        <button class="btn btn-edit">Edit</button>
        <button class="btn btn-signout">Sign out</button>
      </div>
    </aside>

    <!-- 右欄：資訊欄與統計 -->
    <main class="right">
      <!-- 上：兩欄資訊 -->
      <div class="info-grid">
        <!-- 第一列 -->
        <div class="field">
            <label>REAL NAME</label>
          <div class="box w-275">{{ real.name }}</div>
        </div>
        <div class="field">
          <label>USER NAME</label>
          <div class="box w-342">{{ user.name }}</div>
        </div>
        
        <!-- 第二列 -->
        <div class="field">
          <label>ROLE</label>
          <div class="box w-275">{{ user.role }}</div>
        </div>
        <div class="field">
          <label>EMAIL</label>
          <div class="box w-342">{{ user.email }}</div>
        </div>

        <!-- 第三列 -->
        <div class="field">
          <label>USER ID</label>
          <div class="box w-275">{{ user.id }}</div>
        </div>
        <div class="field">
          <label>STUDENT ID</label>
          <div class="box w-342">{{ user.studentId }}</div>
        </div>

        <!-- 第四列-->
        <div class="field">
          <label>INTRODUCTION</label>
          <div class="box w-650">{{ user.intro }}</div>
        </div>
      </div>

      <!-- 下：統計區 -->
        <section class="stats">
          <label>PROGRESS BAR</label>
        <div class="heatmap-card">
          <div class="stats-grid">
            <!-- 左：上熱力圖、下兩格 -->
            <div class="left-col">
              <!-- 熱力圖（資料驅動） -->
              <div class="heatmap" :style="{ '--cols': weeks.length }" role="grid" aria-label="Contribution heatmap">
                <div class="hm-col" v-for="(week, wi) in weeks" :key="wi" role="row">
                  <div
                    v-for="(cell, di) in week"
                    :key="di"
                    class="hm-cell"
                    :title="cell.date ? `${cell.date} • ${cell.value} time(s)` : ''"
                    :style="{ backgroundColor: color(cell.value) }"
                    role="gridcell"
                  />
                </div>
              </div>

              <div class="kpi-row">
                <div class="kpi">
                  <p class="kpi-title">Submission</p>
                  <p class="kpi-num sub">{{ user.submission }}</p>
                </div>
                <div class="kpi">
                  <p class="kpi-title">Acceptance</p>
                  <p class="kpi-num acc">{{ user.acceptance }}<span class="pct">%</span></p>
                </div>
              </div>
            </div>

            <aside class="totals">
              <p class="totals-title">Total Solved</p>
              <div class="totals-line">
                <p class="totals-num">{{ user.totalsolved }}</p>
                <p class="totals-sub">Problems</p>
              </div>
              <div class="levels">
                <span class="tag easy">Easy&nbsp;{{ data.easy }}</span>
                <span class="tag med">Med.&nbsp;{{ data.med }}</span>
                <span class="tag hard">Hard&nbsp;{{ data.hard }}</span>
              </div>

              <span class="tag beats">
                <span class="beats-title">Beats</span>
                <span class="beats-num">
                  {{ beatrate }}<span class="beats-pct">%</span>
                </span>
              </span>
            </aside>
          </div>
        </div>
      </section>
    </main>
  </section>
</template>

<style scoped>
:root{
  --pad:   23px;
}

/* 版面 */
.profile{
  max-width: 1120px;
  margin: 24px auto 56px;
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 32px;
  color: var(--ink);
  font-family: system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
}

/* 左欄 */
.left{
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:20px
}
.avatar-wrap{
  width:260px;
  height:260px
}
.avatar{
  width:100%;
  height:100%;
  border-radius:50%;
  background:#eee;
  object-fit:cover;
}
.actions{
  display:flex;
  flex-direction:column;
  gap:14px;
  width:220px
}
.btn{
  width:100%;
  padding:14px 16px;
  border-radius:12px;
  font-size:24px;
  border:2px solid;
  font-weight:700;
  background:#fff;
  cursor:pointer;
}
.btn-edit{border-color:#A0B4F0;color: #A0B4F0;}
.btn-signout{border-color:#F0A0A0;color:#F0A0A0}

/* 右欄：資訊格 */
.right{
  display:flex;
  flex-direction:column;
  gap:24px
}
.info-grid{
  display: grid;
  grid-template-columns: 275px 342px;
  column-gap: 33px;                  /* 固定間隔 */
  row-gap: 18px;
  justify-content: start;
}
.field { display: flex; 
    flex-direction: column; 
    gap: 6px; 
}
label{
  font-size:14px;
  letter-spacing:.08em;
  font-weight:800
}
.box{
  background-color: #D9D9D9; 
  color: #000;
  border-radius: 8px; 
  padding: 10px 14px; 
  font-size: 20px;
  height: 48px; 
  display: flex; 
  align-items: center;
}
.w-275 { width: 275px; }
.w-342 { width: 342px; }
.w-650 { width: 650px; }


/* 統計區 */

.stats, .stats * {
  box-sizing: border-box;   /* 寬高計算含 padding + border，不會超出規劃 */
}

.stats .heatmap-card{
  width: 650px;
  height: 266px;
  background:#D9D9D9;
  border-radius:32px;
  padding: 23px;
  display:flex;
}
.stats > label {
  display: block;          /* 讓 label 佔整行 */
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 12px;     /* 🔸加這行：跟下面框距離 12px，可自行調整 */
}

.stats-grid{
  display:grid;
  grid-template-columns: 372px 209px; /* 左自適應 + 右 209 */
  column-gap: 22px;                /* 左右欄間距 22 */
  width:100%;
  height:220px !important;
}

/* 左欄：總高 220 = 99 + 23 + 98 */
.left-col{
  display:grid;
  grid-template-rows: 99px minmax(98px, 1fr);
  row-gap: 23px;                 /* 熱力圖與 KPI 間距 23 */
  height: 220px !important;
}

.heatmap{
  width: 100%;
  height: 99px;
  padding: 6px;
  border-radius: 10px;
  background: #f3f3f3;   /* 你要純白就改成 #fff 或 transparent */
  display: flex;
  gap: 2px;
  overflow: hidden;
}

/* 每一週一欄（自動算出欄寬，恰好填滿容器寬度） */
.hm-col{
  display: grid;
  grid-template-rows: repeat(7, 1fr);
  gap: var(--gap, 2px);
  /* 讓所有欄平均分配寬度：cols = 週數（由 JS 給） */
  width: calc((100% - (var(--cols) - 1) * var(--gap, 2px)) / var(--cols));
}

/* 每一天一個小方塊；圓角小一點比較像 GitHub */
.hm-cell{
  width: 100%;
  border-radius: 3px;
  background: #e6e6e6; /* 會被 inline style 覆蓋 */
}

/* KPI：兩個 175×98，中間要視覺 23。
   用 space-between 精準吃掉左欄寬度，不用 gap 才不會多/少 1px */
.kpi-row{
  display:flex;
  justify-content: space-between; /* 中間自然是 23px */
  align-items: stretch;
  width:100%;
  min-height: 98px;
}
.kpi{
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
.kpi-title{
  font-size:14px;
  color:#000000;
  margin:0 0 6px;}
.kpi-num{
  font-size:36px;  
  margin:0;
  line-height:1;
  font-size:48px
}
.kpi-num.sub{color:#B4A9DA;}
.kpi-num.acc{color:#E6BDBD;}
.kpi-num .pct{font-size:.75em;}

/* 右欄：209×220，貼齊外框圓弧 */
.totals{
  width: 209px;
  height: 220px;
  background:#fff;
  border-radius:16px;
  padding: 12px 16px;
  border:1px solid #e6e6e6;
  display:flex;
  flex-direction:column;
  gap:6px;
  position: relative;    
}
.totals-title{
  font-size:14px;
  font-weight:700;
  margin:0 0 4px;}
.totals-line {
  display: flex;
  align-items: baseline;   /* baseline 對齊字底線最自然 */
  gap: 17px;                /* 數字與文字間距，可自行調整 */
}

.totals-num {
  font-size: 52px;
  color: #7aa0e8;
  margin: 0;
  line-height: 1;
}

.totals-sub {
  margin: 0;               /* 移除原本 margin:14px; 避免跑位 */
  font-size: 14px;
  color: #222;
  font-weight: 700;
}
.levels {
  display: flex;
  flex-direction: column;   /* 🔸垂直方向 */
  align-items: flex-start;  /* 🔸靠左 */
  gap: 6px;                 /* 🔸每個間距 */
  margin-top: auto;
  margin-bottom: 34px;      /* 預留右下角空間 */
}
.tag{
  display:inline-flex;
  align-items:center;
  width: 88px; 
  padding:6px 12px;
  border-radius:8px;
  font-size:16px;
  background: transparent;   /* 改成透明，不用刪掉 */
  border: none;              /* 不要邊框 */
}
.tag.easy{background:#e7f7e7;border-color:#d6f0d6}
.tag.med{background:#fff6e0;border-color:#ffe6b3}
.tag.hard{background:#ffe8e8;border-color:#ffd0d0}
.tag.beats {
  position: absolute;
  bottom: 14px;
  left: 125px;  
  display: flex;
  flex-direction: column;
  align-items: flex-start;   /* 對齊右側 */
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
  font-size: 20px;          /* 🔸放大數字 */
  font-weight: 700;
  color: #555;           /* 🔸藍色一致 */
  line-height: 1;
}

/* % 符號維持原大小，稍微降一點對齊底線 */
.beats-pct {
  font-size: 14px;
  vertical-align: baseline;
  color: #555;
}

</style>

