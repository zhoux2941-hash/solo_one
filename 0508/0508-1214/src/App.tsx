import { useState } from 'react'
import { QrCode, Scan, Layers } from 'lucide-react'
import QrCodeGenerator from './components/QrCodeGenerator'
import QrCodeDecoder from './components/QrCodeDecoder'
import BatchGenerator from './components/BatchGenerator'

type TabType = 'generate' | 'decode' | 'batch'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('generate')

  const tabs = [
    { id: 'generate' as const, label: '生成二维码', icon: QrCode },
    { id: 'decode' as const, label: '解析二维码', icon: Scan },
    { id: 'batch' as const, label: '批量生成', icon: Layers },
  ]

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            二维码生成与解析工具
          </h1>
          <p className="text-white/80">
            支持实时生成、Logo添加、反向解析和批量生成
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex border-b border-gray-100">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>

          <div className="p-6 md:p-8">
            {activeTab === 'generate' && <QrCodeGenerator />}
            {activeTab === 'decode' && <QrCodeDecoder />}
            {activeTab === 'batch' && <BatchGenerator />}
          </div>
        </div>

        <div className="mt-6 text-center text-white/60 text-sm">
          <p>使用 qrcode 库生成 · jsQR 解析</p>
        </div>
      </div>
    </div>
  )
}

export default App
