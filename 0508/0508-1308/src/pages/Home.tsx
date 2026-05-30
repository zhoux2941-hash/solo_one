import { useStore } from '../store/useStore';
import { useFetchData } from '../hooks/useFetchData';
import RoleSelector from '../components/RoleSelector';
import CharacterList from '../components/CharacterList';
import FaceCanvas from '../components/FaceCanvas';
import ColorEditor from '../components/ColorEditor';
import ExportPanel from '../components/ExportPanel';
import OperaPanel from '../components/OperaPanel';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function Home() {
  useFetchData();
  const { loading, error } = useStore();

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-gradient-to-r from-primary via-primary-dark to-primary py-8 px-4 shadow-xl">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-display text-white mb-2 drop-shadow-lg">
            川剧脸谱查询与配色生成系统
          </h1>
          <p className="text-gold-light text-lg">
            探索川剧脸谱艺术 · 自定义配色创意设计
          </p>
        </div>
      </header>

      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gold via-gold-light to-gold" />

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-8">
          <RoleSelector />
        </div>

        <div className="mb-8">
          <CharacterList />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
              <FaceCanvas />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
              <OperaPanel />
            </div>
          </div>

          <div className="space-y-6">
            <div className="animate-fade-in-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
              <ColorEditor />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.25s', opacity: 0 }}>
              <ExportPanel />
            </div>
          </div>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-paper p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-ink font-display text-lg">加载中...</p>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-ink text-paper-light py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="font-display text-lg text-gold mb-2">
            川剧脸谱查询与配色生成系统
          </p>
          <p className="text-sm text-paper/60">
            传承川剧文化 · 弘扬传统艺术
          </p>
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-gold via-gold-light to-gold" />
    </div>
  );
}
