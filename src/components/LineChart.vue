<script setup lang="ts">
import Chart from "primevue/chart";
import Button from "primevue/button";
import { ref, onMounted, watch, computed } from "vue";
import { useChartData } from "@/composables/useChartData";

interface Props {
  symbol: string
}

const props = defineProps<Props>()

const { chartData, isConnected, currentSymbol, updateInterval, subscribe, setUpdateInterval } = useChartData()
const chartOptions = ref()

onMounted(() => {
  chartOptions.value = setChartOptions()
})

// Watch for symbol changes and subscribe to new symbol
watch(() => props.symbol, (newSymbol) => {
  if (newSymbol) {
    subscribe(newSymbol)
  }
}, { immediate: true })

const hasData = computed(() => {
  return chartData.value.datasets[0]?.data?.length > 0
})

const setChartOptions = () => {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--p-text-color');
  const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
  const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

  return {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 0.6,
    animation: {
      duration: 750
    },
    plugins: {
      legend: {
        labels: {
          color: textColor
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: textColorSecondary,
          maxTicksLimit: 10
        },
        grid: {
          color: surfaceBorder
        },
        title: {
          display: true,
          text: `Time (${updateInterval.value}-minute intervals)`,
          color: textColor
        }
      },
      y: {
        ticks: {
          color: textColorSecondary
        },
        grid: {
          color: surfaceBorder
        },
        title: {
          display: true,
          text: 'Price ($)',
          color: textColor
        }
      }
    }
  };
}

// Watch for interval changes and update chart options
watch(updateInterval, () => {
  chartOptions.value = setChartOptions()
})

const handleIntervalChange = (interval: 1 | 5) => {
  setUpdateInterval(interval)
}
</script>

<template>
  <div class="card max-w-4xl mx-auto">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-semibold">{{ currentSymbol }} - Real-time Price</h2>
      <div class="flex items-center">
        <div
          :class="[
            'w-3 h-3 rounded-full mr-2',
            isConnected ? 'bg-green-500' : 'bg-red-500'
          ]"
        ></div>
        <span class="text-sm text-gray-600">
          {{ isConnected ? 'Connected' : 'Disconnected' }}
        </span>
      </div>
    </div>

    <div class="mb-4 flex items-center gap-2">
      <span class="text-sm font-medium">Update Interval:</span>
      <Button
        :class="[
          'px-3 py-1 text-sm',
          updateInterval === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
        ]"
        @click="handleIntervalChange(1)"
        size="small"
      >
        1 min
      </Button>
      <Button
        :class="[
          'px-3 py-1 text-sm',
          updateInterval === 5 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
        ]"
        @click="handleIntervalChange(5)"
        size="small"
      >
        5 min
      </Button>
    </div>

    <div v-if="!hasData && isConnected" class="text-center py-8 text-gray-500">
      Waiting for {{ currentSymbol }} price data...
    </div>

    <div v-else-if="!isConnected" class="text-center py-8 text-red-500">
      Connection failed. Please check your internet connection.
    </div>

    <Chart
      v-else
      type="line"
      :data="chartData"
      :options="chartOptions"
      class="h-[20rem]"
    />
  </div>
</template>
