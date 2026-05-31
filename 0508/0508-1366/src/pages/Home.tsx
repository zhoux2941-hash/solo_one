import { NetworkCanvas } from '../components/NetworkCanvas';
import { Toolbar } from '../components/Toolbar';
import { PropertiesPanel } from '../components/PropertiesPanel';
import { Wifi } from 'lucide-react';

export default function Home() {
  return (
    <div className="h-screen w-screen flex flex-col bg-dark-950 overflow-hidden">
      <header className="h-14 bg-dark-900 border-b border-dark-700 flex items-center px-6 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Wifi size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white text-shadow-glow">
              中继器网络拓扑模拟器
            </h1>
            <p className="text-xs text-dark-500">Repeater Network Topology Simulator</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-dark-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>系统就绪</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <Toolbar />
        
        <main className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0">
            <NetworkCanvas />
          </div>
          
          <div className="absolute top-4 left-4 bg-dark-900/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-dark-700">
            <p className="text-xs text-dark-400">
              提示: 选择工具后在画布上操作 | 右键取消连线
            </p>
          </div>
        </main>
        
        <PropertiesPanel />
      </div>
    </div>
  );
}
