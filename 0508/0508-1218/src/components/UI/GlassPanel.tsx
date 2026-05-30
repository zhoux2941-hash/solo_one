import React from 'react';
import { twMerge } from 'tailwind-merge';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'green' | 'none';
}

export function GlassPanel({ children, className = '', glow = 'cyan' }: GlassPanelProps) {
  const glowClasses = {
    cyan: 'shadow-[0_0_30px_rgba(0,212,255,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] border-cyan-400/30',
    green: 'shadow-[0_0_30px_rgba(0,255,136,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] border-emerald-400/30',
    none: 'border-white/10',
  };

  return (
    <div
      className={twMerge(
        'rounded-2xl bg-[#0a0e1a]/80 backdrop-blur-xl border',
        glowClasses[glow],
        className
      )}
    >
      {children}
    </div>
  );
}
