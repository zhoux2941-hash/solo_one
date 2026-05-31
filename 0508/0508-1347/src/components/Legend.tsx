import { inventions } from '@/data/inventions';
import { useMapStore } from '@/store/useMapStore';

export default function Legend() {
  const { selectedInvention } = useMapStore();

  return (
    <div
      className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5 px-4 py-3 rounded-xl animate-legend-in"
      style={{
        background: 'rgba(10,14,23,0.8)',
        border: '1px solid rgba(245,230,200,0.08)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        className="text-[10px] font-semibold tracking-wider mb-1"
        style={{
          color: 'rgba(245,230,200,0.4)',
          fontFamily: "'Noto Sans SC', sans-serif",
        }}
      >
        图例
      </div>
      {inventions.map((inv) => {
        const isHighlighted =
          selectedInvention === null || selectedInvention === inv.id;
        return (
          <div
            key={inv.id}
            className="flex items-center gap-2 transition-opacity duration-300"
            style={{ opacity: isHighlighted ? 1 : 0.3 }}
          >
            <div className="flex items-center">
              <div
                className="w-5 h-[3px] rounded-full"
                style={{ backgroundColor: inv.strokeColor }}
              />
              <div
                className="absolute w-5 h-[3px] rounded-full"
                style={{ backgroundColor: inv.color, filter: `blur(2px)`, opacity: 0.6 }}
              />
            </div>
            <span
              className="text-[10px] relative"
              style={{
                color: isHighlighted ? inv.color : 'rgba(245,230,200,0.4)',
                fontFamily: "'Noto Sans SC', sans-serif",
              }}
            >
              {inv.icon} {inv.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
