<template>
  <ProfileLayout>
    <!-- 左邊：頭貼，可編輯 -->
    <template #left>
      <ProfileAvatarBlock
        :avatar-url="form.avatar"
        :editable-avatar="true"
        :buttons="[
          { label: 'Save', variant: 'primary', action: 'save' },
          { label: 'Cancel', variant: 'error', action: 'cancel' }
        ]"
        @click="onAvatarAction"
        @upload="onAvatarUpload"
      />
    </template>

    <!-- 右邊：可編輯資訊欄 -->
    <template #right>
      <section class="w-full max-w-4xl">
        <div class="grid grid-cols-1 gap-4">
          <ProfileField label="REAL NAME" v-model="form.realName" :editable="true" />
          <ProfileField label="USER NAME" v-model="form.username" :editable="true" />
          <ProfileField label="ROLE" v-model="form.role" :editable="false" />
          <ProfileField label="EMAIL" v-model="form.email" :editable="true" type="email" />
          <ProfileField label="USER ID" v-model="form.id" :editable="true" />
          <ProfileField
            label="INTRODUCTION"
            v-model="form.intro"
            :editable="true"
            type="textarea"
          />
        </div>
      </section>
    </template>
  </ProfileLayout>
</template>

<script setup>
import { reactive } from 'vue'
import ProfileLayout from '@/components/Profile/ProfileLayout.vue'
import ProfileAvatarBlock from '@/components/Profile/ProfileAvatarBlock.vue'
import ProfileField from '@/components/Profile/ProfileField.vue'


// 這裡先假裝有 user，可以之後接 API
const user = {
  realName: '陳育濬',
  username: 'doggggg',
  role: 'Student',
  email: '41247057S@gapps.ntnu.edu.tw',
  id: '41247057S',
  studentId: '41247057S',
  intro: '哈囉我是資工116',
  avatar: ''
}

const form = reactive({ ...user })

function onAvatarAction(action) {
  if (action === 'save') {
    // 這裡之後接 API，把 form 丟出去
    console.log('Save profile', { ...form })
  }
  if (action === 'cancel') {
    // 還原成原本 user
    Object.assign(form, user)
    console.log('Cancel edit, reset form')
  }
}

function onAvatarUpload(file) {
  console.log('avatar file for upload:', file)
  // 之後接 API，上傳成功後更新 form.avatar
}
</script>
