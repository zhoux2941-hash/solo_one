import React from 'react';
import { useColorStore } from '@/hooks/useColorStore';

const ColorInfo = React.memo(function ColorInfo() {
  const { getHex, getRgbString } = useColorStore();
  const hexColor = getHex();
  const rgbString = getRgbString();

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gray-900/50 rounded-2xl backdrop-blur-sm border border-gray-800">
      <div className="flex flex-col items-center gap-2">
        <span className="text-gray-400 text-sm uppercase tracking-wider">
          颜色值
        </span>
        <span
          className="font-mono text-3xl font-bold tracking-wider transition-colors duration-300"
          style={{ color: hexColor }}
        >
          {hexColor}
        </span>
      </div>
      <div className="w-full h-px bg-gray-700" />
      <div className="flex flex-col items-center gap-2">
        <span className="text-gray-400 text-sm uppercase tracking-wider">
          RGB
        </span>
        <span className="font-mono text-xl text-gray-200">
          {rgbString}
        </span>
      </div>
    </div>
  );
});

export default ColorInfo;
