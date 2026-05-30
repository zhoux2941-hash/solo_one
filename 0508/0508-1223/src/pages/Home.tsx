import { TowerControl } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <TowerControl className="text-cyan-400" size={40} />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              汉诺塔可视化
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            递归算法演示 · 交互式学习
          </p>
        </header>
        <div className="text-center text-white p-8 bg-slate-800 rounded-2xl">
          <p className="text-2xl mb-4">🧩 开发中...</p>
          <p className="text-slate-400">正在构建汉诺塔可视化应用</p>
        </div>
      </div>
    </div>
  );
}
