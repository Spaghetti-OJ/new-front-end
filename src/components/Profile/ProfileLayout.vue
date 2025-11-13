<template>
  <section class="profile-layout container mx-auto my-20 px-4">
    <div class="grid grid-cols-1 lg:grid-cols-[640px_650px] gap-0">
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