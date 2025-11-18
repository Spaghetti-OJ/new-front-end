<template>
  <section class="profile-layout container mx-auto my-10 px-4">
    <div class="grid grid-cols-1 gap-0 lg:grid-cols-[40%_60%] lg:items-start">
      <!-- 左側 -->
      <aside class="left flex flex-col items-center gap-6">
        <slot name="left" />
      </aside>

      <!-- 右側 -->
      <main class="right flex flex-col gap-6">
        <slot name="right" />
      </main>
    </div>
  </section>
</template>
