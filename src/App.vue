<script setup lang="ts">
import { ref } from 'vue'
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import LineChart from "./components/LineChart.vue";

const searchSymbol = ref('')
const selectedSymbol = ref('')

const handleFind = () => {
  if (searchSymbol.value.trim()) {
    selectedSymbol.value = searchSymbol.value.trim().toUpperCase()
  }
}

const handleKeyup = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    handleFind()
  }
}
</script>

<template>
  <header>
    <h1 class="text-3xl text-center mb-8 mt-4">Charts App</h1>
  </header>

  <main class="container mx-auto px-4">
    <div class="mb-6">
      <InputText
        v-model="searchSymbol"
        placeholder="Search stock (e.g. TSLA, AAPL)..."
        class="mb-4 mr-2"
        @keyup="handleKeyup"
      />
      <Button @click="handleFind" :disabled="!searchSymbol.trim()">
        Find
      </Button>
    </div>

    <LineChart v-if="selectedSymbol" :symbol="selectedSymbol" />
    <div v-else class="text-center text-gray-500 mt-8">
      Enter a stock symbol and click Find to view real-time data
    </div>
  </main>
</template>

<style scoped></style>
