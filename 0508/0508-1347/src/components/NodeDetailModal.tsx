import { inventions } from '@/data/inventions';
import { useMapStore } from '@/store/useMapStore';
import { X, MapPin, Clock } from 'lucide-react';

export default function NodeDetailModal() {
  const { selectedNode, selectNode } = useMapStore();

  if (!selectedNode) return null;

  const invention = inventions.find((i) => i.id === selectedNode.inventionId)!;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={() => selectNode(null)}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative max-w-lg w-full mx-4 rounded-2xl overflow-hidden animate-modal-in"
        style={{
          background:
            'linear-gradient(145deg, rgba(15,22,40,0.97) 0%, rgba(10,14,23,0.99) 100%)',
          border: `1px solid ${invention.color}30`,
          boxShadow: `0 0 40px ${invention.glowColor}, 0 25px 50px rgba(0,0,0,0.5)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${invention.color}, transparent)`,
          }}
        />

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{
                  backgroundColor: `${invention.color}20`,
                  border: `1px solid ${invention.color}40`,
                }}
              >
                {invention.icon}
              </div>
              <div>
                <h2
                  className="text-lg font-bold tracking-wider"
                  style={{
                    color: invention.color,
                    fontFamily: "'Noto Serif SC', serif",
                  }}
                >
                  {selectedNode.name}
                </h2>
                <div
                  className="text-xs mt-0.5"
                  style={{
                    color: 'rgba(245,230,200,0.5)',
                    fontFamily: "'Noto Sans SC', sans-serif",
                  }}
                >
                  {invention.name}传播节点
                </div>
              </div>
            </div>
            <button
              onClick={() => selectNode(null)}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: 'rgba(245,230,200,0.5)' }}
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
              style={{
                backgroundColor: `${invention.color}15`,
                color: invention.color,
                border: `1px solid ${invention.color}30`,
              }}
            >
              <Clock size={12} />
              <span className="font-semibold">{selectedNode.year}</span>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
              style={{
                backgroundColor: 'rgba(245,230,200,0.05)',
                color: 'rgba(245,230,200,0.6)',
                border: '1px solid rgba(245,230,200,0.1)',
              }}
            >
              <MapPin size={12} />
              <span>{selectedNode.shortDesc}</span>
            </div>
          </div>

          <div
            className="text-sm leading-relaxed p-4 rounded-xl"
            style={{
              color: 'rgba(245,230,200,0.8)',
              backgroundColor: 'rgba(245,230,200,0.03)',
              border: '1px solid rgba(245,230,200,0.06)',
              fontFamily: "'Noto Sans SC', sans-serif",
            }}
          >
            {selectedNode.detail}
          </div>
        </div>
      </div>
    </div>
  );
}
