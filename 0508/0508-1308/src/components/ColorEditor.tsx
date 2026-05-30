import { useStore } from '../store/useStore';
import { RotateCcw, Palette } from 'lucide-react';

const colorConfig = [
  { key: 'main' as const, name: '主色', description: '脸谱的基础色调' },
  { key: 'secondary' as const, name: '辅色', description: '图案和装饰的颜色' },
  { key: 'outline' as const, name: '轮廓色', description: '线条和边框颜色' },
  { key: 'accent1' as const, name: '点缀色 1', description: '重点装饰颜色' },
  { key: 'accent2' as const, name: '点缀色 2', description: '次要装饰颜色' },
] as const;

const ColorEditor = () => {
  const { customColors, setCustomColor, resetCustomColors, facePattern } = useStore();

  if (!facePattern) {
    return (
      <div className="p-8 text-center text-ink-light bg-paper rounded-xl border-2 border-dashed border-gold/30">
        <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-lg">请先选择人物以编辑配色</p>
      </div>
    );
  }

  return (
    <div className="bg-paper rounded-xl p-6 border-2 border-gold/30">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display text-ink flex items-center gap-2">
          <Palette className="w-6 h-6 text-primary" />
          自定义配色
        </h2>
        <button
          onClick={resetCustomColors}
          className="flex items-center gap-2 px-4 py-2 text-sm text-ink-light hover:text-primary 
                     border border-gold/30 rounded-lg hover:border-gold hover:bg-gold/10
                     transition-all duration-200"
        >
          <RotateCcw className="w-4 h-4" />
          恢复默认
        </button>
      </div>

      <div className="space-y-4">
        {colorConfig.map((config, index) => (
          <div 
            key={config.key}
            className="flex items-center gap-4 p-4 bg-paper-light rounded-lg 
                       border border-gold/20 hover:border-gold/40 
                       transition-all duration-200 animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
          >
            <div className="relative">
              <input
                type="color"
                value={customColors[config.key]}
                onChange={(e) => setCustomColor(config.key, e.target.value)}
                className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gold/30 
                           hover:border-gold transition-all duration-200"
              />
              <div 
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-paper-light"
                style={{ backgroundColor: customColors[config.key] }}
              />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-display text-lg text-ink">{config.name}</span>
                <span className="text-xs font-mono text-ink-light bg-ink/5 px-2 py-0.5 rounded">
                  {customColors[config.key]}
                </span>
              </div>
              <p className="text-sm text-ink-light">{config.description}</p>
            </div>
            
            <div className="flex flex-col gap-1">
              <input
                type="range"
                min="0"
                max="360"
                value={0}
                onChange={(e) => {
                  const hue = parseInt(e.target.value);
                  const color = customColors[config.key];
                  const rgb = hexToRgb(color);
                  if (rgb) {
                    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
                    hsl.h = hue;
                    const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
                    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
                    setCustomColor(config.key, newHex);
                  }
                }}
                className="w-32 h-2 rounded-lg appearance-none cursor-pointer
                           bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gold/20">
        <p className="text-xs text-ink-light text-center">
          调整颜色后，左侧脸谱预览会实时更新效果
        </p>
      </div>
    </div>
  );
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export default ColorEditor;
