import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
      
      <footer className="py-6 border-t border-dark-700/50 bg-dark-900/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-dark-400 text-sm">
            五笔编码查询系统 · 86版 · 常用3500字
          </p>
          <p className="text-dark-500 text-xs mt-1">
            数据仅供学习参考 · 按字根拆分规则编制
          </p>
        </div>
      </footer>
    </div>
  );
}
