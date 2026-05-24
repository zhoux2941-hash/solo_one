import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MapPin, CheckSquare, Anchor, Waves } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '任务队列', icon: Home },
    { path: '/demo', label: '轨迹演示', icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
              <Anchor className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg">浮标校正台</h1>
              <p className="text-xs text-slate-400">近海观测系统</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                  isActive
                    ? 'bg-cyan-600 text-white border-r-4 border-cyan-400'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">值</span>
            </div>
            <div>
              <p className="text-sm font-medium">值班员</p>
              <p className="text-xs text-slate-400">在线</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Waves className="w-6 h-6 text-cyan-600" />
            <h2 className="text-lg font-semibold text-slate-800">
              {navItems.find((item) => item.path === location.pathname)?.label || '系统'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-500">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">{children}</div>
      </main>
    </div>
  );
};
