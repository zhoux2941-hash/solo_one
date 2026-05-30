import { useState } from 'react';
import { Home, BookOpen, ScrollText } from 'lucide-react';

interface NavBarProps {
  currentPage: 'workbench' | 'examples';
  onNavigate: (page: 'workbench' | 'examples') => void;
}

export default function NavBar({ currentPage, onNavigate }: NavBarProps) {
  return (
    <nav
      className="w-full px-6 py-3 flex items-center justify-between"
      style={{
        background: 'linear-gradient(180deg, rgba(26, 18, 8, 0.95), rgba(26, 18, 8, 0.8))',
        borderBottom: '1px solid rgba(139, 105, 20, 0.4)',
      }}
    >
      <div className="flex items-center gap-3">
        <ScrollText size={28} style={{ color: '#d4a843' }} />
        <h1 className="text-xl font-bold tracking-wide" style={{ color: '#d4a843' }}>
          龟甲占卜 · 甲骨灼烧裂纹模拟器
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('workbench')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentPage === 'workbench' ? '' : 'opacity-70 hover:opacity-100'
          }`}
          style={{
            background: currentPage === 'workbench'
              ? 'linear-gradient(180deg, #8b6914, #6b4f0e)'
              : 'transparent',
            border: currentPage === 'workbench'
              ? '1px solid #a07d20'
              : '1px solid transparent',
            color: '#f5e6c8',
          }}
        >
          <Home size={16} />
          占卜工作台
        </button>

        <button
          onClick={() => onNavigate('examples')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentPage === 'examples' ? '' : 'opacity-70 hover:opacity-100'
          }`}
          style={{
            background: currentPage === 'examples'
              ? 'linear-gradient(180deg, #8b6914, #6b4f0e)'
              : 'transparent',
            border: currentPage === 'examples'
              ? '1px solid #a07d20'
              : '1px solid transparent',
            color: '#f5e6c8',
          }}
        >
          <BookOpen size={16} />
          甲骨示例
        </button>
      </div>
    </nav>
  );
}
