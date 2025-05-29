import { ref, onUnmounted } from 'vue'

interface TradeData {
  c: string[] // conditions
  p: number  // price
  s: string  // symbol
  t: number  // timestamp
  v: number  // volume
}

interface SocketMessage {
  data?: TradeData[]
  type: string
}

interface PricePoint {
  time: string
  price: number
  timestamp: number
}

export function useChartData() {
  const chartData = ref<{ labels: string[], datasets: any[] }>({
    labels: [],
    datasets: []
  })
  const isConnected = ref(false)
  const currentSymbol = ref<string>('')
  const updateInterval = ref<1 | 5>(1) // Default to 1 minute

  let socket: WebSocket | null = null
  const priceHistory: PricePoint[] = []
  const aggregatedData: PricePoint[] = []
  const maxDataPoints = 50 // Limit data points for performance

  const connect = () => {
    if (socket?.readyState === WebSocket.OPEN) return

    socket = new WebSocket('wss://ws.finnhub.io?token=d0s01vpr01qumepgrtigd0s01vpr01qumepgrtj0')

    socket.addEventListener('open', () => {
      console.log('WebSocket connected')
      isConnected.value = true
    })

    socket.addEventListener('message', (event) => {
      try {
        const message: SocketMessage = JSON.parse(event.data)

        if (message.type === 'trade' && message.data) {
          message.data.forEach(trade => {
            if (trade.s === currentSymbol.value) {
              updateChartData(trade.p, trade.t)
            }
          })
        }
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    })

    socket.addEventListener('close', () => {
      console.log('WebSocket disconnected')
      isConnected.value = false
    })

    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error)
      isConnected.value = false
    })
  }

  const subscribe = (symbol: string) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      connect()
      // Wait for connection before subscribing
      socket?.addEventListener('open', () => {
        doSubscribe(symbol)
      }, { once: true })
    } else {
      doSubscribe(symbol)
    }
  }

  const doSubscribe = (symbol: string) => {
    if (currentSymbol.value) {
      unsubscribe(currentSymbol.value)
    }

    currentSymbol.value = symbol
    priceHistory.length = 0 // Clear previous data
    aggregatedData.length = 0 // Clear aggregated data

    socket?.send(JSON.stringify({
      'type': 'subscribe',
      'symbol': symbol
    }))

    initializeChart(symbol)
  }

  const unsubscribe = (symbol: string) => {
    socket?.send(JSON.stringify({
      'type': 'unsubscribe',
      'symbol': symbol
    }))
  }

  const initializeChart = (symbol: string) => {
    chartData.value = {
      labels: [],
      datasets: [{
        label: `${symbol} Price (${updateInterval.value}min intervals)`,
        data: [],
        fill: false,
        borderColor: '#06b6d4',
        backgroundColor: '#06b6d4',
        tension: 0.4,
        pointRadius: 2
      }]
    }
  }

  const aggregateData = () => {
    const intervalMs = updateInterval.value * 60 * 1000 // Convert minutes to milliseconds
    const grouped = new Map<number, number[]>() // Use timestamp as key instead of string

    priceHistory.forEach(point => {
      // Round timestamp to interval boundary
      const intervalStart = Math.floor(point.timestamp / intervalMs) * intervalMs

      if (!grouped.has(intervalStart)) {
        grouped.set(intervalStart, [])
      }
      grouped.get(intervalStart)!.push(point.price)
    })

    // Calculate average price for each interval
    const newAggregatedData: PricePoint[] = []
    grouped.forEach((prices, intervalTimestamp) => {
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
      const timeKey = new Date(intervalTimestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })

      newAggregatedData.push({
        time: timeKey,
        price: avgPrice,
        timestamp: intervalTimestamp // Use the actual interval timestamp
      })
    })

    // Sort by timestamp and keep only recent data
    newAggregatedData.sort((a, b) => a.timestamp - b.timestamp)
    if (newAggregatedData.length > maxDataPoints) {
      newAggregatedData.splice(0, newAggregatedData.length - maxDataPoints)
    }

    aggregatedData.length = 0
    aggregatedData.push(...newAggregatedData)

    // Update chart
    chartData.value.labels = aggregatedData.map(item => item.time)
    chartData.value.datasets[0].data = aggregatedData.map(item => item.price)
    chartData.value.datasets[0].label = `${currentSymbol.value} Price (${updateInterval.value}min intervals)`
  }

  const updateChartData = (price: number, timestamp: number) => {
    const time = new Date(timestamp).toLocaleTimeString()

    priceHistory.push({ time, price, timestamp })

    // Keep reasonable amount of raw data for aggregation
    if (priceHistory.length > maxDataPoints * 10) {
      priceHistory.shift()
    }

    // Aggregate and update chart
    aggregateData()
  }

  const setUpdateInterval = (interval: 1 | 5) => {
    updateInterval.value = interval

    // Recalculate aggregated data with new interval
    if (priceHistory.length > 0) {
      aggregateData()
    }

    // Update chart label
    if (currentSymbol.value) {
      initializeChart(currentSymbol.value)
      aggregateData()
    }
  }

  const disconnect = () => {
    if (currentSymbol.value) {
      unsubscribe(currentSymbol.value)
    }
    socket?.close()
    socket = null
    isConnected.value = false
    currentSymbol.value = ''
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    chartData,
    isConnected,
    currentSymbol,
    updateInterval,
    subscribe,
    unsubscribe,
    disconnect,
    setUpdateInterval
  }
}
