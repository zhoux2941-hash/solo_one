import { IncenseLibrary } from '../components/IncenseLibrary';
import { FormulaAnalyzer } from '../components/FormulaAnalyzer';
import { IncenseSimulator } from '../components/IncenseSimulator';
import { ClassicFormulas } from '../components/ClassicFormulas';
import { PDFExport } from '../components/PDFExport';
import { Flame } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-orange-50">
      <div className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238B4513' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <header className="relative bg-gradient-to-r from-stone-900 via-stone-800 to-amber-900 
        text-white py-8 px-6 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Flame className="text-amber-400 animate-pulse" size={40} />
            <h1 className="text-4xl font-bold tracking-wider"
              style={{ fontFamily: "'Ma Shan Zheng', 'Noto Serif SC', serif" }}>
              传统香方配伍模拟
            </h1>
            <Flame className="text-amber-400 animate-pulse scale-x-[-1]" size={40} />
          </div>
          <p className="text-center text-stone-300 text-lg">
            探索千年香道文化 · 品味古法配伍之美
          </p>
          <div className="flex items-center justify-center gap-8 mt-4 text-sm text-stone-400">
            <span>🍃 十味经典香料</span>
            <span>🔥 隔火熏香模拟</span>
            <span>📜 历代经典香方</span>
            <span>📄 香方卡片导出</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
      </header>

      <main className="relative max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <IncenseLibrary />
          </div>

          <div className="lg:col-span-4 space-y-6">
            <IncenseSimulator />
            <PDFExport />
          </div>

          <div className="lg:col-span-4 space-y-6">
            <FormulaAnalyzer />
            <ClassicFormulas />
          </div>
        </div>
      </main>

      <footer className="relative bg-stone-900 text-stone-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm mb-2">
            🌿 香道文化源远流长 · 静心品味生活之美 🌿
          </p>
          <p className="text-xs text-stone-500">
            本系统仅供学习体验，实际制香请咨询专业人士
          </p>
        </div>
      </footer>
    </div>
  );
}
