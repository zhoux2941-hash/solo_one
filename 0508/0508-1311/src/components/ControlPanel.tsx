import React from 'react';
import { Theme, LayoutType, ExportSizeType } from '../types';
import { THEMES, FONT_FAMILIES } from '../utils/themes';

interface ControlPanelProps {
  year: number;
  onYearChange: (year: number) => void;
  layout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  fontFamily: string;
  onFontFamilyChange: (fontFamily: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  exportSize: ExportSizeType;
  onExportSizeChange: (size: ExportSizeType) => void;
  onExport: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  year,
  onYearChange,
  layout,
  onLayoutChange,
  theme,
  onThemeChange,
  fontFamily,
  onFontFamilyChange,
  backgroundColor,
  onBackgroundColorChange,
  exportSize,
  onExportSizeChange,
  onExport,
}) => {
  const years = Array.from({ length: 31 }, (_, i) => 2000 + i);

  return (
    <div className="w-80 bg-white shadow-xl h-full overflow-y-auto p-6 flex flex-col gap-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: "'Ma Shan Zheng', cursive" }}>
          二十四节气日历
        </h1>
        <p className="text-sm text-gray-500">选择年份，自定义样式，导出精美挂图</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">选择年份</label>
        <select
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}年</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">布局方向</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onLayoutChange('portrait')}
            className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
              layout === 'portrait'
                ? 'border-amber-500 bg-amber-50 text-amber-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            纵向
          </button>
          <button
            onClick={() => onLayoutChange('landscape')}
            className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
              layout === 'landscape'
                ? 'border-amber-500 bg-amber-50 text-amber-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            横向
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">传统配色主题</label>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                onThemeChange(t);
                onBackgroundColorChange(t.backgroundColor);
              }}
              className={`relative p-3 rounded-lg border-2 transition-all ${
                theme.id === t.id
                  ? 'border-amber-500 ring-2 ring-amber-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className="w-full h-8 rounded mb-2"
                style={{ backgroundColor: t.primaryColor }}
              />
              <span className="text-xs font-medium text-gray-700">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">背景颜色</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => onBackgroundColorChange(e.target.value)}
            className="w-12 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={backgroundColor}
            onChange={(e) => onBackgroundColorChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">字体选择</label>
        <select
          value={fontFamily}
          onChange={(e) => onFontFamilyChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white"
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font.id} value={font.value} style={{ fontFamily: font.value }}>
              {font.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">导出尺寸</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onExportSizeChange('A4')}
            className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
              exportSize === 'A4'
                ? 'border-amber-500 bg-amber-50 text-amber-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            A4 (2480×3508)
          </button>
          <button
            onClick={() => onExportSizeChange('A3')}
            className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
              exportSize === 'A3'
                ? 'border-amber-500 bg-amber-50 text-amber-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            A3 (3508×4961)
          </button>
        </div>
        <p className="text-xs text-gray-500">300 DPI 高清输出，适合打印</p>
      </div>

      <div className="mt-auto pt-4 border-t border-gray-200">
        <button
          onClick={onExport}
          className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-lg shadow-lg hover:from-amber-700 hover:to-orange-700 transition-all transform hover:scale-105 active:scale-95"
        >
          导出高清 PNG
        </button>
        <p className="text-xs text-center text-gray-500 mt-2">
          点击按钮下载可打印图片
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">💡 使用说明</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• 选择 2000-2030 年份查看节气</li>
          <li>• 纵向/横向布局适合不同场景</li>
          <li>• 三种传统配色主题可选</li>
          <li>• 导出 A3/A4 尺寸高清图片</li>
        </ul>
      </div>
    </div>
  );
};

export default ControlPanel;
