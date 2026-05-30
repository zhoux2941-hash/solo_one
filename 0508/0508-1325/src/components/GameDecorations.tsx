export function CloudBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute opacity-20"
          style={{
            top: `${10 + i * 18}%`,
            animation: `cloudMove ${25 + i * 5}s linear infinite`,
            animationDelay: `${-i * 6}s`,
          }}
        >
          <svg width="120" height="60" viewBox="0 0 120 60" fill="white">
            <ellipse cx="30" cy="40" rx="25" ry="20" />
            <ellipse cx="55" cy="35" rx="30" ry="25" />
            <ellipse cx="85" cy="40" rx="25" ry="20" />
            <ellipse cx="55" cy="45" rx="35" ry="15" />
          </svg>
        </div>
      ))}
    </div>
  );
}

export function DrumDecoration({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="28" fill="#E63946" />
        <circle cx="30" cy="30" r="22" fill="#FFB703" />
        <circle cx="30" cy="30" r="16" fill="#E63946" />
        <circle cx="30" cy="30" r="10" fill="#FFB703" />
        <circle cx="30" cy="30" r="4" fill="#E63946" />
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 30 + 12 * Math.cos(angle);
          const y1 = 30 + 12 * Math.sin(angle);
          const x2 = 30 + 20 * Math.cos(angle);
          const y2 = 30 + 20 * Math.sin(angle);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1D3557" strokeWidth="1.5" />;
        })}
      </svg>
    </div>
  );
}

export function ZhuangBorder({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative p-1">
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-zhuang-red via-zhuang-yellow to-zhuang-red animate-pulse" />
      </div>
      <div className="relative bg-gradient-to-b from-zhuang-darkBlue to-zhuang-blue rounded-xl p-1">
        <div className="absolute inset-1 rounded-lg drum-pattern pointer-events-none" />
        {children}
      </div>
    </div>
  );
}
