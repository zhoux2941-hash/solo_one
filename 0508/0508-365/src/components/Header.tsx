import { Hash, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

export const Header = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <header className="relative py-8 mb-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-cyan-500/5 to-teal-500/10 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -translate-y-1/2" />
      
      <div className="relative max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl shadow-lg shadow-sky-500/25">
              <Hash className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Base64 编码解码工具
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                支持文本、文件、图片转换 · 支持中文与Emoji · 本地处理更安全
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-slate-700/50"
            aria-label="切换主题"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-300" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
