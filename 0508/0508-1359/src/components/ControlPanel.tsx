import { useState } from 'react';
import { Database, ArrowRightLeft, RotateCcw, Timer } from 'lucide-react';
import useCacheStore from '@/hooks/useCacheStore';

export default function ControlPanel() {
  const { capacity, setCapacity, put, get, reset } = useCacheStore();
  const [putKey, setPutKey] = useState('');
  const [putValue, setPutValue] = useState('');
  const [putTTL, setPutTTL] = useState('');
  const [getKey, setGetKey] = useState('');

  const handlePut = () => {
    if (!putKey.trim() || !putValue.trim()) return;
    const ttl = putTTL.trim() ? Number(putTTL.trim()) : undefined;
    if (ttl !== undefined && (isNaN(ttl) || ttl <= 0)) return;
    put(putKey.trim(), putValue.trim(), ttl);
    setPutKey('');
    setPutValue('');
    setPutTTL('');
  };

  const handleGet = () => {
    if (!getKey.trim()) return;
    get(getKey.trim());
    setGetKey('');
  };

  const handleKeyDownPut = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handlePut();
  };

  const handleKeyDownGet = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleGet();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-[#1e2a3a] bg-[#0d1520]/80 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2">
          <Database size={18} className="text-[#00ffc8]" />
          <h2 className="font-display text-sm font-semibold tracking-wider text-[#00ffc8] uppercase">
            缓存容量
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={10}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="cache-slider flex-1"
          />
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#00ffc8]/30 bg-[#00ffc8]/10 font-mono text-lg font-bold text-[#00ffc8]">
            {capacity}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-[#1e2a3a] bg-[#0d1520]/80 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2">
          <ArrowRightLeft size={18} className="text-[#ff6b35]" />
          <h2 className="font-display text-sm font-semibold tracking-wider text-[#ff6b35] uppercase">
            存入数据 PUT
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Key"
            value={putKey}
            onChange={(e) => setPutKey(e.target.value)}
            onKeyDown={handleKeyDownPut}
            className="cache-input"
          />
          <input
            type="text"
            placeholder="Value"
            value={putValue}
            onChange={(e) => setPutValue(e.target.value)}
            onKeyDown={handleKeyDownPut}
            className="cache-input"
          />
          <div className="flex items-center gap-2">
            <Timer size={14} className="shrink-0 text-[#38bdf8]" />
            <input
              type="number"
              min={0}
              placeholder="TTL (秒，留空=永久)"
              value={putTTL}
              onChange={(e) => setPutTTL(e.target.value)}
              onKeyDown={handleKeyDownPut}
              className="cache-input ttl-input"
            />
          </div>
          <button onClick={handlePut} className="cache-btn cache-btn-put">
            <span className="font-mono text-xs tracking-widest">PUT</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#1e2a3a] bg-[#0d1520]/80 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2">
          <Database size={18} className="text-[#a78bfa]" />
          <h2 className="font-display text-sm font-semibold tracking-wider text-[#a78bfa] uppercase">
            读取数据 GET
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Key"
            value={getKey}
            onChange={(e) => setGetKey(e.target.value)}
            onKeyDown={handleKeyDownGet}
            className="cache-input"
          />
          <button onClick={handleGet} className="cache-btn cache-btn-get">
            <span className="font-mono text-xs tracking-widest">GET</span>
          </button>
        </div>
      </div>

      <button onClick={reset} className="cache-btn cache-btn-reset">
        <RotateCcw size={16} />
        <span className="font-mono text-xs tracking-widest">RESET</span>
      </button>
    </div>
  );
}
