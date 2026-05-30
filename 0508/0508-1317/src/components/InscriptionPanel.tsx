import { useState, useEffect } from 'react';
import { BookOpen, PenTool, X } from 'lucide-react';
import { useDivinationStore } from '@/stores/divinationStore';
import type { DivinationTemplate } from '@/types';

const CATEGORIES = ['天气', '军事', '祭祀', '农业', '田猎', '疾病', '生育', '出行'];

export default function InscriptionPanel() {
  const { templates, inscriptions, fetchTemplates, removeInscription } = useDivinationStore();
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [selectedContent, setSelectedContent] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const grouped = CATEGORIES.reduce<Record<string, DivinationTemplate[]>>((acc, cat) => {
    acc[cat] = templates.filter((t) => t.category === cat);
    return acc;
  }, {});

  const currentTemplates = grouped[activeCategory] || [];

  return (
    <div
      className="flex h-full flex-col gap-4 overflow-auto p-4"
      style={{ background: '#1a1208cc' }}
    >
      <div>
        <div className="mb-3 flex items-center gap-2 text-base font-bold" style={{ color: '#d4a853' }}>
          <BookOpen size={18} />
          <span>卜辞模板</span>
        </div>

        <div className="mb-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="shrink-0 rounded-full px-3 py-1 text-xs transition-colors"
              style={{
                color: activeCategory === cat ? '#1a1208' : '#d4a853',
                background: activeCategory === cat ? '#d4a853' : '#2a1f0e',
                border: '1px solid #d4a85344',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {currentTemplates.length === 0 && (
            <p className="text-center text-xs" style={{ color: '#8b7355' }}>暂无此分类模板</p>
          )}
          {currentTemplates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedContent(t.content)}
              className="rounded border border-transparent px-3 py-2 text-left transition-colors hover:border-[#d4a85388]"
              style={{ background: '#2a1f0e' }}
            >
              <p className="text-sm" style={{ color: '#d4a853' }}>{t.content}</p>
              <p className="mt-1 text-xs" style={{ color: '#8b7355' }}>{t.interpretation}</p>
            </button>
          ))}
        </div>

        {selectedContent && (
          <div className="mt-3 rounded p-2 text-xs" style={{ background: '#2a1f0e', color: '#d4a853', border: '1px solid #d4a85344' }}>
            已选择: {selectedContent}
          </div>
        )}
      </div>

      <div className="border-t" style={{ borderColor: '#d4a85333' }}>
        <div className="mb-3 mt-3 flex items-center gap-2 text-base font-bold" style={{ color: '#d4a853' }}>
          <PenTool size={18} />
          <span>卜辞标注列表</span>
        </div>

        {inscriptions.length === 0 ? (
          <p className="text-center text-xs" style={{ color: '#8b7355' }}>
            点击龟甲裂纹旁添加卜辞标注
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {inscriptions.map((ins) => (
              <div
                key={ins.id}
                className="flex items-center justify-between rounded px-3 py-2"
                style={{ background: '#2a1f0e', border: '1px solid #d4a85333' }}
              >
                <span className="text-sm" style={{ color: '#d4a853' }}>{ins.text}</span>
                <button
                  onClick={() => removeInscription(ins.id)}
                  className="ml-2 shrink-0 rounded p-1 transition-colors hover:bg-red-900/40"
                  style={{ color: '#8b7355' }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
