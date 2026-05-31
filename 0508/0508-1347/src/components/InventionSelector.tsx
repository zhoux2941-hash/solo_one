import { inventions } from '@/data/inventions';
import { useMapStore } from '@/store/useMapStore';

export default function InventionSelector() {
  const { selectedInvention, selectInvention } = useMapStore();

  return (
    <div className="flex items-center gap-3 animate-fade-up" style={{ animationDelay: '0.5s' }}>
      {inventions.map((inv, idx) => {
        const isActive = selectedInvention === inv.id;
        return (
          <button
            key={inv.id}
            onClick={() => selectInvention(inv.id)}
            className={`
              relative flex items-center gap-2 px-5 py-2.5 rounded-full
              border transition-all duration-500 ease-out
              ${
                isActive
                  ? 'border-current shadow-lg scale-105'
                  : 'border-amber-900/30 hover:border-amber-700/50'
              }
            `}
            style={{
              animationDelay: `${0.6 + idx * 0.1}s`,
              color: isActive ? inv.color : 'rgba(245,230,200,0.6)',
              backgroundColor: isActive
                ? `${inv.strokeColor}30`
                : 'rgba(245,230,200,0.04)',
              borderColor: isActive ? inv.strokeColor : undefined,
              boxShadow: isActive
                ? `0 0 20px ${inv.glowColor}, 0 0 40px ${inv.glowColor}, 0 0 60px ${inv.glowColor}, inset 0 1px 0 ${inv.color}40`
                : 'none',
            }}
          >
            <span className="text-lg">{inv.icon}</span>
            <span
              className="text-sm font-semibold tracking-wide"
              style={{
                fontFamily: "'Noto Serif SC', serif",
                color: isActive ? inv.color : 'rgba(245,230,200,0.7)',
              }}
            >
              {inv.name}
            </span>
            {isActive && (
              <span
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                style={{ backgroundColor: inv.color }}
              />
            )}
          </button>
        );
      })}
      {selectedInvention && (
        <button
          onClick={() => selectInvention(null)}
          className="ml-2 text-xs text-amber-200/40 hover:text-amber-200/70 transition-colors"
          style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
        >
          查看全部
        </button>
      )}
    </div>
  );
}
