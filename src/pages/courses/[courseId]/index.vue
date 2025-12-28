<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
router.replace(`/courses/${route.params.courseId}/announcements`);
</script>

<template><span>redirecting...</span></template>
