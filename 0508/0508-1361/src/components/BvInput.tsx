import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface BvInputProps {
  onSubmit: (bv: string) => void;
  loading: boolean;
}

export default function BvInput({ onSubmit, loading }: BvInputProps) {
  const [bv, setBv] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedBv = bv.trim();
    if (trimmedBv && !loading) {
      onSubmit(trimmedBv);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={bv}
            onChange={(e) => setBv(e.target.value)}
            placeholder="请输入视频BV号，如：BV1xx411c7mD"
            className="w-full px-5 py-4 pr-12 rounded-xl border-2 border-gray-200 focus:border-pink-400 focus:outline-none transition-colors text-gray-700 placeholder-gray-400 text-base"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !bv.trim()}
          className="px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-400 text-white rounded-xl font-medium hover:from-pink-600 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:-translate-y-0.5 active:translate-y-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>分析中</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>分析</span>
            </>
          )}
        </button>
      </div>
      <p className="text-center text-gray-400 text-sm mt-3">
        输入B站视频BV号，即可获取弹幕数据并进行词频分析
      </p>
    </form>
  );
}
