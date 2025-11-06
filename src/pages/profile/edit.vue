<template>
  <section class="profile">
    <!-- 左欄：頭像與操作 -->
    <aside class="left">
      <div class="avatar-wrap" ref="avatarWrap">
        <img class="avatar" :src="avatarUrl || ''" alt="avatar" />

        <!-- 右下角＋按鈕 -->
        <button
          class="plus-btn"
          aria-haspopup="menu"
          :aria-expanded="showMenu" 
          @click="toggleMenu"
          @keydown.enter.prevent="toggleMenu"
        >
          +
        </button>

        <!-- 浮層選單 -->
        <div
          v-if="showMenu"
          id="avatar-menu"
          class="popover"
          role="menu"
          tabindex="-1"
          ref="menuRef"
          :aria-hidden="!showMenu"
          @keydown.esc.prevent="closeMenu"
        >
          <div class="popover-title">Upload photo</div>
          <button class="pop-item" role="menuitem" @click="triggerFilePicker('file')">
            上傳檔案
          </button>
          <div class="divider"></div>
          <button class="pop-item" role="menuitem" @click="triggerFilePicker('library')">
            照片圖庫
          </button>

          <!-- 隱藏 input：上傳檔案 -->
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="hidden-input"
            @change="onFileSelected"
          />
          <!-- 隱藏 input：照片圖庫/相機 -->
          <input
            ref="libInputRef"
            type="file"
            accept="image/*"
            capture="environment"
            class="hidden-input"
            @change="onFileSelected"
          />
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-save">Save</button>
        <button class="btn btn-cancel">Cancel</button>
      </div>
    </aside>

    <!-- 右欄：資訊欄與統計 -->
    <main class="right">
      <div class="info-grid one-col">
        <!-- REAL NAME（不可編輯） -->
        <div class="field">
          <label>REAL NAME</label>
          <div class="box not-editable">
            {{ form.name }}
          </div>
        </div>

        <!-- USER NAME -->
        <div class="field">
          <label>USER NAME</label>

          <div v-if="editingField !== 'username'" class="box editable"
              @click="enterEdit('username')">
            {{ form.username || '—' }}
          </div>

          <input v-else ref="refMap.username" class="box input"
                v-model="form.username"
                @keydown.enter.prevent="commit('username')"
                @keydown.esc.prevent="cancel('username')"
                @blur="commit('username')"
                placeholder="Enter your user name" />
        </div>

        <!-- ROLE（不可編輯） -->
        <div class="field">
          <label>ROLE</label>
          <div class="box not-editable">
            {{ form.role }}
          </div>
        </div>

        <!-- EMAIL -->
        <div class="field">
          <label>EMAIL</label>

          <div v-if="editingField !== 'email'" class="box editable"
              @click="enterEdit('email')">
            {{ form.email || '—' }}
          </div>

          <input v-else ref="refMap.email" class="box input"
                v-model="form.email" type="email"
                @keydown.enter.prevent="commit('email')"
                @keydown.esc.prevent="cancel('email')"
                @blur="commit('email')"
                placeholder="example@mail.com" />
        </div>

        <!-- USER ID -->
        <div class="field">
          <label>USER ID</label>
          <div v-if="editingField !== 'id'" class="box editable" @click="enterEdit('id')">
            {{ form.id || '—' }}
          </div>
          <input v-else ref="refMap.id" class="box input" v-model="form.id"
            @keydown.enter.prevent="commit('id')" @keydown.esc.prevent="cancel('id')"
            @blur="commit('id')" placeholder="Enter user ID" />
        </div>

        <!-- STUDENT ID（不可編輯） -->
        <div class="field">
          <label>STUDENT ID</label>
          <div class="box not-editable">{{ form.studentId }}</div>
        </div>

        <!-- INTRODUCTION： -->
        <div class="field">
          <label>INTRODUCTION</label>

          <div v-if="editingField !== 'intro'" class="box h-167 editable top-left"
              @click="enterEdit('intro')">
            <pre class="pre">{{ form.intro || '—' }}</pre>
          </div>

          <textarea v-else
          ref="refMap.intro"
          class="box textarea h-167"
          v-model="form.intro"
          @keydown.enter.exact.prevent="commit('intro')"
          @keydown.shift.enter.stop
          @keydown.esc.prevent="cancel('intro')"
          @blur="commit('intro')"
          placeholder="Write something about yourself...">
          </textarea>
        </div>
      </div>
    </main>
  </section>
</template>

