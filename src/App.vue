<script setup lang="ts">
import Button from "primevue/button";
import LineChart from "./components/LineChart.vue";
</script>

<template>
  <header>
    <h1 class="text-3xl text-center mb-8 mt-4">Charts App</h1>
  </header>

  <main>
    <Button>A Button</Button>
    <LineChart />
  </main>
</template>

<style scoped></style>
