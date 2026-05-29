import { useState, useCallback, useEffect, useRef } from 'react';
import { Image, Download, X, AlertCircle } from 'lucide-react';
import { CopyButton } from './CopyButton';
import { Base64Service } from '@/services/Base64Service';
import { cn } from '@/lib/utils';

export const Base64ToImage = () => {
  const [input, setInput] = useState('');
  const [imageSrc, setImageSrc] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const normalizeBase64 = useCallback((str: string): string => {
    const cleanStr = str.trim();
    if (cleanStr.startsWith('data:image/')) {
      return cleanStr;
    }
    const cleaned = cleanStr.replace(/\s/g, '');
    if (/^[A-Za-z0-9+/=]+$/.test(cleaned)) {
      return `data:image/png;base64,${cleaned}`;
    }
    return cleanStr;
  }, []);

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setImageSrc('');
      setError(null);
      setIsValid(false);
      return;
    }

    try {
      const normalized = normalizeBase64(input);
      
      if (!Base64Service.isImageBase64(normalized)) {
        setError('无效的图片Base64字符串');
        setImageSrc('');
        setIsValid(false);
        return;
      }

      setImageSrc(normalized);
      setError(null);
      setIsValid(true);
    } catch (err) {
      setError('转换失败：请检查输入是否为有效的图片Base64');
      setImageSrc('');
      setIsValid(false);
    }
  }, [input, normalizeBase64]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleConvert();
    }, 300);
    return () => clearTimeout(timer);
  }, [input, handleConvert]);

  const handleDownload = () => {
    if (!imageSrc) return;
    
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearInput = () => {
    setInput('');
    setImageSrc('');
    setError(null);
    setIsValid(false);
  };

  const handleImageLoad = () => {
    setError(null);
    setIsValid(true);
  };

  const handleImageError = () => {
    setError('无法渲染图片，请检查Base64字符串是否正确');
    setIsValid(false);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/25">
            <Image className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Base64 → 图片</h2>
            <p className="text-slate-400 text-sm">粘贴Base64实时预览</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-300">Base64 字符串</label>
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
            placeholder="粘贴图片的Base64字符串，支持带或不带 data:image/ 前缀..."
            className={cn(
              'w-full h-32 px-4 py-3 rounded-xl bg-slate-900/50 border transition-all duration-200',
              'text-white placeholder-slate-500 font-mono text-xs',
              'focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50',
              'resize-none',
              error ? 'border-red-500/50' : 'border-slate-600/50'
            )}
          />
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-300">图片预览</label>
            {isValid && imageSrc && (
              <div className="flex items-center gap-2">
                <CopyButton text={imageSrc} className="py-1.5 px-3 text-xs" />
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  下载
                </button>
              </div>
            )}
          </div>
          
          <div className={cn(
            'min-h-[200px] rounded-xl border border-slate-600/50 bg-slate-900/50 overflow-hidden',
            'flex items-center justify-center'
          )}>
            {imageSrc && isValid ? (
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Base64预览"
                onLoad={handleImageLoad}
                onError={handleImageError}
                className="max-w-full max-h-[400px] object-contain"
              />
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-3">
                  <Image className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-slate-400">图片预览将显示在这里</p>
                <p className="text-slate-500 text-sm mt-1">支持 data:image/png;base64,... 或纯Base64</p>
              </div>
            )}
          </div>
        </div>

        {imageSrc && imageRef.current && (
          <div className="text-xs text-slate-500">
            图片尺寸：{imageRef.current.naturalWidth} × {imageRef.current.naturalHeight} 像素
          </div>
        )}
      </div>
    </div>
  );
};
