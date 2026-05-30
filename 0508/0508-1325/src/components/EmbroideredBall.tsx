import { GAME_CONFIG } from '@/config/gameConfig';

interface EmbroideredBallProps {
  position: { x: number; y: number };
  isFlying: boolean;
}

export function EmbroideredBall({ position, isFlying }: EmbroideredBallProps) {
  const size = GAME_CONFIG.ballSize;
  
  return (
    <div
      className={`absolute ball-shadow ${isFlying ? 'animate-ballSpin' : ''}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <defs>
          <radialGradient id="ballGrad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="50%" stopColor="#E63946" />
            <stop offset="100%" stopColor="#B91C1C" />
          </radialGradient>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="50%" stopColor="#FFB703" />
            <stop offset="100%" stopColor="#E6A700" />
          </linearGradient>
        </defs>
        
        <circle cx="20" cy="20" r="18" fill="url(#ballGrad)" />
        
        <path d="M20 2 L20 38" stroke="url(#goldGrad)" strokeWidth="2" />
        <path d="M2 20 L38 20" stroke="url(#goldGrad)" strokeWidth="2" />
        <path d="M7 7 L33 33" stroke="url(#goldGrad)" strokeWidth="1.5" />
        <path d="M33 7 L7 33" stroke="url(#goldGrad)" strokeWidth="1.5" />
        
        <ellipse cx="20" cy="20" rx="12" ry="4" fill="none" stroke="url(#goldGrad)" strokeWidth="1.5" />
        <ellipse cx="20" cy="20" rx="4" ry="12" fill="none" stroke="url(#goldGrad)" strokeWidth="1.5" />
        
        <circle cx="20" cy="20" r="6" fill="url(#goldGrad)" />
        <circle cx="20" cy="20" r="3" fill="#E63946" />
        
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x = 20 + 14 * Math.cos(rad);
          const y = 20 + 14 * Math.sin(rad);
          return <circle key={angle} cx={x} cy={y} r="2" fill="#FFB703" />;
        })}
        
        <circle cx="14" cy="14" r="3" fill="rgba(255,255,255,0.4)" />
        
        <g transform="translate(20, 2)">
          <circle cx="0" cy="-3" r="2" fill="#FFB703" />
          <path d="M0 -1 Q-3 3 0 5 Q3 3 0 -1" fill="#E63946" />
        </g>
        <g transform="translate(20, 38)">
          <circle cx="0" cy="3" r="2" fill="#FFB703" />
          <path d="M0 1 Q-3 -3 0 -5 Q3 -3 0 1" fill="#E63946" />
        </g>
      </svg>
    </div>
  );
}