<script setup>
import { reactive, computed, watch, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'

/* ===== props：父層傳入 user===== */
const props = defineProps({
  user: { type: Object, default: () => ({}) }
})
const userData = computed(() => props.user)   

/* ===== 本地表單===== */
const form = reactive({
  name: '',
  username: '',
  role: '',
  email: '',
  id: '',
  studentId: '',
  intro: ''
})

/* 初始化 & 外部資料變動時同步到表單 */
watch(userData, (v) => {
  form.name = v?.name || ''
  form.username = v?.username || ''
  form.role = v?.role || ''
  form.email = v?.email || ''
  form.id = v?.id || ''
  form.studentId = v?.studentId || ''
  form.intro = v?.intro || ''
}, { immediate: true })

/* 哪個欄位正在編輯 */
const editingField = ref(null)

/* 各欄位的 ref */
const refMap = {
  name: ref(null),
  username: ref(null),
  role: ref(null),
  email: ref(null),
  id: ref(null),       
  intro: ref(null)
}

/* 進入編輯*/
function enterEdit(field) {
  if (field === 'role' || field === 'studentId') return
  editingField.value = field
  nextTick(() => {
    refMap[field]?.value?.focus?.()
    const el = refMap[field]?.value
    if (el && el.setSelectionRange && typeof el.value === 'string') {
      const len = el.value.length
      el.setSelectionRange(len, len)
    }
  })
}


const emit = defineEmits(['save-field'])

/* 提交*/
function commit(field) {
  emit('save-field', { field, value: form[field] })
  editingField.value = null
}

/* 取消：還原為目前 userData */
function cancel(field) {
  const v = userData.value || {}
  form[field] = v[field] || ''
  editingField.value = null
}

/* ===== 頭像＋選單===== */
const avatarUrl = ref('')
const showMenu = ref(false)
const menuRef = ref(null)
const avatarWrap = ref(null)
const fileInputRef = ref(null)
const libInputRef = ref(null)

function toggleMenu() { showMenu.value = !showMenu.value }
function closeMenu()  { showMenu.value = false }

function onClickOutside(e) {
  const t = e.target
  if (
    showMenu.value &&
    menuRef.value && avatarWrap.value &&
    !menuRef.value.contains(t) &&
    !avatarWrap.value.contains(t)
  ) closeMenu()
}
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))

function triggerFilePicker(type) {
  if (type === 'file') fileInputRef.value?.click()
  else libInputRef.value?.click()
}
function onFileSelected(e) {
  const input = e.target
  const file = input.files?.[0]
  if (file) avatarUrl.value = URL.createObjectURL(file)
  input.value = ''
  closeMenu()
}
</script>

<style scoped>
:root { --pad: 23px; }

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
.left{ display:flex; flex-direction:column; align-items:center; gap:20px; }
.avatar-wrap{
  position: relative;
  width:260px; height:260px;
}
.avatar{
  width:100%; height:100%; border-radius:50%;
  background:#eee; object-fit:cover;
}
/* 右下角 + 按鈕 */
.plus-btn{
  position:absolute; right:8px; bottom:10px;
  width:40px; height:40px; border-radius:50%;
  border:none; background:#fff; box-shadow:0 2px 10px rgba(0,0,0,.15);
  font-size:28px; line-height:40px; font-weight:700;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; user-select:none;
}

/* 浮層*/
.popover{
  position:absolute;
  right:-6px; bottom:54px;  
  width:210px;
  background:#fff;
  border-radius:18px;
  box-shadow:0 10px 30px rgba(0,0,0,.16);
  padding:10px 0;
  z-index: 30;
  transform-origin: 95% 100%;
  animation: popIn .12s ease-out;
}
@keyframes popIn { from { transform: scale(.96); opacity:.0 } to { transform: scale(1); opacity:1 } }
.popover-title{
  font-size:12px; color:#9aa0a6;
  padding: 0 16px 8px 16px;
}
.pop-item{
  width:100%; background:transparent; border:none;
  text-align:left; padding:10px 16px; font-size:16px; cursor:pointer;
}
.pop-item:hover{ background:#f6f6f6; }
.divider{ height:1px; background:#e7e7e7; margin: 0 12px; }
.hidden-input{ display:none; }

.actions{ display:flex; flex-direction:column; gap:14px; width:220px; }
.btn{
  width:100%; padding:14px 16px; border-radius:12px;
  font-size:24px; border:2px solid; font-weight:700; background:#fff; cursor:pointer;
}
.btn-save{border-color:#A0B4F0;color:#A0B4F0;}
.btn-cancel{border-color:#F0A0A0;color:#F0A0A0;}

/* 右欄：資訊格 */
.right{ display:flex; flex-direction:column; gap:24px; }
.info-grid.one-col{
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field{ display:flex; flex-direction:column; gap:6px; }
label{ font-size:14px; letter-spacing:.08em; font-weight:800; }
.box{
  background:#D9D9D9; 
  color:#000; 
  border-radius:8px;
  padding:10px 14px; 
  font-size:20px; 
  height:48px;
  width:650px; 
  display:flex; 
  align-items:center;
}
.h-167{ 
  height: 167px;
  align-items: flex-start; 
  justify-content: flex-start; 
  padding-top: 14px;
}

.editable{ cursor: text; }
.editable:hover{ outline: 2px dashed rgba(0,0,0,.1); }

.box.input{
  width:100%;
  border:none;
  outline:none;
  background:#D9D9D9;
  border-radius:8px;
  height:48px;
  line-height:28px;
}

/* 多行 textarea：左上對齊 */
.box.textarea{
  width:100%;
  border:none;
  outline:none;
  background:#D9D9D9;
  border-radius:8px;
  min-height:167px;
  line-height:1.6;
  padding:10px 14px;
  resize: vertical;
}

.pre{
  white-space:pre-wrap;
  line-height:1.6;
  margin:0;
}

.top-left{
  align-items:flex-start;
  justify-content:flex-start;
  padding-top:10px;
}

/* 窄螢幕簡易排版 */
@media (max-width: 900px){
  .profile{ grid-template-columns:1fr; }
  .right .info-grid{ grid-template-columns:1fr; }
  .w-275,.w-342,.w-650{ width:100%; }
}
</style>
