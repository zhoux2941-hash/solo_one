import { useState, useCallback, useEffect } from 'react';
import { ArrowRightLeft, Type, Hash, X } from 'lucide-react';
import { CopyButton } from './CopyButton';
import { Base64Service } from '@/services/Base64Service';
import { cn } from '@/lib/utils';

type Mode = 'encode' | 'decode';

export const TextConverter = () => {
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleEncode = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }
    try {
      const result = Base64Service.encode(input);
      setOutput(result);
      setError(null);
    } catch (err) {
      setError('编码失败：' + (err as Error).message);
      setOutput('');
    }
  }, [input]);

  const handleDecode = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }
    try {
      if (!Base64Service.isValidBase64(input)) {
        setError('无效的Base64字符串');
        setOutput('');
        return;
      }
      const result = Base64Service.decode(input);
      setOutput(result);
      setError(null);
    } catch (err) {
      setError('解码失败：请检查输入是否为有效的Base64字符串');
      setOutput('');
    }
  }, [input]);

  useEffect(() => {
    if (mode === 'encode') {
      handleEncode();
    } else {
      handleDecode();
    }
  }, [input, mode, handleEncode, handleDecode]);

  const toggleMode = () => {
    setMode(mode === 'encode' ? 'decode' : 'encode');
    setInput(output);
    setOutput(input);
    setError(null);
  };

  const clearInput = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  const placeholder = mode === 'encode' 
    ? '输入普通文本，支持中文、Emoji等Unicode字符...' 
    : '输入Base64字符串进行解码...';

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl shadow-lg shadow-sky-500/25">
              {mode === 'encode' ? <Type className="w-5 h-5 text-white" /> : <Hash className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {mode === 'encode' ? '文本 → Base64' : 'Base64 → 文本'}
              </h2>
              <p className="text-slate-400 text-sm">实时{mode === 'encode' ? '编码' : '解码'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMode}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all text-sm"
              title="切换模式"
            >
              <ArrowRightLeft className="w-4 h-4" />
              切换
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-300">
              {mode === 'encode' ? '原始文本' : 'Base64 字符串'}
            </label>
            {input && (
              <button
                onClick={clearInput}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-3 h-3" />
                清空
              </button>
            )}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className={cn(
              'w-full h-40 px-4 py-3 rounded-xl bg-slate-900/50 border transition-all duration-200',
              'text-white placeholder-slate-500 font-mono text-sm',
              'focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50',
              'resize-none',
              error ? 'border-red-500/50' : 'border-slate-600/50'
            )}
          />
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-300">
              {mode === 'encode' ? 'Base64 结果' : '解码结果'}
            </label>
            <CopyButton text={output} />
          </div>
          <textarea
            value={output}
            readOnly
            placeholder={mode === 'encode' ? '编码结果将显示在这里...' : '解码结果将显示在这里...'}
            className="w-full h-40 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-600/50 text-slate-300 placeholder-slate-500 font-mono text-sm resize-none focus:outline-none"
          />
        </div>

        {mode === 'encode' && (
          <div className="text-xs text-slate-500">
            提示：支持中文、日文、韩文、Emoji 等所有 Unicode 字符
          </div>
        )}
      </div>
    </div>
  );
};
