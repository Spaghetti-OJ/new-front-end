<template>
  <section class="user-public">
    <div v-if="loading" class="state">Loading…</div>
    <div v-else-if="error" class="state state--error">{{ error }}</div>

    <div v-else-if="user" class="layout">
      <!-- 左：頭像 -->
      <div class="avatar-wrap">
        <img
          v-if="user.avatarUrl"
          :src="user.avatarUrl"
          :alt="`${user.name} avatar`"
          class="avatar"
        />
        <div v-else class="avatar avatar--placeholder"></div>
      </div>

      <!-- 右：徽章 + 欄位 -->
      <div class="right">
        <div class="badge">{{ user.role || 'Student' }}</div>

        <div class="two-fields">
          <div class="field">
            <label>USER ID</label>
            <div class="text-box w-275">{{ user.id }}</div>
          </div>

          <div class="field">
            <label>USER NAME</label>
            <div class="text-box w-342">{{ user.name }}</div>
          </div>
        </div>

        <div class="field">
          <label>INTRODUCTION</label>
          <div class="text-area">
            <span v-if="user.intro?.trim().length">{{ user.intro }}</span>
            <span v-else class="muted">尚未填寫自我介紹</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="state">尚未載入資料</div>
  </section>
</template>

<script setup lang="ts">
type User = {
  id: string
  name: string
  role?: string
  avatarUrl?: string
  intro?: string
}

defineProps<{
  user?: User
  loading?: boolean
  error?: string
}>()
</script>

<style scoped>
.user-public {
  max-width: 980px;
  margin: 28px auto;
  color: #000;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
}

/* 版面：左頭像 + 右欄位*/
.layout {
  display: grid;
  grid-template-columns: 284px 1fr;
  column-gap: 118px;
  align-items: start;
  padding-left: 120px;
}

/* 左側頭像 */
.avatar-wrap { 
    display: flex; 
    justify-content: center; 
}
.avatar {
  inline-size: 284px;
  aspect-ratio: 1/1;
  border-radius: 50%;
  display: block;
  object-fit: cover;
  background: #f1f1f1;
  border: 10px solid #fff;  
}
.avatar--placeholder {
  width: 284px; height: 284px;
  border-radius: 999px;
  background: #dcdcdc; 
  border: 10px solid #fff;
}

/* 右側欄位 */
.right { display: flex; 
    flex-direction: column; 
    gap: 18px; 
}

/* role*/
.badge {
  background-color: #E6BDBD; color: #000;
  border-radius: 8px; 
  padding: 10px 14px; 
  font-size: 20px; 
  font-weight: 700;
  display: inline-flex; 
  align-items: center; 
  justify-content: center;
  align-self: flex-start;
}

/* 欄位 */
.two-fields { 
    display: flex; 
    gap: 12px; 
}
.field { display: flex; 
    flex-direction: column; 
    gap: 6px; 
}
label { 
    font-size: 12px; 
    letter-spacing: .08em; 
    font-weight: 800; color: #000; 
}

/* 灰底小框 / 大框 */
.text-box {
  background-color: #D9D9D9; 
  color: #000;
  border-radius: 8px; 
  padding: 10px 14px; 
  font-size: 20px;
  min-height: 48px; 
  display: flex; 
  align-items: center;
}
.w-275 { width: 275px; }
.w-342 { width: 342px; }

.text-area {
  background-color: #D9D9D9; color: #000;
  border-radius: 10px; padding: 12px 14px; font-size: 20px;
  width: 650px; height: 260px; white-space: pre-wrap;
}

.muted { color: #4d4d4d; font-style: italic; }

/* 錯誤狀態 */
.state { padding: 24px; color: #333; }
.state--error { color: #b91c1c; }
</style>
