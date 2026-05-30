import { useState } from 'react';
import { X, MapPin, Check, Circle } from 'lucide-react';
import { Temple } from '../types';
import { cn } from '../lib/utils';

type TempleStatus = 'completed' | 'current' | 'upcoming';

interface TempleNodeProps {
  temple: Temple;
  status: TempleStatus;
  onClick?: (temple: Temple) => void;
}

export function TempleNode({ temple, status, onClick }: TempleNodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const statusColors = {
    completed: {
      primary: '#2D5016',
      secondary: '#4A7C23',
      glow: 'rgba(45, 80, 22, 0.6)',
    },
    current: {
      primary: '#C41E3A',
      secondary: '#E85A70',
      glow: 'rgba(196, 30, 58, 0.6)',
    },
    upcoming: {
      primary: '#9CA3AF',
      secondary: '#D1D5DB',
      glow: 'rgba(156, 163, 175, 0.4)',
    },
  };

  const colors = statusColors[status];

  return (
    <g
      className="cursor-pointer"
      onClick={() => onClick?.(temple)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      transform={`translate(${temple.position.x}, ${temple.position.y})`}
    >
      {status === 'current' && (
        <>
          <circle
            cx="0"
            cy="0"
            r="35"
            fill="none"
            stroke={colors.glow}
            strokeWidth="2"
            className="animate-ping"
            style={{ transformOrigin: 'center', animationDuration: '2s' }}
          />
          <circle
            cx="0"
            cy="0"
            r="28"
            fill="none"
            stroke={colors.primary}
            strokeWidth="2"
            strokeDasharray="4 4"
            className="animate-spin"
            style={{ transformOrigin: 'center', animationDuration: '10s' }}
          />
        </>
      )}

      {status === 'completed' && (
        <circle
          cx="0"
          cy="0"
          r="30"
          fill={colors.glow}
          opacity="0.3"
          className="animate-pulse-slow"
        />
      )}

      <g className="transition-transform duration-300 hover:scale-110" style={{ transformOrigin: 'center' }}>
        <rect
          x="-22"
          y="-18"
          width="44"
          height="36"
          rx="4"
          fill="#F5F0E1"
          stroke={colors.primary}
          strokeWidth="2"
        />

        <polygon
          points="-28,-18 0,-32 28,-18"
          fill={colors.primary}
          stroke={colors.secondary}
          strokeWidth="2"
        />

        <polygon
          points="-24,-18 0,-28 24,-18"
          fill={colors.secondary}
          opacity="0.5"
        />

        <rect
          x="-6"
          y="-8"
          width="12"
          height="16"
          rx="1"
          fill={colors.primary}
          opacity="0.3"
        />

        <rect
          x="-18"
          y="-6"
          width="6"
          height="8"
          rx="1"
          fill={colors.primary}
          opacity="0.4"
        />
        <rect
          x="12"
          y="-6"
          width="6"
          height="8"
          rx="1"
          fill={colors.primary}
          opacity="0.4"
        />

        {status === 'completed' && (
          <g transform="translate(12, -28)">
            <circle cx="0" cy="0" r="8" fill="#2D5016" stroke="#F5F0E1" strokeWidth="2" />
            <path
              d="M-3,0 L-1,2 L3,-2"
              stroke="white"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {status === 'current' && (
          <g transform="translate(12, -28)">
            <circle cx="0" cy="0" r="8" fill="#C41E3A" stroke="#F5F0E1" strokeWidth="2" className="animate-pulse" />
            <circle cx="0" cy="0" r="3" fill="white" />
          </g>
        )}

        {status === 'upcoming' && (
          <g transform="translate(12, -28)">
            <circle cx="0" cy="0" r="8" fill="#9CA3AF" stroke="#F5F0E1" strokeWidth="2" />
            <circle cx="0" cy="0" r="2" fill="#F5F0E1" />
          </g>
        )}
      </g>

      <text
        x="0"
        y="30"
        textAnchor="middle"
        className="text-xs font-bold select-none"
        fill={colors.primary}
        style={{ fontFamily: '"Noto Serif SC", serif' }}
      >
        {temple.name}
      </text>

      {status === 'current' && (
        <text
          x="0"
          y="44"
          textAnchor="middle"
          className="text-[10px] font-medium select-none animate-pulse"
          fill="#C41E3A"
          style={{ fontFamily: '"Noto Serif SC", serif' }}
        >
          ● 当前位置
        </text>
      )}

      {showTooltip && (
        <foreignObject
          x="-120"
          y="-100"
          width="240"
          height="180"
          className="pointer-events-none"
        >
          <div
            className={cn(
              "relative bg-white rounded-xl shadow-2xl p-4 border-2",
              status === 'completed' && "border-cangshan-green/50",
              status === 'current' && "border-embroidery-red/50",
              status === 'upcoming' && "border-gray-300"
            )}
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          >
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 rotate-45"
              style={{
                borderColor: status === 'completed' ? '#2D501680' : status === 'current' ? '#C41E3A80' : '#D1D5DB'
              }}
            />

            <div className="flex items-start space-x-3">
              <MapPin
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: colors.primary }}
              />
              <div className="flex-1 min-w-0">
                <h4
                  className="font-baicalligraphy text-base mb-1"
                  style={{ color: colors.primary }}
                >
                  {temple.name}
                </h4>
                <p className="text-xs text-gray-500 mb-2 flex items-center">
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                    style={{ backgroundColor: colors.primary }}
                  />
                  {temple.location}
                </p>
                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                  {temple.description}
                </p>

                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">
                    仪式类型：{temple.ritualType}
                  </span>
                  <span className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-full",
                    status === 'completed' && "bg-cangshan-green/10 text-cangshan-green",
                    status === 'current' && "bg-embroidery-red/10 text-embroidery-red",
                    status === 'upcoming' && "bg-gray-100 text-gray-500"
                  )}>
                    {status === 'completed' && '已完成'}
                    {status === 'current' && '进行中'}
                    {status === 'upcoming' && '未开始'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

interface TempleDetailModalProps {
  temple: Temple;
  status: TempleStatus;
  onClose: () => void;
  onStart?: () => void;
}

export function TempleDetailModal({ temple, status, onClose, onStart }: TempleDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-gradient-to-br from-ivory to-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto animate-fade-in-up">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-batik via-embroidery-red to-gold" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
        >
          <X className="w-5 h-5 text-indigo-batik" />
        </button>

        <div className="relative p-8">
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-batik to-erhai-blue flex items-center justify-center flex-shrink-0">
              <span className="text-3xl">🏯</span>
            </div>
            <div className="flex-1">
              <h2 className="font-baicalligraphy text-3xl text-indigo-batik mb-1">
                {temple.name}
              </h2>
              <p className="text-indigo-batik/60 text-sm flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {temple.location}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <span className={cn(
                  "inline-flex items-center text-xs font-medium px-3 py-1 rounded-full",
                  status === 'completed' && "bg-cangshan-green/10 text-cangshan-green",
                  status === 'current' && "bg-embroidery-red/10 text-embroidery-red",
                  status === 'upcoming' && "bg-gray-100 text-gray-500"
                )}>
                  {status === 'completed' && <Check className="w-3 h-3 mr-1" />}
                  {status === 'current' && <Circle className="w-3 h-3 mr-1 animate-pulse" />}
                  {status === 'completed' && '已完成'}
                  {status === 'current' && '当前位置'}
                  {status === 'upcoming' && '未到达'}
                </span>
                <span className="text-xs text-indigo-batik/50">
                  第 {temple.order + 1} 站 · {temple.ritualType}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/80 rounded-2xl p-5 border border-gold/20">
              <h3 className="font-baicalligraphy text-xl text-embroidery-red mb-2">庙宇简介</h3>
              <p className="text-indigo-batik/80 leading-relaxed">
                {temple.description}
              </p>
            </div>

            <div className="bg-white/80 rounded-2xl p-5 border border-erhai-blue/20">
              <h3 className="font-baicalligraphy text-xl text-erhai-blue mb-2">文化背景</h3>
              <p className="text-indigo-batik/80 leading-relaxed">
                {temple.culturalIntro}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/80 rounded-2xl p-5 border border-cangshan-green/20">
                <h3 className="font-baicalligraphy text-lg text-cangshan-green mb-3">🎁 供品</h3>
                <div className="flex flex-wrap gap-2">
                  {temple.offerings.map((offering, index) => (
                    <span
                      key={index}
                      className="text-xs bg-cangshan-green/10 text-cangshan-green px-3 py-1 rounded-full"
                    >
                      {offering}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white/80 rounded-2xl p-5 border border-embroidery-red/20">
                <h3 className="font-baicalligraphy text-lg text-embroidery-red mb-3">⚠️ 禁忌</h3>
                <ul className="space-y-1">
                  {temple.taboos.map((taboo, index) => (
                    <li key={index} className="text-xs text-indigo-batik/70 flex items-start">
                      <span className="text-embroidery-red mr-1.5">•</span>
                      {taboo}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            {status === 'current' && (
              <button
                onClick={onStart}
                className="px-8 py-3 bg-gradient-to-r from-embroidery-red to-gold text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                开始 {temple.ritualType} 仪式
              </button>
            )}
            {status === 'completed' && (
              <div className="px-8 py-3 bg-cangshan-green/10 text-cangshan-green font-bold rounded-xl flex items-center">
                <Check className="w-5 h-5 mr-2" />
                仪式已完成
              </div>
            )}
            {status === 'upcoming' && (
              <div className="px-8 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl">
                请先完成前面的庙宇
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
