import { useState } from "react";
import { useHashTableStore } from "@/store/useHashTableStore";
import { Hash, Trash2, Shuffle, RotateCcw, Plus, Gauge } from "lucide-react";

export default function ControlPanel() {
  const { size, rehashThreshold, insert, batchInsert, remove, reset, setRehashThreshold } = useHashTableStore();
  const [insertKey, setInsertKey] = useState("");
  const [deleteKey, setDeleteKey] = useState("");
  const [batchCount, setBatchCount] = useState(5);
  const [newSize, setNewSize] = useState(size);

  const handleInsert = () => {
    const key = parseInt(insertKey, 10);
    if (isNaN(key)) return;
    insert(key);
    setInsertKey("");
  };

  const handleDelete = () => {
    const key = parseInt(deleteKey, 10);
    if (isNaN(key)) return;
    remove(key);
    setDeleteKey("");
  };

  const handleReset = () => {
    reset(newSize);
  };

  const handleThresholdChange = (val: number) => {
    setRehashThreshold(val / 100);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <RotateCcw size={14} />
          表设置
        </h3>
        <div className="space-y-2">
          <label className="text-xs text-zinc-500">
            哈希表大小: <span className="text-cyan-400 font-mono font-bold">{newSize}</span>
          </label>
          <input
            type="range"
            min={5}
            max={50}
            value={newSize}
            onChange={(e) => setNewSize(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <button
            onClick={handleReset}
            className="w-full py-2 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-700 hover:border-cyan-600/50 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} />
            初始化 / 重置
          </button>
        </div>
      </div>

      <div className="border-t border-zinc-800" />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Gauge size={14} />
          Rehash 阈值
        </h3>
        <div className="space-y-2">
          <label className="text-xs text-zinc-500">
            自动 Rehash 触发: <span className="text-rose-400 font-mono font-bold">{Math.round(rehashThreshold * 100)}%</span>
          </label>
          <input
            type="range"
            min={50}
            max={90}
            step={5}
            value={Math.round(rehashThreshold * 100)}
            onChange={(e) => handleThresholdChange(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
            <span>50%</span>
            <span>75%</span>
            <span>90%</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-zinc-800/60 border border-zinc-700/40">
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              当负载因子超过阈值时，自动扩容（2倍）并重新哈希所有有效元素
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800" />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Hash size={14} />
          哈希函数
        </h3>
        <div className="px-3 py-2 rounded-lg bg-zinc-800/80 border border-zinc-700 font-mono text-sm text-cyan-400">
          h(key) = key % {size}
        </div>
      </div>

      <div className="border-t border-zinc-800" />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Plus size={14} />
          插入键
        </h3>
        <div className="flex gap-2">
          <input
            type="number"
            value={insertKey}
            onChange={(e) => setInsertKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInsert()}
            placeholder="输入整数key"
            className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm font-mono placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
          />
          <button
            onClick={handleInsert}
            className="px-4 py-2 rounded-lg bg-cyan-600/20 border border-cyan-500/50 text-cyan-400 text-sm font-medium hover:bg-cyan-600/30 hover:border-cyan-400/70 transition-all flex items-center gap-1.5"
          >
            <Plus size={14} />
            插入
          </button>
        </div>
      </div>

      <div className="border-t border-zinc-800" />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Shuffle size={14} />
          批量随机插入
        </h3>
        <div className="space-y-2">
          <label className="text-xs text-zinc-500">
            数量: <span className="text-cyan-400 font-mono font-bold">{batchCount}</span>
          </label>
          <input
            type="range"
            min={1}
            max={20}
            value={batchCount}
            onChange={(e) => setBatchCount(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <button
            onClick={() => batchInsert(batchCount)}
            className="w-full py-2 px-3 rounded-lg bg-violet-600/15 border border-violet-500/40 text-violet-400 text-sm font-medium hover:bg-violet-600/25 hover:border-violet-400/60 transition-all flex items-center justify-center gap-2"
          >
            <Shuffle size={14} />
            批量插入 {batchCount} 个随机键
          </button>
        </div>
      </div>

      <div className="border-t border-zinc-800" />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Trash2 size={14} />
          删除键
        </h3>
        <div className="flex gap-2">
          <input
            type="number"
            value={deleteKey}
            onChange={(e) => setDeleteKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleDelete()}
            placeholder="输入要删除的key"
            className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm font-mono placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
          />
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-amber-600/15 border border-amber-500/40 text-amber-400 text-sm font-medium hover:bg-amber-600/25 hover:border-amber-400/60 transition-all flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
