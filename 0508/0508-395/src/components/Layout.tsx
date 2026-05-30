import type { ReactNode } from 'react';
import Navigation from './Navigation';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen dot-pattern">
      <Navigation />
      
      <main className="relative py-8">
        {children}
      </main>
      
      <footer className="relative border-t border-slate-200 mt-16 py-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>ColorSpace Pro &copy; {new Date().getFullYear()} - 专业颜色空间转换与管理工具</p>
          <p className="mt-1 text-xs text-slate-400">
            支持 RGB · CMYK · Pantone · Lab · 色差计算 · 专色叠印
          </p>
        </div>
      </footer>
    </div>
  );
}
