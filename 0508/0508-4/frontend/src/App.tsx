import { useEffect, useRef } from 'react'
import { useStockStore } from './store/stockStore'
import { useUserStore } from './store/userStore'
import { useWebSocketStore } from './store/websocketStore'
import MainPage from './pages/MainPage'
import { initWebSocket, disconnectWebSocket, updateSubscriptions } from './services/websocketService'

function App() {
  const { selectedStock } = useStockStore()
  const { isLoggedIn, watchlist } = useUserStore()
  const { setConnected, updateStockPrice } = useWebSocketStore()
  const previousCodesRef = useRef<string[]>([])

  useEffect(() => {
    initWebSocket(
      {
        onOpen: () => {
          console.log('[App] WebSocket connected')
          setConnected(true)
        },
        onClose: () => {
          console.log('[App] WebSocket disconnected')
          setConnected(false)
        },
        onMessage: (data) => {
          if (data.type === 'price_update') {
            updateStockPrice(data.payload)
          }
        },
        onError: (error) => {
          console.error('[App] WebSocket error:', error)
          setConnected(false)
        },
        onReconnect: (attempt) => {
          console.log(`[App] Reconnecting... attempt ${attempt}`)
        }
      },
      {
        maxReconnectAttempts: 100,
        initialReconnectDelay: 1000,
        maxReconnectDelay: 15000,
        heartbeatInterval: 25000
      }
    )

    return () => {
      console.log('[App] Cleaning up WebSocket')
      disconnectWebSocket()
    }
  }, [setConnected, updateStockPrice])

  useEffect(() => {
    const codes: string[] = []
    
    if (selectedStock) {
      codes.push(selectedStock.code)
    }
    
    if (isLoggedIn && watchlist) {
      watchlist.forEach(group => {
        group.stocks.forEach(stock => {
          if (!codes.includes(stock.code)) {
            codes.push(stock.code)
          }
        })
      })
    }

    const codesChanged = 
      codes.length !== previousCodesRef.current.length ||
      codes.some(code => !previousCodesRef.current.includes(code)) ||
      previousCodesRef.current.some(code => !codes.includes(code))

    if (codesChanged) {
      console.log(`[App] Updating subscriptions: ${codes.length} stocks`)
      updateSubscriptions(codes)
      previousCodesRef.current = codes
    }
  }, [selectedStock, watchlist, isLoggedIn])

  return <MainPage />
}

export default App
