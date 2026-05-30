import React from 'react';
import { ControlPanel } from '@/components/ControlPanel';
import { BambooWorkspace } from '@/components/BambooWorkspace';
import { ReadingPanel } from '@/components/ReadingPanel';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900">
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(180, 83, 9, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(120, 53, 15, 0.4) 0%, transparent 50%)
          `
        }}
      />
      
      <div className="relative min-h-screen flex flex-col">
        <header className="py-6 px-8 border-b border-stone-700 bg-stone-900 bg-opacity-80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-700 to-red-900 rounded-xl flex items-center justify-center shadow-lg border-2 border-red-600">
                <span className="text-amber-100 font-bold text-xl">簡</span>
              </div>
              <div>
                <h1 
                  className="text-2xl font-bold text-amber-100"
                  style={{ fontFamily: "'Noto Serif SC', serif" }}
                >
                  竹简编联模拟器
                </h1>
                <p className="text-amber-500 text-sm">Bamboo Slip Reconstruction Simulator</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-stone-400 text-sm">
              <span className="px-3 py-1 bg-stone-700 bg-opacity-50 rounded-full">
                郭店楚简 · 《老子》甲本
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex p-6 gap-6 max-w-7xl mx-auto w-full">
          <ControlPanel />
          <BambooWorkspace />
          <ReadingPanel />
        </main>

        <footer className="py-4 px-8 border-t border-stone-700 bg-stone-900 bg-opacity-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-stone-500 text-sm">
            <span>基于1993年湖北荆门郭店一号楚墓出土竹简数字化复原</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              数字人文体验项目
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;
