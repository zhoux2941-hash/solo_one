import { useEffect } from 'react';
import { useColorStore } from '../store/colorStore';
import { colorApi } from '../utils/api';
import ColorInput from '../components/ColorInput';
import ColorResult from '../components/ColorResult';

export default function Home() {
  const {
    conversionResult,
    isLoading,
    error,
    setPresetColors,
  } = useColorStore();

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
  }, [setPresetColors]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent mb-3">
          专业颜色空间转换工具
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto text-lg">
          支持 RGB、CMYK、Pantone 专色等多种颜色空间的实时互转，
          内置 2000+ Pantone 色卡数据库，提供精确的色差计算和专色叠印模拟
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <ColorInput />
        </div>
        <div className="lg:col-span-7 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <ColorResult
            result={conversionResult}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>

      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        {[
          { label: 'Pantone 色卡', value: '2000+', desc: '内置专业色卡数据库', icon: '🎨' },
          { label: '颜色空间', value: '6+', desc: 'RGB/CMYK/Lab/XYZ/HSL/HEX', icon: '🌈' },
          { label: '色差算法', value: 'ΔE 2000', desc: '专业级色差计算标准', icon: '📊' },
          { label: '输出格式', value: 'PDF', desc: '专业颜色报告导出', icon: '📄' },
        ].map((stat, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="text-3xl mb-2">{stat.icon}</div>
            <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              {stat.value}
            </p>
            <p className="text-sm font-semibold text-slate-700 mt-1">{stat.label}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
