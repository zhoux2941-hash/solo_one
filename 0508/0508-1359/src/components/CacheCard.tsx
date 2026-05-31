import { Clock, Zap, Timer } from 'lucide-react';
import type { CacheEntry } from '@/utils/lru-cache';

interface CacheCardProps {
  item: CacheEntry;
  index: number;
  total: number;
  now: number;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return '0s';
  const sec = Math.ceil(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const remainSec = sec % 60;
  return `${min}m${remainSec}s`;
}

export default function CacheCard({ item, index, total, now }: CacheCardProps) {
  const isMostRecent = index === 0;
  const isLeastRecent = index === total - 1 && total > 1;
  const hasTTL = item.expiresAt !== null;
  const remaining = hasTTL ? Math.max(0, item.expiresAt! - now) : null;
  const isExpiring = remaining !== null && remaining > 0 && remaining < 3000;
  const ttlPercent =
    remaining !== null ? Math.min(100, (remaining / (remaining + 100)) * 100) : null;

  return (
    <div
      className={`cache-card group relative flex shrink-0 flex-col gap-2 rounded-xl border p-4 transition-all duration-500 ease-out ${
        isMostRecent
          ? 'border-[#00ffc8]/40 bg-gradient-to-br from-[#00ffc8]/10 to-[#00ffc8]/5 shadow-[0_0_20px_rgba(0,255,200,0.1)]'
          : isLeastRecent
            ? 'border-[#ff6b35]/30 bg-gradient-to-br from-[#ff6b35]/8 to-[#ff6b35]/3'
            : 'border-[#1e2a3a] bg-[#0d1520]/60'
      }`}
      style={{
        width: '150px',
        animationDelay: `${index * 60}ms`,
        ['--card-key' as string]: `card-${item.key}`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          {isMostRecent ? (
            <Zap size={12} className="text-[#00ffc8]" />
          ) : (
            <Clock size={12} className="text-[#5a6a7a]" />
          )}
          <span className="font-mono text-[10px] tracking-wider text-[#5a6a7a] uppercase">
            {isMostRecent ? 'MRU' : isLeastRecent ? 'LRU' : `#${index + 1}`}
          </span>
        </span>
        <span className="rounded bg-[#1e2a3a] px-2 py-0.5 font-mono text-[10px] text-[#5a6a7a]">
          {index + 1}/{total}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#5a6a7a]">KEY</span>
          <span
            className={`truncate font-mono text-sm font-bold ${
              isMostRecent ? 'text-[#00ffc8]' : 'text-[#c8d6e5]'
            }`}
          >
            {item.key}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#5a6a7a]">VAL</span>
          <span className="truncate font-mono text-sm text-[#8b9cb5]">{item.value}</span>
        </div>
      </div>

      {hasTTL && remaining !== null && (
        <div className="mt-0.5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Timer
              size={10}
              className={`shrink-0 ${isExpiring ? 'animate-pulse text-[#ef4444]' : 'text-[#38bdf8]'}`}
            />
            <span
              className={`font-mono text-[10px] font-semibold ${
                isExpiring ? 'text-[#ef4444]' : 'text-[#38bdf8]'
              }`}
            >
              {formatRemaining(remaining)}
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[#1e2a3a]">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                isExpiring
                  ? 'bg-[#ef4444]'
                  : 'bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9]'
              }`}
              style={{ width: `${ttlPercent}%` }}
            />
          </div>
        </div>
      )}

      {isLeastRecent && total > 1 && (
        <div className="mt-1 rounded border border-[#ff6b35]/20 bg-[#ff6b35]/5 px-2 py-1 text-center">
          <span className="font-mono text-[10px] text-[#ff6b35]">
            下次淘汰 →
          </span>
        </div>
      )}
    </div>
  );
}
