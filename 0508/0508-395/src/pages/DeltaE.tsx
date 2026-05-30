import { useState, useEffect } from 'react';
import { Scale } from 'lucide-react';
import { colorApi } from '../utils/api';
import { colorAlgorithms } from '@shared/color-algorithms';
import ColorSwatch from '../components/ColorSwatch';
import type { RGB, DeltaEResult, PantoneColor } from '@shared/types';

export default function DeltaE() {
  const [presetColors, setPresetColors] = useState<PantoneColor[]>([]);
  const [rgb1, setRgb1] = useState<RGB>({ r: 230, g: 25, b: 45 });
  const [rgb2, setRgb2] = useState<RGB>({ r: 255, g: 0, b: 0 });
  const [result, setResult] = useState<DeltaEResult | null>(null);
  const [color1Mode, setColor1Mode] = useState<'rgb' | 'pantone'>('rgb');
  const [color2Mode, setColor2Mode] = useState<'rgb' | 'pantone'>('rgb');
  const [pantone1, setPantone1] = useState('PANTONE 185 C');
  const [pantone2, setPantone2] = useState('PANTONE 186 C');

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const res = await colorApi.getPresets();
        setPresetColors(res.colors);
      } catch (err) {
        console.error('Failed to load presets:', err);
      }
    };
    loadPresets();
  }, []);

  useEffect(() => {
    const calculate = async () => {
      try {
        let actualRgb1 = rgb1;
        let actualRgb2 = rgb2;

        if (color1Mode === 'pantone') {
          const conv = await colorApi.convertPantone(pantone1);
          actualRgb1 = conv.rgb;
        }
        if (color2Mode === 'pantone') {
          const conv = await colorApi.convertPantone(pantone2);
          actualRgb2 = conv.rgb;
        }

        const res = await colorApi.calculateDeltaE(actualRgb1, actualRgb2, true);
        setResult(res);
      } catch (err) {
        console.error('Delta E calculation failed:', err);
      }
    };

    calculate();
  }, [rgb1, rgb2, color1Mode, color2Mode, pantone1, pantone2]);

  const handleRgbChange = (colorNum: 1 | 2, channel: 'r' | 'g' | 'b', value: string) => {
    const num = Math.max(0, Math.min(255, parseInt(value) || 0));
    if (colorNum === 1) {
      setRgb1({ ...rgb1, [channel]: num });
    } else {
      setRgb2({ ...rgb2, [channel]: num });
    }
  };

  const getDeltaEColor = (deltaE: number) => {
    if (deltaE <= 1) return 'text-green-600';
    if (deltaE <= 2) return 'text-lime-600';
    if (deltaE <= 5) return 'text-yellow-600';
    if (deltaE <= 10) return 'text-orange-600';
    return 'text-red-600';
  };

  const getDeltaEBarWidth = (deltaE: number) => {
    return Math.min((deltaE / 20) * 100, 100);
  };

  const getDeltaEBarColor = (deltaE: number) => {
    if (deltaE <= 1) return 'bg-green-500';
    if (deltaE <= 2) return 'bg-lime-500';
    if (deltaE <= 5) return 'bg-yellow-500';
    if (deltaE <= 10) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const hex1 = colorAlgorithms.rgbToHex(rgb1);
  const hex2 = colorAlgorithms.rgbToHex(rgb2);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">色差计算器</h1>
        </div>
        <p className="text-slate-600 max-w-2xl mx-auto">
          使用 CIE ΔE 2000 标准计算两个颜色之间的差异，
          ΔE 值越小表示颜色越接近
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">颜色 1</h3>
            <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setColor1Mode('rgb')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  color1Mode === 'rgb' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                RGB
              </button>
              <button
                onClick={() => setColor1Mode('pantone')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  color1Mode === 'pantone' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                Pantone
              </button>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <ColorSwatch hex={hex1} size="lg" rgb={rgb1} />
            
            <div className="flex-1 space-y-3">
              {color1Mode === 'rgb' ? (
                (['r', 'g', 'b'] as const).map((channel) => (
                  <div key={channel} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <label className="text-slate-600 uppercase font-medium">{channel}</label>
                      <span className="text-slate-800 font-mono">{rgb1[channel]}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={rgb1[channel]}
                      onChange={(e) => handleRgbChange(1, channel, e.target.value)}
                      className={`w-full accent-${channel === 'r' ? 'red' : channel === 'g' ? 'green' : 'blue'}-500`}
                    />
                  </div>
                ))
              ) : (
                <select
                  value={pantone1}
                  onChange={(e) => setPantone1(e.target.value)}
                  className="input-field"
                >
                  {presetColors.map((c) => (
                    <option key={c.id} value={c.pantoneCode}>
                      {c.pantoneCode} - {c.nameZh}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">颜色 2</h3>
            <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setColor2Mode('rgb')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  color2Mode === 'rgb' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                RGB
              </button>
              <button
                onClick={() => setColor2Mode('pantone')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  color2Mode === 'pantone' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                Pantone
              </button>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <ColorSwatch hex={hex2} size="lg" rgb={rgb2} />
            
            <div className="flex-1 space-y-3">
              {color2Mode === 'rgb' ? (
                (['r', 'g', 'b'] as const).map((channel) => (
                  <div key={channel} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <label className="text-slate-600 uppercase font-medium">{channel}</label>
                      <span className="text-slate-800 font-mono">{rgb2[channel]}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={rgb2[channel]}
                      onChange={(e) => handleRgbChange(2, channel, e.target.value)}
                      className={`w-full accent-${channel === 'r' ? 'red' : channel === 'g' ? 'green' : 'blue'}-500`}
                    />
                  </div>
                ))
              ) : (
                <select
                  value={pantone2}
                  onChange={(e) => setPantone2(e.target.value)}
                  className="input-field"
                >
                  {presetColors.map((c) => (
                    <option key={c.id} value={c.pantoneCode}>
                      {c.pantoneCode} - {c.nameZh}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="mt-8 glass-card rounded-2xl p-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="text-center mb-8">
            <p className="text-slate-600 mb-2 font-medium">CIE ΔE 2000 色差</p>
            <p className={`text-7xl font-bold ${getDeltaEColor(result.deltaE2000)}`}>
              {result.deltaE2000.toFixed(2)}
            </p>
            <p className="text-xl font-semibold text-slate-800 mt-2">{result.difference}</p>
          </div>

          <div className="mb-8">
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${getDeltaEBarColor(result.deltaE2000)} transition-all duration-500 rounded-full`}
                style={{ width: `${getDeltaEBarWidth(result.deltaE2000)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>0 完全一致</span>
              <span>2 几乎无差</span>
              <span>5 中等差异</span>
              <span>10 明显差异</span>
              <span>20+ 很大差异</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <ColorSwatch hex={hex1} size="md" className="mx-auto" />
              <p className="mt-2 text-sm font-medium text-slate-700">颜色 1</p>
              <p className="font-mono text-xs text-slate-500">
                Lab: {result.lab1.L.toFixed(1)}, {result.lab1.a.toFixed(1)}, {result.lab1.b.toFixed(1)}
              </p>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                <span className="text-3xl text-slate-400">≈</span>
              </div>
            </div>
            <div className="text-center">
              <ColorSwatch hex={hex2} size="md" className="mx-auto" />
              <p className="mt-2 text-sm font-medium text-slate-700">颜色 2</p>
              <p className="font-mono text-xs text-slate-500">
                Lab: {result.lab2.L.toFixed(1)}, {result.lab2.a.toFixed(1)}, {result.lab2.b.toFixed(1)}
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-2xl border border-indigo-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">ΔE 2000 参考标准</h4>
            <ul className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <li className="bg-white rounded-xl p-3 text-center shadow-sm"><span className="text-green-600 font-bold text-lg block">0-1</span> <span className="text-slate-600">几乎无差异</span></li>
              <li className="bg-white rounded-xl p-3 text-center shadow-sm"><span className="text-lime-600 font-bold text-lg block">1-2</span> <span className="text-slate-600">极小差异</span></li>
              <li className="bg-white rounded-xl p-3 text-center shadow-sm"><span className="text-yellow-600 font-bold text-lg block">2-5</span> <span className="text-slate-600">中等差异</span></li>
              <li className="bg-white rounded-xl p-3 text-center shadow-sm"><span className="text-orange-600 font-bold text-lg block">5-10</span> <span className="text-slate-600">明显差异</span></li>
              <li className="bg-white rounded-xl p-3 text-center shadow-sm"><span className="text-red-600 font-bold text-lg block">10+</span> <span className="text-slate-600">很大差异</span></li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
