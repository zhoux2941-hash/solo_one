import React from 'react';
import { BarChart3 } from 'lucide-react';
import type { HarmonicData } from '../types';

interface HarmonicListProps {
  harmonics: HarmonicData[];
}

export const HarmonicList: React.FC<HarmonicListProps> = ({ harmonics }) => {
  const maxAmplitude = Math.max(...harmonics.map((h) => Math.abs(h.amplitude)));

  return (
    <div className="bg-[#12121f] rounded-xl p-6 border border-purple-500/20 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <BarChart3 className="w-6 h-6 text-purple-400" />
        </div>
        <h2 className="text-xl font-bold text-white">谐波分量</h2>
        <span className="ml-auto text-sm text-gray-400">
          共 {harmonics.length} 次
        </span>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {harmonics.map((harmonic, index) => {
          const barWidth = (Math.abs(harmonic.amplitude) / maxAmplitude) * 100;
          return (
            <div
              key={index}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: harmonic.color }}
              />
              <div className="w-12 text-sm font-mono text-gray-300">
                {harmonic.n}次
              </div>
              <div className="flex-1 h-4 bg-gray-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: harmonic.color,
                    boxShadow: `0 0 10px ${harmonic.color}50`,
                  }}
                />
              </div>
              <div className="w-20 text-right text-xs font-mono text-gray-400">
                {Math.abs(harmonic.amplitude).toFixed(4)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <div className="text-xs text-gray-500 space-y-1">
          <p>📊 谐波振幅递减规律:</p>
          <ul className="list-disc list-inside ml-2">
            <li>方波: 振幅 ∝ 1/n</li>
            <li>三角波: 振幅 ∝ 1/n²</li>
            <li>锯齿波: 振幅 ∝ 1/n</li>
          </ul>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.7);
        }
      `}</style>
    </div>
  );
};
