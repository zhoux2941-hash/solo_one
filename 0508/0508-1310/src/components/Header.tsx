import React from 'react';
import { Droplets, Info } from 'lucide-react';
import { COLORS, FONTS } from '../utils/constants';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  return (
    <header
      className={`relative py-8 px-6 mb-6 overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, #0d1f2a 100%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, ${COLORS.gold} 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, ${COLORS.water} 0%, transparent 50%)
          `,
        }}
      />

      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{
          background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.secondary}, ${COLORS.gold})`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.secondary})`,
                boxShadow: `0 0 30px ${COLORS.gold}66`,
              }}
            >
              <Droplets size={32} className="text-white" />
            </div>

            <div>
              <h1
                className="text-3xl md:text-4xl font-bold text-white mb-1"
                style={{ fontFamily: FONTS.title }}
              >
                中国古代水钟模拟器
              </h1>
              <p className="text-sm md:text-base" style={{ color: COLORS.gold }}>
                漏刻 · 托里拆利定律 · 日晷校准
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-2 px-4 py-2 rounded-lg max-w-md"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <Info size={18} style={{ color: COLORS.gold }} />
            <p className="text-sm text-white/80">
              调整参数模拟漏刻滴水过程，体验古代计时智慧
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            <h4 className="font-bold mb-1" style={{ color: COLORS.gold }}>
              🏺 漏刻
            </h4>
            <p className="text-sm text-white/70">
              中国古代计时工具，通过水的流量计量时间
            </p>
          </div>
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            <h4 className="font-bold mb-1" style={{ color: COLORS.gold }}>
              🔬 托里拆利定律
            </h4>
            <p className="text-sm text-white/70">
              v = √(2gh)，描述液体从小孔流出的速度
            </p>
          </div>
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            <h4 className="font-bold mb-1" style={{ color: COLORS.gold }}>
              ☀️ 日晷校准
            </h4>
            <p className="text-sm text-white/70">
              古人通过日晷观测校准漏刻，提高计时精度
            </p>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 w-full h-1"
        style={{
          background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.secondary}, ${COLORS.gold})`,
        }}
      />
    </header>
  );
};

export default Header;
