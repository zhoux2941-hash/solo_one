import { useState, useRef, useEffect, useCallback } from 'react';
import { Pipette, Trash2, Download } from 'lucide-react';
import { colorAlgorithms } from '@shared/color-algorithms';
import { colorApi } from '../utils/api';
import ColorSwatch from '../components/ColorSwatch';
import type { RGB, PantoneColor } from '@shared/types';

interface PickedColor {
  id: string;
  rgb: RGB;
  hex: string;
  x: number;
  y: number;
  timestamp: number;
  pantoneMatch?: PantoneColor;
}

export default function ColorPickerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pickedColors, setPickedColors] = useState<PickedColor[]>([]);
  const [currentColor, setCurrentColor] = useState<RGB | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [searchingPantone, setSearchingPantone] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    const colors = [
      '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', 
      '#0000FF', '#4B0082', '#9400D3', '#FF00FF',
      '#FFFFFF', '#000000', '#808080', '#C0C0C0'
    ];
    
    colors.forEach((color, i) => {
      gradient.addColorStop(i / (colors.length - 1), color);
    });
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = 20 + Math.random() * 60;
      const hue = Math.random() * 360;
      
      const radialGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      radialGradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.8)`);
      radialGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = radialGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#333';
    ctx.fillRect(50, 50, 150, 100);
    ctx.fillStyle = '#E6192D';
    ctx.fillRect(250, 80, 120, 80);
    ctx.fillStyle = '#003399';
    ctx.fillRect(450, 50, 100, 120);
    ctx.fillStyle = '#FFCD00';
    ctx.fillRect(100, 250, 180, 90);
    ctx.fillStyle = '#00843D';
    ctx.fillRect(350, 280, 140, 100);

    setImageLoaded(true);
  }, []);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));
    
    setCursorPos({ x, y });

    if (isPicking) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const pixel = ctx.getImageData(x, y, 1, 1).data;
      setCurrentColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
    }
  }, [isPicking, imageLoaded]);

  const handleCanvasClick = useCallback(async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPicking || !currentColor) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));

    const hex = colorAlgorithms.rgbToHex(currentColor);
    
    const newColor: PickedColor = {
      id: `${Date.now()}-${Math.random()}`,
      rgb: { ...currentColor },
      hex,
      x,
      y,
      timestamp: Date.now()
    };

    setSearchingPantone(true);
    try {
      const match = await colorApi.matchPantone(currentColor, 1);
      if (match.matches.length > 0) {
        newColor.pantoneMatch = match.matches[0];
      }
    } catch (err) {
      console.error('Failed to match Pantone:', err);
    } finally {
      setSearchingPantone(false);
    }

    setPickedColors(prev => [newColor, ...prev].slice(0, 20));
    setIsPicking(false);
    setCurrentColor(null);
  }, [isPicking, currentColor]);

  const removeColor = (id: string) => {
    setPickedColors(prev => prev.filter(c => c.id !== id));
  };

  const clearAll = () => {
    setPickedColors([]);
  };

  const exportColors = () => {
    const data = pickedColors.map(c => ({
      hex: c.hex,
      rgb: c.rgb,
      pantone: c.pantoneMatch?.pantoneCode || '',
      pantoneName: c.pantoneMatch?.nameZh || ''
    }));
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `picked-colors-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentHex = currentColor ? colorAlgorithms.rgbToHex(currentColor) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
            <Pipette className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">屏幕取色器</h1>
        </div>
        <p className="text-slate-600 max-w-2xl mx-auto">
          点击"开始取色"按钮后，在画布上点击任意位置拾取颜色。
          这是浏览器环境下的取色模拟，实际应用中需要浏览器扩展支持系统级取色。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsPicking(!isPicking)}
                className={`
                  flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all
                  ${isPicking
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-400 hover:to-emerald-400 shadow-lg shadow-green-500/30'
                  }
                `}
              >
                <Pipette className="w-5 h-5" />
                <span>{isPicking ? '取消取色' : '开始取色'}</span>
              </button>

              {pickedColors.length > 0 && (
                <>
                  <button
                    onClick={exportColors}
                    className="flex items-center space-x-2 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>导出</span>
                  </button>
                  <button
                    onClick={clearAll}
                    className="flex items-center space-x-2 px-4 py-3 bg-white border border-slate-200 hover:bg-red-50 text-slate-600 hover:text-red-500 rounded-xl transition-colors shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>清空</span>
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-600">缩放</span>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="w-24 accent-green-500"
              />
              <span className="text-sm text-slate-600 w-10 font-mono">{zoomLevel.toFixed(1)}x</span>
            </div>
          </div>

          <div className="relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
            <div
              className={`relative overflow-auto ${isPicking ? 'cursor-crosshair' : 'cursor-default'}`}
              style={{ maxHeight: '500px' }}
            >
              <canvas
                ref={canvasRef}
                width={800}
                height={450}
                className="block transition-transform origin-top-left"
                style={{ transform: `scale(${zoomLevel})` }}
                onMouseMove={handleCanvasMouseMove}
                onClick={handleCanvasClick}
              />
            </div>

            {isPicking && currentHex && (
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-4 border border-slate-200 flex items-center space-x-3 shadow-xl">
                <div
                  className="w-12 h-12 rounded-lg shadow-lg border-2 border-white"
                  style={{ backgroundColor: currentHex }}
                />
                <div>
                  <p className="font-mono text-slate-800 font-semibold">{currentHex}</p>
                  <p className="text-xs text-slate-500">
                    {currentColor?.r}, {currentColor?.g}, {currentColor?.b}
                  </p>
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md rounded-lg px-3 py-2 text-xs text-slate-600 font-mono shadow-sm">
              X: {cursorPos.x}, Y: {cursorPos.y}
            </div>

            {searchingPantone && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">正在匹配 Pantone 色号...</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-600 text-xl">!</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">关于浏览器取色限制</p>
                <p className="text-sm text-amber-700 mt-1">
                  由于浏览器安全限制，Web 应用无法直接读取系统屏幕像素。
                  实际使用中需要配合浏览器扩展（如 Eye Dropper、ColorZilla）
                  或使用原生应用来实现系统级屏幕取色。当前演示使用模拟画布。
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-slate-800 mb-4">
              取色历史 <span className="text-slate-500 font-normal">({pickedColors.length}/20)</span>
            </h3>
            
            {pickedColors.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
                  <Pipette className="w-10 h-10 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">暂无取色记录</p>
                <p className="text-xs text-slate-400 mt-1">点击"开始取色"后在画布上点击</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {pickedColors.map((color, index) => (
                  <div
                    key={color.id}
                    className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl group hover:bg-slate-100 transition-colors border border-slate-100"
                  >
                    <ColorSwatch hex={color.hex} size="md" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm text-indigo-600 font-semibold">{color.hex}</p>
                      <p className="text-xs text-slate-500">
                        RGB({color.rgb.r}, {color.rgb.g}, {color.rgb.b})
                      </p>
                      {color.pantoneMatch && (
                        <p className="text-xs text-slate-600 mt-1 truncate font-medium">
                          {color.pantoneMatch.pantoneCode}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => removeColor(color.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
