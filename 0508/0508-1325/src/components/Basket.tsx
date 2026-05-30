import { GAME_CONFIG } from '@/config/gameConfig';

interface BasketProps {
  positionPercent: number;
  yPercent: number;
}

export function Basket({ positionPercent, yPercent }: BasketProps) {
  const width = GAME_CONFIG.basketWidth;
  const height = GAME_CONFIG.basketHeight;
  
  return (
    <div
      className="absolute transition-none basket-shadow"
      style={{
        left: `${positionPercent}%`,
        top: `${yPercent}%`,
        transform: 'translate(-50%, -50%)',
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <svg viewBox="0 0 90 60" className="w-full h-full">
        <defs>
          <linearGradient id="basketGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B4513" />
            <stop offset="50%" stopColor="#A0522D" />
            <stop offset="100%" stopColor="#654321" />
          </linearGradient>
          <linearGradient id="weaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#DEB887" />
            <stop offset="100%" stopColor="#D2691E" />
          </linearGradient>
        </defs>
        
        <path
          d="M10 10 Q5 5 10 0 L80 0 Q85 5 80 10 L75 50 Q72 58 65 58 L25 58 Q18 58 15 50 Z"
          fill="url(#basketGrad)"
          stroke="#5D3A1A"
          strokeWidth="2"
        />
        
        {[...Array(7)].map((_, i) => (
          <path
            key={`h${i}`}
            d={`M12 ${12 + i * 7} L78 ${12 + i * 7}`}
            stroke="url(#weaveGrad)"
            strokeWidth="2"
            opacity="0.8"
          />
        ))}
        
        {[...Array(12)].map((_, i) => (
          <path
            key={`v${i}`}
            d={`M${12 + i * 6} 10 Q${12 + i * 6} 30 ${15 + i * 5} 55`}
            stroke="url(#weaveGrad)"
            strokeWidth="1.5"
            opacity="0.8"
            fill="none"
          />
        ))}
        
        <ellipse cx="45" cy="3" rx="38" ry="5" fill="#5D3A1A" />
        <ellipse cx="45" cy="3" rx="34" ry="3.5" fill="#8B4513" />
        
        <rect x="40" y="-8" width="10" height="10" rx="2" fill="#E63946" />
        <circle cx="45" cy="-3" r="3" fill="#FFB703" />
        
        <path d="M15 8 L10 15 M75 8 L80 15" stroke="#E63946" strokeWidth="2" fill="none" />
      </svg>
    </div>
  );
}
