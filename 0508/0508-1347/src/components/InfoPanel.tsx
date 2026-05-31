import { inventions, timelineEvents } from '@/data/inventions';
import { useMapStore } from '@/store/useMapStore';
import { X, BookOpen } from 'lucide-react';

export default function InfoPanel() {
  const { selectedInvention, isPanelOpen, togglePanel } = useMapStore();

  if (!selectedInvention) return null;

  const invention = inventions.find((i) => i.id === selectedInvention)!;
  const events = timelineEvents[selectedInvention] || [];

  return (
    <div
      className={`
        absolute right-0 top-0 h-full w-[380px] z-20
        transition-transform duration-500 ease-out
        ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
      style={{
        background:
          'linear-gradient(135deg, rgba(10,14,23,0.95) 0%, rgba(15,22,40,0.98) 100%)',
        borderLeft: `1px solid ${invention.color}25`,
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="h-full flex flex-col overflow-hidden animate-panel-in">
        <div className="flex items-center justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{invention.icon}</span>
            <h2
              className="text-xl font-bold tracking-wider"
              style={{
                color: invention.color,
                fontFamily: "'Noto Serif SC', serif",
              }}
            >
              {invention.name}
            </h2>
          </div>
          <button
            onClick={togglePanel}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: 'rgba(245,230,200,0.5)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pb-4">
          <p
            className="text-xs leading-relaxed"
            style={{
              color: 'rgba(245,230,200,0.6)',
              fontFamily: "'Noto Sans SC', sans-serif",
            }}
          >
            {invention.description}
          </p>
        </div>

        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={14} style={{ color: invention.color }} />
            <h3
              className="text-sm font-semibold tracking-wide"
              style={{
                color: invention.color,
                fontFamily: "'Noto Serif SC', serif",
              }}
            >
              传播时间线
            </h3>
          </div>
          <div className="relative pl-5">
            <div
              className="absolute left-[7px] top-1 bottom-1 w-px"
              style={{ backgroundColor: `${invention.color}30` }}
            />
            {events.map((event, idx) => (
              <div key={idx} className="relative pb-4 last:pb-0 group animate-fade-up" style={{ animationDelay: `${0.1 + idx * 0.08}s` }}>
                <div
                  className="absolute left-[-17px] top-1.5 w-3 h-3 rounded-full border-2"
                  style={{
                    borderColor: invention.color,
                    backgroundColor: idx === 0 ? invention.color : '#0a0e17',
                  }}
                />
                <div
                  className="text-[10px] font-bold mb-0.5 tracking-wider"
                  style={{ color: invention.color }}
                >
                  {event.year}
                </div>
                <div
                  className="text-xs font-semibold mb-0.5"
                  style={{
                    color: 'rgba(245,230,200,0.85)',
                    fontFamily: "'Noto Serif SC', serif",
                  }}
                >
                  {event.title}
                </div>
                <div
                  className="text-[10px] leading-relaxed"
                  style={{
                    color: 'rgba(245,230,200,0.5)',
                    fontFamily: "'Noto Sans SC', sans-serif",
                  }}
                >
                  {event.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto p-5 pt-3 border-t" style={{ borderColor: `${invention.color}15` }}>
          <h3
            className="text-sm font-semibold mb-2 tracking-wide"
            style={{
              color: invention.color,
              fontFamily: "'Noto Serif SC', serif",
            }}
          >
            对欧洲的影响
          </h3>
          <p
            className="text-xs leading-relaxed"
            style={{
              color: 'rgba(245,230,200,0.6)',
              fontFamily: "'Noto Sans SC', sans-serif",
            }}
          >
            {invention.europeImpact}
          </p>
        </div>
      </div>
    </div>
  );
}
