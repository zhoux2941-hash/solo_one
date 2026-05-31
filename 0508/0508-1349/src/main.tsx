import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { initializeStore } from './store/useTasksStore'

const rootElement = document.getElementById('root')!
const root = createRoot(rootElement)

root.render(
  <div className="min-h-screen bg-cream-100 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-mint-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-ink-600 font-sans">正在加载数据...</p>
    </div>
  </div>
)

const init = async () => {
  try {
    console.log('[Main] Starting application initialization...')
    await initializeStore()
    console.log('[Main] Initialization complete, rendering app...')
    
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (error) {
    console.error('[Main] Initialization failed:', error)
    root.render(
      <div className="min-h-screen bg-cream-100 flex items-center justify-center p-8">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-serif font-semibold text-ink-800 mb-2">
            初始化失败
          </h2>
          <p className="text-ink-600 mb-4">
            无法初始化本地数据库，请确保浏览器支持IndexedDB
          </p>
          <p className="text-sm text-ink-600/70 mb-4">
            错误信息: {error instanceof Error ? error.message : String(error)}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-warm-500 text-white rounded-full hover:bg-warm-600 transition-colors"
          >
            刷新重试
          </button>
        </div>
      </div>
    )
  }
}

init()
