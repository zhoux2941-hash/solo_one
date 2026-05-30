import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard, getContrastColor } from '../utils/helpers';
import type { PantoneColor, RGB, CMYK, Lab } from '@shared/types';

interface ColorSwatchProps {
  hex: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showValues?: boolean;
  pantone?: PantoneColor;
  rgb?: RGB;
  cmyk?: CMYK;
  lab?: Lab;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  disableCopy?: boolean;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48',
};

export default function ColorSwatch({
  hex,
  size = 'md',
  showValues = false,
  pantone,
  rgb,
  cmyk,
  lab,
  className = '',
  onClick,
  selected = false,
  disableCopy = false,
}: ColorSwatchProps) {
  const [copied, setCopied] = useState(false);
  const contrastColor = getContrastColor(hex);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(hex);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className={`inline-block ${className}`}>
      <div
        onClick={onClick}
        className={`
          ${sizeClasses[size]} rounded-xl relative overflow-hidden cursor-pointer
          transition-all duration-300 group
          ${selected ? 'ring-4 ring-cyan-400 shadow-lg shadow-cyan-500/30' : 'hover:shadow-xl'}
          ${onClick ? 'hover:scale-105' : ''}
        `}
        style={{ backgroundColor: hex }}
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
          }}
        />
        
        {!disableCopy && (
          <button
            onClick={handleCopy}
            className={`
              absolute top-2 right-2 p-1.5 rounded-md backdrop-blur-sm
              transition-all duration-200 opacity-0 group-hover:opacity-100
            `}
            style={{ backgroundColor: `${contrastColor}20`, color: contrastColor }}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {pantone && size !== 'sm' && (
          <div
            className="absolute bottom-0 left-0 right-0 p-2 text-xs font-medium backdrop-blur-sm"
            style={{ backgroundColor: `${contrastColor}10`, color: contrastColor }}
          >
            <p className="truncate">{pantone.pantoneCode}</p>
            {size !== 'md' && <p className="opacity-75 truncate">{pantone.nameZh}</p>}
          </div>
        )}
      </div>

      {showValues && (
        <div className="mt-2 space-y-1 text-xs font-mono text-center">
          <p className="text-slate-600">HEX: <span className="text-indigo-600 font-semibold">{hex}</span></p>
          {rgb && (
            <p className="text-slate-500">
              RGB: <span className="text-orange-600 font-semibold">{rgb.r}, {rgb.g}, {rgb.b}</span>
            </p>
          )}
          {cmyk && (
            <p className="text-slate-500">
              CMYK: <span className="text-yellow-700 font-semibold">{cmyk.c.toFixed(0)}%, {cmyk.m.toFixed(0)}%, {cmyk.y.toFixed(0)}%, {cmyk.k.toFixed(0)}%</span>
            </p>
          )}
          {lab && (
            <p className="text-slate-500">
              Lab: <span className="text-green-600 font-semibold">{lab.L.toFixed(1)}, {lab.a.toFixed(1)}, {lab.b.toFixed(1)}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
