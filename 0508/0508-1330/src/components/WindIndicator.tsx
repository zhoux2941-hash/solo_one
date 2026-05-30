import { useEffect, useState } from 'react';
import { Wind } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

export default function WindIndicator() {
  const { windDirection, windSpeed, generateWind } = useGameStore();
  const [animationOffset, setAnimationOffset] = useState(0);

  useEffect(() => {
    const windChangeInterval = setInterval(() => {
      generateWind();
    }, 15000);

    const animationInterval = setInterval(() => {
      setAnimationOffset((prev) => (prev + 1) % 360);
    }, 50);

    return () => {
      clearInterval(windChangeInterval);
      clearInterval(animationInterval);
    };
  }, [generateWind]);

  const getWindDirectionName = () => {
    const directions = ['东', '东南', '南', '西南', '西', '西北', '北', '东北'];
    const index = Math.round(((windDirection % 360) / 45)) % 8;
    return directions[index];
  };

  const arrowRotation = windDirection + 180;

  return (
    <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-2 border-amber-500/50 rounded-xl p-4 shadow-xl min-w-[160px]">
      <div className="flex items-center gap-2 mb-3">
        <Wind className="w-5 h-5 text-amber-400" />
        <span className="text-amber-100 font-bold text-sm">风向风速</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14">
          <svg viewBox="0 0 50 50" className="w-full h-full">
            <circle
              cx="25"
              cy="25"
              r="22"
              fill="none"
              stroke="rgba(251, 191, 36, 0.3)"
              strokeWidth="2"
            />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 25 + Math.cos(rad) * 18;
              const y1 = 25 + Math.sin(rad) * 18;
              const x2 = 25 + Math.cos(rad) * 22;
              const y2 = 25 + Math.sin(rad) * 22;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(251, 191, 36, 0.5)"
                  strokeWidth="1"
                />
              );
            })}
            <g
              style={{
                transform: `rotate(${arrowRotation + Math.sin(animationOffset * 0.1) * 5}deg)`,
                transformOrigin: '25px 25px',
                transition: 'transform 0.3s ease-out',
              }}
            >
              <polygon
                points="25,8 21,20 25,17 29,20"
                fill="#22c55e"
                stroke="#166534"
                strokeWidth="1"
              />
              <rect x="23" y="17" width="4" height="15" fill="#22c55e" />
              <polygon
                points="25,38 21,32 29,32"
                fill="#ef4444"
                stroke="#991b1b"
                strokeWidth="1"
              />
            </g>
          </svg>
        </div>
        
        <div className="flex flex-col">
          <div className="text-2xl font-bold text-amber-300">
            {windSpeed.toFixed(1)}
            <span className="text-sm text-amber-400 ml-1">m/s</span>
          </div>
          <div className="text-amber-200 text-sm font-medium">
            {getWindDirectionName()}风
          </div>
        </div>
      </div>
      
      <div className="mt-3 h-1 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-300"
          style={{ width: `${(windSpeed / 6) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-amber-400/70 mt-1">
        <span>弱</span>
        <span>强</span>
      </div>
    </div>
  );
}
