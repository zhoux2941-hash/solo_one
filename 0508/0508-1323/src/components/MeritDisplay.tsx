import { useEffect, useState, useRef } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';
import { Badge } from '../types';
import { cn } from '../lib/utils';

interface MeritDisplayProps {
  currentMerit: number;
  nextBadge?: Badge;
  previousMerit?: number;
  showAnimation?: boolean;
}

export function MeritDisplay({ currentMerit, nextBadge, previousMerit = 0, showAnimation = true }: MeritDisplayProps) {
  const [displayMerit, setDisplayMerit] = useState(previousMerit);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!showAnimation) {
      setDisplayMerit(currentMerit);
      return;
    }

    if (currentMerit === displayMerit) return;

    setIsAnimating(true);
    const startValue = displayMerit;
    const endValue = currentMerit;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart);

      setDisplayMerit(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentMerit, showAnimation, displayMerit]);

  const progress = nextBadge
    ? Math.min(((currentMerit - (nextBadge.requiredMerit - 50)) / 50) * 100, 100)
    : 100;

  return (
    <div className="relative bg-gradient-to-br from-ivory to-white rounded-2xl p-6 shadow-batik border-2 border-gold/30 overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-gold/20 to-embroidery-red/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-erhai-blue/10 to-cangshan-green/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />

      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="merit-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="2" fill="#D4AF37" />
            <path d="M0 10 L10 0 L20 10 L10 20 Z" fill="none" stroke="#D4AF37" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#merit-pattern)" />
        </svg>
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "relative p-3 rounded-xl bg-gradient-to-br from-gold/20 to-embroidery-red/20",
              isAnimating && "animate-pulse"
            )}>
              <Sparkles className="w-6 h-6 text-gold" />
              {isAnimating && (
                <div className="absolute inset-0 rounded-xl bg-gold/30 animate-ping" />
              )}
            </div>
            <div>
              <h3 className="font-baicalligraphy text-xl text-indigo-batik">功德值</h3>
              <p className="text-sm text-indigo-batik/60">积善成德，神明自得</p>
            </div>
          </div>

          <div className="text-right">
            <div className="relative">
              <span className={cn(
                "font-baicalligraphy text-5xl font-bold bg-gradient-to-r from-gold via-yellow-400 to-gold bg-clip-text text-transparent",
                isAnimating && "animate-embroidery"
              )}>
                {displayMerit}
              </span>
              {isAnimating && currentMerit > previousMerit && (
                <span className="absolute -top-2 -right-6 text-embroidery-red font-bold text-lg animate-bounce">
                  +{currentMerit - previousMerit}
                </span>
              )}
            </div>
            <div className="flex items-center justify-end space-x-1 text-sm text-cangshan-green">
              <TrendingUp className="w-4 h-4" />
              <span>功德增长中</span>
            </div>
          </div>
        </div>

        {nextBadge && (
          <div className="mt-6 pt-4 border-t border-gold/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{nextBadge.icon}</span>
                <div>
                  <p className="text-sm font-medium text-indigo-batik">下一个徽章</p>
                  <p className="text-xs text-indigo-batik/60">{nextBadge.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gold">{nextBadge.requiredMerit} 功德</p>
                <p className="text-xs text-indigo-batik/60">
                  还需 {Math.max(0, nextBadge.requiredMerit - currentMerit)} 功德
                </p>
              </div>
            </div>

            <div className="relative h-4 bg-gradient-to-r from-ivory to-ivory/50 rounded-full overflow-hidden border border-gold/30">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold via-yellow-400 to-gold rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-batik-pattern" />
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-indigo-batik/70 drop-shadow-sm">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>

            <div className="flex justify-between mt-1 text-xs text-indigo-batik/50">
              <span>{nextBadge.requiredMerit - 50}</span>
              <span>{nextBadge.requiredMerit}</span>
            </div>
          </div>
        )}

        {!nextBadge && (
          <div className="mt-6 pt-4 border-t border-gold/20 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <p className="font-baicalligraphy text-xl text-gold">功德圆满</p>
            <p className="text-sm text-indigo-batik/60">您已解锁所有徽章！</p>
          </div>
        )}
      </div>
    </div>
  );
}
