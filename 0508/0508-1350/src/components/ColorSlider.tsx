import React from 'react';

interface ColorSliderProps {
  label: string;
  value: number;
  color: string;
  onChange: (value: number) => void;
}

const ColorSlider = React.memo(function ColorSlider({
  label,
  value,
  color,
  onChange,
}: ColorSliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const fillPercent = (value / 255) * 100;

  return (
    <div className="flex flex-col gap-3 w-full color-slider" style={{ '--slider-color': color } as React.CSSProperties}>
      <div className="flex items-center justify-between">
        <span
          className="text-xl font-bold tracking-wider"
          style={{ color }}
        >
          {label}
        </span>
        <span className="font-mono text-lg text-gray-300 w-12 text-right">
          {value}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="255"
        value={value}
        onChange={handleChange}
        className="w-full h-3 rounded-full appearance-none cursor-pointer color-slider-input"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${fillPercent}%, #333 ${fillPercent}%, #333 100%)`,
        }}
      />
    </div>
  );
});

export default ColorSlider;
