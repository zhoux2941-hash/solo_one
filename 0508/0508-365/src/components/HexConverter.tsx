import { useState, useCallback, useEffect, useMemo } from 'react';
import { ArrowRightLeft, Binary, Hash, X, Info, Eye } from 'lucide-react';
import { CopyButton } from './CopyButton';
import { Base64Service } from '@/services/Base64Service';
import { cn } from '@/lib/utils';

type Mode = 'toHex' | 'fromHex';
type HexFormat = 'spaced' | 'compact' | '0x' | 'c-array';

export const HexConverter = () => {
  const [mode, setMode] = useState<Mode>('toHex');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hexFormat, setHexFormat] = useState<HexFormat>('spaced');
  const [showAscii, setShowAscii] = useState(true);

  const handleBase64ToHex = useCallback(() => {
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
      const result = Base64Service.toHex(input);
      setOutput(result);
      setError(null);
    } catch (err) {
      setError('转换失败：' + (err as Error).message);
      setOutput('');
    }
  }, [input]);

  const handleHexToBase64 = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }
    try {
      if (!Base64Service.isValidHex(input)) {
        setError('无效的Hex字符串');
        setOutput('');
        return;
      }
      const result = Base64Service.fromHex(input);
      setOutput(result);
      setError(null);
    } catch (err) {
      setError('转换失败：' + (err as Error).message);
      setOutput('');
    }
  }, [input]);

  useEffect(() => {
    if (mode === 'toHex') {
      handleBase64ToHex();
    } else {
      handleHexToBase64();
    }
  }, [input, mode, handleBase64ToHex, handleHexToBase64]);

  const toggleMode = () => {
    setMode(mode === 'toHex' ? 'fromHex' : 'toHex');
    setInput(output);
    setOutput(input);
    setError(null);
  };

  const clearInput = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  const byteCount = useMemo(() => {
    if (!output) return 0;
    if (mode === 'toHex') {
      return output.replace(/\s+/g, '').length / 2;
    } else {
      const cleanBase64 = output.trim().replace(/\s/g, '').replace(/=+$/, '');
      return Math.floor((cleanBase64.length * 6) / 8);
    }
  }, [output, mode]);

  const asciiPreview = useMemo(() => {
    if (!output || mode !== 'toHex') return '';
    const hexStr = output.replace(/\s+/g, '');
    let ascii = '';
    for (let i = 0; i < hexStr.length; i += 2) {
      const code = parseInt(hexStr.substr(i, 2), 16);
      if (code >= 32 && code <= 126) {
        ascii += String.fromCharCode(code);
      } else if (code === 10) {
        ascii += '↵';
      } else if (code === 13) {
        ascii += '␍';
      } else if (code === 9) {
        ascii += '␉';
      } else if (code === 0) {
        ascii += '␀';
      } else {
        ascii += '·';
      }
    }
    return ascii;
  }, [output, mode]);

  const formatHexDisplay = (hex: string): string => {
    const cleaned = hex.replace(/\s+/g, '');
    switch (hexFormat) {
      case 'compact':
        return cleaned.toUpperCase();
      case '0x':
        return '0x' + cleaned.toUpperCase();
      case 'c-array':
        const pairs: string[] = [];
        for (let i = 0; i < cleaned.length; i += 2) {
          pairs.push('0x' + cleaned.substr(i, 2).toUpperCase());
        }
        return '{ ' + pairs.join(', ') + ' }';
      default:
        return Base64Service.formatHex(hex);
    }
  };

  const getCopyText = (): string => {
    if (mode === 'toHex') {
      return formatHexDisplay(output);
    }
    return output;
  };

  const placeholder = mode === 'toHex'
    ? '输入Base64字符串，自动转换为十六进制...'
    : '输入十六进制字符串，例如：48 65 6C 6C 6F 或 0x48656C6C6F...';

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg shadow-orange-500/25">
              {mode === 'toHex' ? <Hash className="w-5 h-5 text-white" /> : <Binary className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {mode === 'toHex' ? 'Base64 → Hex' : 'Hex → Base64'}
              </h2>
              <p className="text-slate-400 text-sm">二进制数据十六进制互转</p>
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
              {mode === 'toHex' ? 'Base64 字符串' : 'Hex 字符串'}
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
              'w-full h-32 px-4 py-3 rounded-xl bg-slate-900/50 border transition-all duration-200',
              'text-white placeholder-slate-500 font-mono text-sm',
              'focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50',
              'resize-none',
              error ? 'border-red-500/50' : 'border-slate-600/50'
            )}
          />
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-300">
                {mode === 'toHex' ? 'Hex 结果' : 'Base64 结果'}
              </label>
              {output && (
                <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">
                  {byteCount} 字节
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {mode === 'toHex' && output && (
                <select
                  value={hexFormat}
                  onChange={(e) => setHexFormat(e.target.value as HexFormat)}
                  className="text-xs bg-slate-700/50 text-slate-300 rounded-lg px-2 py-1.5 border border-slate-600/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                >
                  <option value="spaced">空格分隔</option>
                  <option value="compact">连续无空格</option>
                  <option value="0x">0x前缀</option>
                  <option value="c-array">C数组格式</option>
                </select>
              )}
              <CopyButton text={getCopyText()} />
            </div>
          </div>
          <textarea
            value={mode === 'toHex' ? formatHexDisplay(output) : output}
            readOnly
            placeholder={mode === 'toHex' ? '十六进制结果将显示在这里...' : 'Base64结果将显示在这里...'}
            className={cn(
              'w-full h-32 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-600/50 font-mono text-sm resize-none focus:outline-none',
              mode === 'toHex' ? 'text-orange-400' : 'text-slate-300',
              'placeholder-slate-500'
            )}
          />
        </div>

        {mode === 'toHex' && output && showAscii && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-400" />
                <label className="text-sm font-medium text-slate-300">ASCII 预览</label>
              </div>
              <button
                onClick={() => setShowAscii(!showAscii)}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showAscii ? '隐藏' : '显示'}
              </button>
            </div>
            <div className="px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-600/50 font-mono text-sm text-emerald-400 break-all">
              {asciiPreview || '-'}
            </div>
          </div>
        )}

        <div className="text-xs text-slate-500 space-y-1">
          <p>• Hex格式：每2个字符表示一个字节（00-FF）</p>
          <p>• 示例："Hello" → Base64: "SGVsbG8=" → Hex: "48 65 6C 6C 6F"</p>
        </div>
      </div>
    </div>
  );
};
