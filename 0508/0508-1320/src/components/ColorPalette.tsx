import { ColorInfo } from '../types';
import { Palette } from 'lucide-react';

interface ColorPaletteProps {
  colors: ColorInfo[];
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

const ColorPalette = ({ colors, selectedColor, onSelectColor }: ColorPaletteProps) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-200">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-6 h-6 text-amber-700" />
        <h3 className="text-xl font-bold text-amber-900">传统调色板</h3>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-amber-600">当前颜色:</span>
          <div
            className="w-8 h-8 rounded-full border-2 border-amber-400 shadow-inner"
            style={{ backgroundColor: selectedColor }}
          />
        </div>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {colors.map((colorInfo, index) => (
          <button
            key={index}
            onClick={() => onSelectColor(colorInfo.color)}
            className={`group relative w-full aspect-square rounded-lg transition-all duration-200 ${
              selectedColor === colorInfo.color
                ? 'ring-4 ring-amber-500 scale-110 shadow-lg'
                : 'hover:scale-105 hover:shadow-md'
            }`}
            style={{ backgroundColor: colorInfo.color }}
            title={`${colorInfo.name}: ${colorInfo.meaning}`}
          >
            <div
              className="absolute inset-0 rounded-lg border-2 transition-opacity"
              style={{
                borderColor:
                  colorInfo.color === '#FFFFFF' || colorInfo.color === '#F0F0F0'
                    ? '#d4d4d4'
                    : 'transparent',
              }}
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {colorInfo.name}: {colorInfo.meaning}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-amber-200">
        <p className="text-sm text-amber-600 text-center">
          💡 提示：悬停在色块上可查看色彩寓意
        </p>
      </div>
    </div>
  );
};

export default ColorPalette;
