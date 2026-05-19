import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import router from './router'
import { useThemeStore } from './store/useThemeStore'
import './i18n'
import './index.css'

const { defaultAlgorithm, darkAlgorithm } = theme

const App = () => {
  const { mode } = useThemeStore()

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: mode === 'dark' ? darkAlgorithm : defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
