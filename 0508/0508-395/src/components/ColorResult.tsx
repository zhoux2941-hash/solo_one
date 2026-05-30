import { Loader2, AlertCircle, Plus, Check } from 'lucide-react';
import { useColorStore } from '../store/colorStore';
import { formatNumber } from '../utils/helpers';
import ColorSwatch from './ColorSwatch';
import type { ColorConversionResult } from '@shared/types';

interface ColorResultProps {
  result: ColorConversionResult | null;
  isLoading: boolean;
  error: string | null;
}

export default function ColorResult({ result, isLoading, error }: ColorResultProps) {
  const { toggleSelectedColor, selectedColors } = useColorStore();

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-slate-600 font-medium">正在转换...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-red-200 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-600 font-semibold text-lg">{error}</p>
          <p className="text-slate-500 text-sm">请检查输入值是否正确</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="glass-card rounded-2xl p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎨</span>
          </div>
          <p className="text-slate-600 font-medium text-lg">输入颜色值以查看转换结果</p>
          <p className="text-slate-400 text-sm mt-2">支持 RGB、CMYK、HEX、Pantone 多种格式</p>
        </div>
      </div>
    );
  }

  const { rgb, cmyk, lab, xyz, hsl, hex, pantoneMatch } = result;
  const isSelected = pantoneMatch && selectedColors.some(c => c.id === pantoneMatch.id);

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-800">转换结果</h2>
        {pantoneMatch && (
          <button
            onClick={() => toggleSelectedColor(pantoneMatch)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium
              transition-all duration-200
              ${isSelected
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
              }
            `}
          >
            {isSelected ? (
              <>
                <Check className="w-4 h-4" />
                <span>已添加</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>添加到报告</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col items-center space-y-4">
          <ColorSwatch
            hex={hex}
            size="xl"
            className="shadow-2xl"
          />
          
          {pantoneMatch && (
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-slate-500">最接近 Pantone 色号</p>
              <p className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{pantoneMatch.pantoneCode}</p>
              <p className="text-sm text-slate-600">{pantoneMatch.nameZh} · {pantoneMatch.name}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5 space-y-4 border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">颜色值</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium uppercase">HEX</p>
                <p className="font-mono text-lg text-indigo-600 font-bold">{hex}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium uppercase">RGB (0-255)</p>
                <p className="font-mono text-lg text-orange-600 font-bold">
                  {rgb.r}, {rgb.g}, {rgb.b}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium uppercase">CMYK (%)</p>
                <p className="font-mono text-lg text-yellow-700 font-bold">
                  {formatNumber(cmyk.c)}, {formatNumber(cmyk.m)}, {formatNumber(cmyk.y)}, {formatNumber(cmyk.k)}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium uppercase">HSL</p>
                <p className="font-mono text-lg text-pink-600 font-bold">
                  {hsl.h}°, {hsl.s}%, {hsl.l}%
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium uppercase">CIE Lab</p>
                <p className="font-mono text-lg text-green-600 font-bold">
                  {formatNumber(lab.L)}, {formatNumber(lab.a)}, {formatNumber(lab.b)}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium uppercase">CIE XYZ</p>
                <p className="font-mono text-lg text-purple-600 font-bold">
                  {formatNumber(xyz.X)}, {formatNumber(xyz.Y)}, {formatNumber(xyz.Z)}
                </p>
              </div>
            </div>
          </div>

          {pantoneMatch && (
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl p-5 border border-indigo-100">
              <h3 className="text-sm font-semibold text-indigo-700 mb-3">Pantone 配方</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase">CMYK 配方</p>
                  <p className="font-mono text-sm text-slate-800 font-semibold mt-1">
                    C:{formatNumber(pantoneMatch.cmyk.c)}% 
                    M:{formatNumber(pantoneMatch.cmyk.m)}% 
                    Y:{formatNumber(pantoneMatch.cmyk.y)}% 
                    K:{formatNumber(pantoneMatch.cmyk.k)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase">色系</p>
                  <p className="font-medium text-sm text-slate-800 mt-1">{pantoneMatch.category}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {pantoneMatch && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">相似 Pantone 色号</h3>
          <div className="flex space-x-4 overflow-x-auto pb-2">
            <div 
              className="flex flex-col items-center space-y-2 p-3 bg-white rounded-xl min-w-[100px] border-2 border-indigo-500 shadow-lg"
            >
              <ColorSwatch hex={pantoneMatch.hex} size="md" />
              <p className="text-xs font-bold text-indigo-600">{pantoneMatch.pantoneCode.split(' ')[1]}</p>
            </div>
            {[...Array(5)].map((_, i) => {
              const hueShift = (i + 1) * 15;
              const tempHsl = { h: (hsl.h + hueShift) % 360, s: hsl.s, l: hsl.l };
              const tempRgb = {
                r: Math.round(Math.sin(tempHsl.h) * 127 + 128),
                g: Math.round(Math.sin(tempHsl.h + 2) * 127 + 128),
                b: Math.round(Math.sin(tempHsl.h + 4) * 127 + 128)
              };
              const tempHex = '#' + ((1 << 24) + (tempRgb.r << 16) + (tempRgb.g << 8) + tempRgb.b).toString(16).slice(1).toUpperCase();
              
              return (
                <div 
                  key={i}
                  className="flex flex-col items-center space-y-2 p-3 bg-white rounded-xl min-w-[100px] cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200 hover:border-indigo-200"
                >
                  <ColorSwatch hex={tempHex} size="md" />
                  <p className="text-xs text-slate-500 font-medium">色号 {i + 1}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
