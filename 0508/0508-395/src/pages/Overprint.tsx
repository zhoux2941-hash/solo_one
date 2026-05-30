import { useState, useEffect, useRef, useMemo } from 'react';
import { Layers, ArrowRightLeft } from 'lucide-react';
import { colorApi } from '../utils/api';
import { colorAlgorithms } from '@shared/color-algorithms';
import ColorSwatch from '../components/ColorSwatch';
import type { PantoneColor, OverprintResult, RGB } from '@shared/types';

type PaperColor = 'bright-white' | 'cream' | 'kraft';

interface PaperColorOption {
  key: PaperColor;
  name: string;
  value: string;
  label: string;
}

const paperColors: PaperColorOption[] = [
  { key: 'bright-white', name: '亮白', value: '#FFFFFF', label: '亮白纸' },
  { key: 'cream', name: '米黄', value: '#F5F5DC', label: '米黄纸' },
  { key: 'kraft', name: '牛皮纸', value: '#D2B48C', label: '牛皮纸' },
];

export default function Overprint() {
  const [presetColors, setPresetColors] = useState<PantoneColor[]>([]);
  const [color1, setColor1] = useState<string>('PANTONE 185 C');
  const [color2, setColor2] = useState<string>('PANTONE 293 C');
  const [opacity1, setOpacity1] = useState<number>(100);
  const [opacity2, setOpacity2] = useState<number>(100);
  const [paperColor, setPaperColor] = useState<PaperColor>('bright-white');
  const [result, setResult] = useState<OverprintResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const res = await colorApi.getPresets();
        setPresetColors(res.colors);
        if (res.colors.length >= 2) {
          setColor1(res.colors[0].pantoneCode);
          setColor2(res.colors[1].pantoneCode);
        }
      } catch (err) {
        console.error('Failed to load presets:', err);
      }
    };
    loadPresets();
  }, []);

  useEffect(() => {
    const calculate = async () => {
      if (!color1 || !color2) return;
      
      setIsLoading(true);
      try {
        const res = await colorApi.calculateOverprint(color1, color2, opacity1, opacity2);
        setResult(res);
      } catch (err) {
        console.error('Overprint calculation failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    calculate();
  }, [color1, color2, opacity1, opacity2]);

  const currentPaperColorValue = useMemo(() => {
    return paperColors.find(p => p.key === paperColor)?.value || '#FFFFFF';
  }, [paperColor]);

  const mixWithPaperColor = (colorHex: string, opacity: number): string => {
    const colorRgb = colorAlgorithms.hexToRgb(colorHex);
    const paperRgb = colorAlgorithms.hexToRgb(currentPaperColorValue);
    const alpha = opacity / 100;

    const mixedRgb: RGB = {
      r: Math.round(colorRgb.r * alpha + paperRgb.r * (1 - alpha)),
      g: Math.round(colorRgb.g * alpha + paperRgb.g * (1 - alpha)),
      b: Math.round(colorRgb.b * alpha + paperRgb.b * (1 - alpha)),
    };

    return colorAlgorithms.rgbToHex(mixedRgb);
  };

  useEffect(() => {
    if (!result || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.fillStyle = currentPaperColorValue;
    ctx.fillRect(0, 0, width, height);

    if (paperColor === 'kraft') {
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2;
        ctx.fillStyle = `rgba(139, 90, 43, ${Math.random() * 0.15})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (paperColor === 'cream') {
      for (let i = 0; i < 3000; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1.5;
        ctx.fillStyle = `rgba(200, 180, 140, ${Math.random() * 0.1})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const c1 = `rgba(${result.color1.rgb.r}, ${result.color1.rgb.g}, ${result.color1.rgb.b}, ${opacity1 / 100})`;
    const c2 = `rgba(${result.color2.rgb.r}, ${result.color2.rgb.g}, ${result.color2.rgb.b}, ${opacity2 / 100})`;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;
    const offset = radius * 0.5;

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';

    ctx.beginPath();
    ctx.arc(centerX - offset, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = c1;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX + offset, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = c2;
    ctx.fill();

    ctx.restore();

    const textColor = paperColor === 'kraft' ? '#2D1810' : '#1e293b';
    ctx.font = 'bold 14px Inter, system-ui, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.fillText(result.color1.pantoneCode.split(' ')[1], centerX - offset, centerY + radius + 25);
    ctx.fillText(result.color2.pantoneCode.split(' ')[1], centerX + offset, centerY + radius + 25);
    ctx.fillText('叠印效果', centerX, centerY - radius - 15);

  }, [result, opacity1, opacity2, paperColor, currentPaperColorValue]);

  const swapColors = () => {
    setColor1(color2);
    setColor2(color1);
  };

  const getMixedHexWithPaper = () => {
    if (!result) return '#FFFFFF';
    return mixWithPaperColor(result.mixedHex, (opacity1 + opacity2) / 2);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-pink-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">专色叠印模拟器</h1>
        </div>
        <p className="text-slate-600 max-w-2xl mx-auto">
          模拟两个专色叠印后的混合效果，调节透明度和纸张底色观察不同叠印比例的视觉效果
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">专色 1</h3>
              <button
                onClick={swapColors}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>
            <select
              value={color1}
              onChange={(e) => setColor1(e.target.value)}
              className="input-field"
            >
              {presetColors.map((c) => (
                <option key={c.id} value={c.pantoneCode}>
                  {c.pantoneCode} - {c.nameZh}
                </option>
              ))}
            </select>
            <div className="mt-4 space-y-2">
              <label className="text-sm text-slate-600">透明度: {opacity1}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={opacity1}
                onChange={(e) => setOpacity1(Number(e.target.value))}
                className="w-full accent-orange-500"
              />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <h3 className="font-semibold text-slate-800 mb-4">专色 2</h3>
            <select
              value={color2}
              onChange={(e) => setColor2(e.target.value)}
              className="input-field"
            >
              {presetColors.map((c) => (
                <option key={c.id} value={c.pantoneCode}>
                  {c.pantoneCode} - {c.nameZh}
                </option>
              ))}
            </select>
            <div className="mt-4 space-y-2">
              <label className="text-sm text-slate-600">透明度: {opacity2}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={opacity2}
                onChange={(e) => setOpacity2(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="font-semibold text-slate-800 mb-4">纸张底色</h3>
            <div className="grid grid-cols-3 gap-3">
              {paperColors.map((paper) => (
                <button
                  key={paper.key}
                  onClick={() => setPaperColor(paper.key)}
                  className={`
                    relative flex flex-col items-center space-y-2 p-3 rounded-xl border-2 transition-all
                    ${paperColor === paper.key
                      ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/30'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
                  `}
                >
                  <div
                    className="w-10 h-10 rounded-lg shadow-inner border border-slate-200"
                    style={{ backgroundColor: paper.value }}
                  />
                  <span className="text-xs font-medium text-slate-700">{paper.name}</span>
                  {paperColor === paper.key && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center space-x-8 animate-slide-up" style={{ animationDelay: '0.25s' }}>
            {result && (
              <>
                <div className="text-center">
                  <ColorSwatch hex={mixWithPaperColor(result.color1.hex, opacity1)} size="lg" pantone={result.color1} />
                  <p className="text-xs text-slate-500 mt-2">考虑纸张底色</p>
                </div>
                <div className="text-center">
                  <ColorSwatch hex={mixWithPaperColor(result.color2.hex, opacity2)} size="lg" pantone={result.color2} />
                  <p className="text-xs text-slate-500 mt-2">考虑纸张底色</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">叠印效果预览</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-500">纸张:</span>
                <div
                  className="w-6 h-6 rounded border border-slate-300"
                  style={{ backgroundColor: currentPaperColorValue }}
                />
              </div>
            </div>
            <div 
              className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner"
              style={{ aspectRatio: '16/9' }}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full"
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-slate-600">计算中...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {result && (
            <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.35s' }}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                  <ColorSwatch hex={result.mixedHex} size="lg" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">理论混合色 (白底)</h3>
                    <p className="text-sm text-slate-600">
                      {result.color1.pantoneCode.split(' ')[1]} + {result.color2.pantoneCode.split(' ')[1]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <ColorSwatch hex={getMixedHexWithPaper()} size="lg" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">实际叠印色 ({paperColors.find(p => p.key === paperColor)?.name}纸)</h3>
                    <p className="text-sm text-slate-600">考虑纸张底色影响</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-4 border border-indigo-100">
                  <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">HEX</p>
                  <p className="font-mono text-slate-800 text-lg mt-1">{getMixedHexWithPaper()}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
                  <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide">RGB</p>
                  <p className="font-mono text-slate-800 text-lg mt-1">
                    {result.mixedRGB.r}, {result.mixedRGB.g}, {result.mixedRGB.b}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-lime-50 rounded-xl p-4 border border-yellow-100">
                  <p className="text-xs text-yellow-700 font-semibold uppercase tracking-wide">CMYK</p>
                  <p className="font-mono text-slate-800 text-lg mt-1">
                    {result.mixedCMYK.c.toFixed(0)}, {result.mixedCMYK.m.toFixed(0)}, {result.mixedCMYK.y.toFixed(0)}, {result.mixedCMYK.k.toFixed(0)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                  <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Lab</p>
                  <p className="font-mono text-slate-800 text-lg mt-1">
                    {result.mixedLab.L.toFixed(1)}, {result.mixedLab.a.toFixed(1)}, {result.mixedLab.b.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
