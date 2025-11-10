<!-- components/Profile/ProfileLayout.vue -->
<template>
  <section class="profile-layout container mx-auto my-20 px-4">
    <div class="grid grid-cols-1 lg:grid-cols-[640px_680px] gap-0">
      <!-- 左側 -->
      <aside class="left flex flex-col items-center gap-6">
        <slot name="left" />
      </aside>

      <!-- 右側 -->
      <main class="right flex flex-col gap-6 -mt-10">
        <slot name="right" />
      </main>
    </div>
  </section>
</template>

<style scoped>
/* 補充可選字體與顏色 */
.profile-layout {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  color: var(--fallback-ink, #1f2937);
}
</style>