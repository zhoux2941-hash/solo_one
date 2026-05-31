import { Target, XCircle, Percent } from 'lucide-react';
import useCacheStore from '@/hooks/useCacheStore';

export default function StatsPanel() {
  const { hits, misses } = useCacheStore();
  const total = hits + misses;
  const hitRate = total > 0 ? ((hits / total) * 100).toFixed(1) : '0.0';

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl border border-[#00ffc8]/20 bg-gradient-to-br from-[#00ffc8]/8 to-transparent p-4 text-center">
        <Target size={20} className="mx-auto mb-2 text-[#00ffc8]" />
        <div className="font-mono text-2xl font-bold text-[#00ffc8]">{hits}</div>
        <div className="mt-1 font-mono text-[10px] tracking-wider text-[#00ffc8]/60 uppercase">
          命中
        </div>
      </div>

      <div className="rounded-xl border border-[#ff6b35]/20 bg-gradient-to-br from-[#ff6b35]/8 to-transparent p-4 text-center">
        <XCircle size={20} className="mx-auto mb-2 text-[#ff6b35]" />
        <div className="font-mono text-2xl font-bold text-[#ff6b35]">{misses}</div>
        <div className="mt-1 font-mono text-[10px] tracking-wider text-[#ff6b35]/60 uppercase">
          未命中
        </div>
      </div>

      <div className="rounded-xl border border-[#a78bfa]/20 bg-gradient-to-br from-[#a78bfa]/8 to-transparent p-4 text-center">
        <Percent size={20} className="mx-auto mb-2 text-[#a78bfa]" />
        <div className="font-mono text-2xl font-bold text-[#a78bfa]">{hitRate}%</div>
        <div className="mt-1 font-mono text-[10px] tracking-wider text-[#a78bfa]/60 uppercase">
          命中率
        </div>
      </div>
    </div>
  );
}
