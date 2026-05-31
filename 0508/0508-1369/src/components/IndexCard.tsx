import { useEffect, useState, useRef } from "react";

interface IndexCardProps {
  title: string;
  shortTitle: string;
  value: number;
  label: string;
  description: string;
  delay: number;
}

function useAnimatedNumber(target: number, duration: number = 600) {
  const [current, setCurrent] = useState(0);
  const prevTarget = useRef(target);

  useEffect(() => {
    if (prevTarget.current === target) return;
    prevTarget.current = target;

    const start = performance.now();
    const from = 0;

    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(from + (target - from) * eased);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [target, duration]);

  return current;
}

export default function IndexCard({
  title,
  shortTitle,
  value,
  label,
  description,
  delay,
}: IndexCardProps) {
  const animatedValue = useAnimatedNumber(value);
  const displayValue = animatedValue.toFixed(1);

  return (
    <div
      className="group relative rounded-xl bg-ink-800/40 border border-ink-700/30 
        p-5 hover:border-gold/20 transition-all duration-300
        animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-gold/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono uppercase tracking-widest text-ink-300">
            {shortTitle}
          </h3>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold
              bg-gold/10 border border-gold/20 text-gold-light"
          >
            {label}
          </span>
        </div>

        <div className="mb-3">
          <span className="font-display text-4xl font-bold text-ink-50 text-shadow-gold">
            {displayValue}
          </span>
        </div>

        <p className="text-xs text-ink-300 leading-relaxed font-body mb-2">
          {title}
        </p>
        <p className="text-xs text-ink-400/80 leading-relaxed font-body italic">
          {description}
        </p>
      </div>
    </div>
  );
}
