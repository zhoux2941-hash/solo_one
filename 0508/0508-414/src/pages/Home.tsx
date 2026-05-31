import React, { useState, useCallback, useRef } from 'react';
import { Lock, Unlock, Eye, EyeOff, Loader2 } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import CapacityDisplay from '../components/CapacityDisplay';
import ResultDisplay from '../components/ResultDisplay';
import {
  calculateCapacity,
  encodeMessage,
  decodeMessage,
  CapacityInfo,
} from '../utils/steganography';

export default function Home() {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [message, setMessage] = useState('');
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [capacity, setCapacity] = useState<CapacityInfo>({ maxChars: 0, totalBits: 0, usedBits: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultType, setResultType] = useState<'encode' | 'decode' | null>(null);
  const [encodedImageUrl, setEncodedImageUrl] = useState<string | null>(null);
  const [decodedMessage, setDecodedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageLoaded = useCallback((data: ImageData, width: number, height: number) => {
    setImageData(data);
    setImageDimensions({ width, height });
    if (width > 0 && height > 0) {
      setCapacity(calculateCapacity(data));
    } else {
      setCapacity({ maxChars: 0, totalBits: 0, usedBits: 0 });
    }
    setResultType(null);
    setEncodedImageUrl(null);
    setDecodedMessage(null);
    setError(null);
  }, []);

  const handleEncode = useCallback(async () => {
    if (!imageData) {
      setError('请先上传图片');
      return;
    }
    if (!message.trim()) {
      setError('请输入要隐藏的消息');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResultType(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const encodedData = encodeMessage(imageData, message, key || undefined);
      
      if (resultCanvasRef.current) {
        const canvas = resultCanvasRef.current;
        canvas.width = imageDimensions.width;
        canvas.height = imageDimensions.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.putImageData(encodedData, 0, 0);
          const url = canvas.toDataURL('image/png');
          setEncodedImageUrl(url);
          setResultType('encode');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '编码失败');
    } finally {
      setIsProcessing(false);
    }
  }, [imageData, message, key, imageDimensions]);

  const handleDecode = useCallback(async () => {
    if (!imageData) {
      setError('请先上传图片');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResultType(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const decoded = decodeMessage(imageData, key || undefined);
      setDecodedMessage(decoded);
      setResultType('decode');
    } catch (err) {
      setError(err instanceof Error ? err.message : '解码失败');
    } finally {
      setIsProcessing(false);
    }
  }, [imageData, key]);

  const handleDownload = useCallback(() => {
    if (encodedImageUrl) {
      const link = document.createElement('a');
      link.download = 'steganography-image.png';
      link.href = encodedImageUrl;
      link.click();
    }
  }, [encodedImageUrl]);

  return (
    <div className="min-h-screen py-8 px-4">
      <canvas ref={resultCanvasRef} className="hidden" />
      
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3 text-gradient">
            LSB 图像隐写术
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            使用最低有效位算法，在图片中隐藏秘密消息。支持 XOR 加密，保护您的隐私信息。
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6 card-hover">
              <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-400"></span>
                上传图片
              </h2>
              <ImageUploader onImageLoaded={handleImageLoaded} />
              
              {imageDimensions.width > 0 && (
                <div className="mt-4 flex gap-4 text-sm text-slate-400">
                  <span>尺寸: {imageDimensions.width} × {imageDimensions.height}</span>
                  <span>像素: {(imageDimensions.width * imageDimensions.height).toLocaleString()}</span>
                </div>
              )}
            </div>

            {capacity.maxChars > 0 && (
              <CapacityDisplay capacity={capacity} usedChars={message.length} />
            )}
          </div>

          <div className="space-y-6">
            <div className="glass rounded-2xl p-6 card-hover">
              <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-400"></span>
                秘密消息
              </h2>
              
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="输入要隐藏的秘密消息..."
                className="w-full h-32 bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent-500/50 focus:ring-2 focus:ring-accent-500/20 resize-none transition-all duration-200 font-mono text-sm"
              />

              <div className="mt-4">
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  加密密钥 <span className="text-slate-500">(可选)</span>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="输入加密密钥..."
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 pr-12 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent-500/50 focus:ring-2 focus:ring-accent-500/20 transition-all duration-200 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  使用 XOR 算法对消息进行加密，解码时需要相同密钥
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleEncode}
                disabled={isProcessing || !imageData}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-accent-600 hover:bg-accent-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 btn-glow"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
                编码
              </button>
              <button
                onClick={handleDecode}
                disabled={isProcessing || !imageData}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 btn-glow"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Unlock className="w-5 h-5" />
                )}
                解码
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <ResultDisplay
              type={resultType}
              encodedImageUrl={encodedImageUrl || undefined}
              decodedMessage={decodedMessage || undefined}
              onDownload={handleDownload}
            />
          </div>
        </div>

        <div className="mt-16 glass rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-100 mb-6">使用说明</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-accent-500/10 flex items-center justify-center text-accent-400 font-bold">1</div>
              <h3 className="font-medium text-slate-200">上传图片</h3>
              <p className="text-sm text-slate-400">选择 PNG 或 BMP 格式的无压缩图片作为载体</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-accent-500/10 flex items-center justify-center text-accent-400 font-bold">2</div>
              <h3 className="font-medium text-slate-200">输入消息</h3>
              <p className="text-sm text-slate-400">填写要隐藏的秘密消息，可设置加密密钥</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-accent-500/10 flex items-center justify-center text-accent-400 font-bold">3</div>
              <h3 className="font-medium text-slate-200">编码/解码</h3>
              <p className="text-sm text-slate-400">点击编码生成隐写图，或解码提取隐藏消息</p>
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-slate-500 text-sm">
          <p>LSB 图像隐写术工具 · 最低有效位算法</p>
        </footer>
      </div>
    </div>
  );
}
