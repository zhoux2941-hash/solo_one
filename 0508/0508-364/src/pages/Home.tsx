import { Database, Globe } from 'lucide-react';
import { Header } from '../components/Header';
import { FieldConfigPanel } from '../components/FieldConfigPanel/FieldConfigPanel';
import { PreviewPanel } from '../components/PreviewPanel/PreviewPanel';
import { SettingsPanel } from '../components/SettingsPanel/SettingsPanel';
import { MockApiPanel } from '../components/MockApiPanel/MockApiPanel';
import { RequestLogPanel } from '../components/MockApiPanel/RequestLogPanel';
import { useMockApiStore } from '../store/useMockApiStore';

export default function Home() {
  const { activeTab, logsPanelOpen, setActiveTab, setLogsPanelOpen } = useMockApiStore();

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      <Header />

      <div className="flex border-b border-slate-700/50 bg-slate-900/50">
        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'data'
              ? 'text-cyan-400 border-cyan-500'
              : 'text-slate-400 border-transparent hover:text-slate-300'
          }`}
        >
          <Database className="w-4 h-4" />
          数据生成
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'api'
              ? 'text-cyan-400 border-cyan-500'
              : 'text-slate-400 border-transparent hover:text-slate-300'
          }`}
        >
          <Globe className="w-4 h-4" />
          Mock Server
        </button>
      </div>
      
      {activeTab === 'data' ? (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-[320px] flex-shrink-0 border-r border-slate-700/50">
            <FieldConfigPanel />
          </div>
          
          <div className="flex-1 border-r border-slate-700/50">
            <PreviewPanel />
          </div>
          
          <div className="w-[280px] flex-shrink-0">
            <SettingsPanel />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-[380px] flex-shrink-0 border-r border-slate-700/50">
            <MockApiPanel />
          </div>
          <div className="flex-1 flex flex-col">
            {logsPanelOpen ? (
              <RequestLogPanel onClose={() => setLogsPanelOpen(false)} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Globe className="w-16 h-16 mb-4 text-slate-600" />
                <h3 className="text-lg font-medium mb-2">Mock Server 管理</h3>
                <p className="text-sm text-slate-600 max-w-md text-center mb-4">
                  在左侧创建和管理Mock API接口。每个接口都会注册到 http://localhost:3001/mock/* 路径下，支持自定义响应延迟和状态码。
                </p>
                <p className="text-xs text-slate-600">
                  💡 点击左侧面板的「终端」图标查看请求日志
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
