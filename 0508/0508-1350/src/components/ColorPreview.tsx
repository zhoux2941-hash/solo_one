import React from 'react';
import { useColorStore } from '@/hooks/useColorStore';
import { generateBoxShadows } from '@/utils/colorUtils';

const ColorPreview = React.memo(function ColorPreview() {
  const { red, green, blue, getHex } = useColorStore();
  const hexColor = getHex();
  const boxShadow = generateBoxShadows(red, green, blue);

  return (
    <div className="flex items-center justify-center flex-1">
      <div
        className="w-64 h-64 md:w-80 md:h-80 rounded-full animate-pulse-slow"
        style={{
          backgroundColor: hexColor,
          boxShadow,
        }}
      />
    </div>
  );
});

export default ColorPreview;
