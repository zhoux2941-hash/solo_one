import { Map, Award, User } from 'lucide-react';
import { Role } from '../types';
import { cn } from '../lib/utils';

interface NavbarProps {
  currentRole: Role | null;
  merit: number;
  onNavigate?: (route: 'map' | 'badges') => void;
  activeRoute?: 'map' | 'badges';
}

export function Navbar({ currentRole, merit, onNavigate, activeRoute }: NavbarProps) {
  return (
    <nav className="relative bg-gradient-to-r from-indigo-batik via-embroidery-red to-indigo-batik shadow-lg">
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
          <pattern id="bai-pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M0 5 L5 0 L10 5 L5 10 Z" fill="white" />
            <circle cx="5" cy="5" r="1.5" fill="#D4AF37" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#bai-pattern)" />
        </svg>
      </div>

      <div className="relative container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-embroidery-red flex items-center justify-center shadow-lg border-2 border-gold">
              <span className="text-2xl">🏯</span>
            </div>
            <div>
              <h1 className="font-baicalligraphy text-2xl md:text-3xl text-ivory tracking-wider">
                白族绕三灵
              </h1>
              <p className="text-xs text-ivory/70 font-noto-serif">
                非物质文化遗产体验
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => onNavigate?.('map')}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300",
                activeRoute === 'map'
                  ? "bg-gold/30 text-gold border border-gold"
                  : "text-ivory hover:bg-ivory/10 hover:text-gold"
              )}
            >
              <Map className="w-5 h-5" />
              <span className="font-medium">巡游路线</span>
            </button>
            <button
              onClick={() => onNavigate?.('badges')}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300",
                activeRoute === 'badges'
                  ? "bg-gold/30 text-gold border border-gold"
                  : "text-ivory hover:bg-ivory/10 hover:text-gold"
              )}
            >
              <Award className="w-5 h-5" />
              <span className="font-medium">徽章收藏</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-ivory/10 backdrop-blur-sm px-4 py-2 rounded-full border border-gold/30">
              <span className="text-gold text-lg">✦</span>
              <span className="text-ivory font-bold text-lg">{merit}</span>
              <span className="text-ivory/70 text-sm">功德</span>
            </div>

            <div className="flex items-center space-x-2">
              {currentRole ? (
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-embroidery-red flex items-center justify-center text-xl border-2 border-gold shadow-lg">
                    {currentRole.avatar}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-ivory font-medium text-sm">{currentRole.name}</p>
                    <p className="text-ivory/60 text-xs">当前角色</p>
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-ivory/20 flex items-center justify-center border-2 border-ivory/30">
                  <User className="w-5 h-5 text-ivory/50" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="md:hidden flex items-center justify-center space-x-4 mt-3 pt-3 border-t border-ivory/20">
          <button
            onClick={() => onNavigate?.('map')}
            className={cn(
              "flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all duration-300 text-sm",
              activeRoute === 'map'
                ? "bg-gold/30 text-gold border border-gold"
                : "text-ivory hover:bg-ivory/10"
            )}
          >
            <Map className="w-4 h-4" />
            <span>巡游路线</span>
          </button>
          <button
            onClick={() => onNavigate?.('badges')}
            className={cn(
              "flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all duration-300 text-sm",
              activeRoute === 'badges'
                ? "bg-gold/30 text-gold border border-gold"
                : "text-ivory hover:bg-ivory/10"
            )}
          >
            <Award className="w-4 h-4" />
            <span>徽章收藏</span>
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gold via-embroidery-red to-gold" />
    </nav>
  );
}
