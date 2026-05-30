import React from 'react';
import { twMerge } from 'tailwind-merge';

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  glow?: 'cyan' | 'green';
}

export function GlowButton({ children, className = '', variant = 'primary', glow = 'cyan', ...props }: GlowButtonProps) {
  const variantClasses = {
    primary: {
      cyan: 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border-cyan-400/50 hover:border-cyan-300/70 hover:shadow-[0_0_20px_rgba(0,212,255,0.4)]',
      green: 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-400/50 hover:border-emerald-300/70 hover:shadow-[0_0_20px_rgba(0,255,136,0.4)]',
    },
    secondary: {
      cyan: 'bg-[#0f1520]/80 text-cyan-300 hover:bg-cyan-500/10 border-cyan-400/30 hover:border-cyan-400/50',
      green: 'bg-[#0f1520]/80 text-emerald-300 hover:bg-emerald-500/10 border-emerald-400/30 hover:border-emerald-400/50',
    },
    ghost: {
      cyan: 'text-cyan-300 hover:bg-cyan-500/10 border-transparent',
      green: 'text-emerald-300 hover:bg-emerald-500/10 border-transparent',
    },
  };

  return (
    <button
      className={twMerge(
        'px-4 py-2 rounded-xl border font-medium transition-all duration-300',
        variantClasses[variant][glow],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
