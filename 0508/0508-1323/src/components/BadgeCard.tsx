import { useState } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { Badge } from '../types';
import { cn } from '../lib/utils';

interface BadgeCardProps {
  badge: Badge;
  isUnlocked: boolean;
  currentMerit?: number;
}

export function BadgeCard({ badge, isUnlocked, currentMerit = 0 }: BadgeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const progress = Math.min((currentMerit / badge.requiredMerit) * 100, 100);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "relative bg-gradient-to-br rounded-2xl p-6 transition-all duration-500 cursor-pointer",
          "transform hover:scale-105 hover:-translate-y-2",
          isUnlocked
            ? "from-ivory to-white shadow-batik border-2 border-gold/50"
            : "from-gray-100 to-gray-50 shadow-md border-2 border-gray-200"
        )}
      >
        {isUnlocked && (
          <>
            <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-30">
              <div className="absolute -inset-10 bg-gradient-to-r from-gold/40 via-yellow-300/30 to-gold/40 rounded-full blur-3xl animate-batik-pattern" />
            </div>

            <div className="absolute top-2 right-2">
              <Sparkles className={cn(
                "w-5 h-5 text-gold",
                isHovered && "animate-spin"
              )} style={{ animationDuration: '3s' }} />
            </div>
          </>
        )}

        <div className="relative">
          <div className="flex justify-center mb-4">
            <div className={cn(
              "relative w-20 h-20 rounded-full flex items-center justify-center",
              "transition-all duration-500",
              isUnlocked
                ? "bg-gradient-to-br from-gold/20 via-yellow-300/10 to-gold/20"
                : "bg-gray-200"
            )}>
              {isUnlocked && (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-gold/50" />
                  <div className="absolute inset-0 rounded-full animate-ping bg-gold/20" />
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-gold via-yellow-400 to-gold opacity-20 blur-sm" />
                </>
              )}

              {!isUnlocked && (
                <div className="absolute inset-0 rounded-full border-4 border-gray-300 border-dashed" />
              )}

              <span className={cn(
                "text-4xl relative z-10 transition-all duration-500",
                isUnlocked ? "scale-100" : "grayscale opacity-50"
              )}>
                {badge.icon}
              </span>

              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <h3 className={cn(
            "font-baicalligraphy text-xl text-center mb-2 transition-colors duration-300",
            isUnlocked ? "text-gold" : "text-gray-400"
          )}>
            {badge.name}
          </h3>

          <p className="text-xs text-center mb-4">
            {isUnlocked ? (
              <span className="text-cangshan-green font-medium">
                ✦ 已解锁 · {badge.requiredMerit} 功德
              </span>
            ) : (
              <span className="text-gray-400">
                需要 {badge.requiredMerit} 功德
              </span>
            )}
          </p>

          {!isUnlocked && currentMerit > 0 && (
            <div className="mt-3">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gray-400 to-gray-500 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-center text-gray-400 mt-1">
                {currentMerit} / {badge.requiredMerit} · {Math.round(progress)}%
              </p>
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 mt-2 w-72 p-4 rounded-xl shadow-xl transition-all duration-300 z-50",
          "bg-white border-2 border-gold/30",
          isHovered ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
        )}
        style={{ top: '100%' }}
      >
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-gold/30 rotate-45" />

        <div className="relative">
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-3xl">{badge.icon}</span>
            <div>
              <h4 className={cn(
                "font-baicalligraphy text-lg",
                isUnlocked ? "text-gold" : "text-gray-500"
              )}>
                {badge.name}
              </h4>
              <p className="text-xs text-indigo-batik/60">
                {isUnlocked ? '已解锁' : '未解锁'} · {badge.requiredMerit} 功德
              </p>
            </div>
          </div>

          <p className="text-sm text-indigo-batik/80 leading-relaxed">
            {badge.description}
          </p>

          {isUnlocked && (
            <div className="mt-3 pt-3 border-t border-gold/20">
              <p className="text-xs text-cangshan-green font-medium">
                ✨ 恭喜您获得此徽章，继续您的文化之旅吧！
              </p>
            </div>
          )}

          {!isUnlocked && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                还需 {Math.max(0, badge.requiredMerit - currentMerit)} 功德即可解锁
              </p>
            </div>
          )}
        </div>
      </div>

      {isUnlocked && (
        <div
          className="absolute inset-0 -z-10 rounded-2xl bg-gold/30 blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-60"
        />
      )}
    </div>
  );
}
