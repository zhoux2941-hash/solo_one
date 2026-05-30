import { useState, useEffect, useRef } from 'react';
import NavBar from '@/components/NavBar';
import ShellCanvas from '@/components/ShellCanvas';
import ControlPanel from '@/components/ControlPanel';
import InscriptionPanel from '@/components/InscriptionPanel';
import ExportPanel from '@/components/ExportPanel';
import ExampleCard from '@/components/ExampleCard';
import ExampleDetailModal from '@/components/ExampleDetailModal';
import { useDivinationStore } from '@/stores/divinationStore';
import type { OracleExample } from '@/types';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'workbench' | 'examples'>('workbench');
  const [selectedExample, setSelectedExample] = useState<OracleExample | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { fetchTemplates, fetchExamples, examples } = useDivinationStore();

  useEffect(() => {
    fetchTemplates();
    fetchExamples();
  }, [fetchTemplates, fetchExamples]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'radial-gradient(ellipse at center, #2a1f10 0%, #1a1208 100%)',
      }}
    >
      <NavBar currentPage={currentPage} onNavigate={setCurrentPage} />

      {currentPage === 'workbench' ? (
        <main className="flex-1 flex flex-col p-6 gap-4">
          <div className="flex-1 flex gap-4 min-h-0">
            <div className="w-64 flex-shrink-0">
              <ControlPanel />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center min-h-0">
              <ShellCanvas ref={canvasRef} />
              <div className="mt-4">
                <ExportPanel canvasRef={canvasRef} />
              </div>
            </div>

            <div className="w-72 flex-shrink-0">
              <InscriptionPanel />
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto">
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: '#d4a843' }}
            >
              商王武丁时期甲骨示例
            </h2>
            <p className="text-sm mb-6" style={{ color: '#8b7355' }}>
              以下为三片典型的武丁时期宾组卜辞甲骨，点击卡片查看详情并加载到工作台
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {examples.map((example) => (
                <ExampleCard
                  key={example.id}
                  example={example}
                  onClick={() => setSelectedExample(example)}
                />
              ))}
            </div>
          </div>
        </main>
      )}

      <ExampleDetailModal
        example={selectedExample}
        onClose={() => setSelectedExample(null)}
      />
    </div>
  );
}
