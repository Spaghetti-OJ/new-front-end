<script setup lang="ts">
import { defineEmits } from "vue";
const emit = defineEmits(["edit"]);

const dummyKeys = [
  { id: 1, name: "my api key 01", status: "Active", usage: 42 },
  { id: 2, name: "my api key 01", status: "Active", usage: 42 },
  { id: 3, name: "my api key 01", status: "Active", usage: 42 },
];
</script>

<template>
  <div class="overflow-x-auto">
    <table class="table w-full">
      <thead>
        <tr>
          <th>NAME</th>
          <th>STATUS</th>
          <th>USAGE</th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="key in dummyKeys" :key="key.id">
          <td>{{ key.name }}</td>
          <td>{{ key.status }}</td>
          <td>{{ key.usage }}</td>
          <td>
            <button class="btn btn-ghost" @click="emit('edit', key)">
              <i class="uil-edit"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
