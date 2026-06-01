import { useRef, useEffect, useState, useCallback } from 'react';
import type { EasingFn } from '@/utils/easing';
import { easeOutCubic } from '@/utils/easing';

export interface AnimatedTransitionOptions {
  duration?: number;
  easing?: EasingFn;
  onFrame?: (progress: number) => void;
}

function lerpObject<T extends object>(from: T, to: T, t: number): T {
  const result = { ...from };
  const fromRecord = from as Record<string, number>;
  const toRecord = to as Record<string, number>;
  const resultRecord = result as Record<string, number>;
  for (const key of Object.keys(from)) {
    if (typeof fromRecord[key] === 'number' && typeof toRecord[key] === 'number') {
      resultRecord[key] = fromRecord[key] + (toRecord[key] - fromRecord[key]) * t;
    }
  }
  return result;
}

function isSameObject<T extends object>(a: T, b: T): boolean {
  const aRecord = a as Record<string, number>;
  const bRecord = b as Record<string, number>;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => aRecord[key] === bRecord[key]);
}

export function useAnimatedTransition<T extends object>(
  target: T,
  options: AnimatedTransitionOptions = {},
): T {
  const { duration = 400, easing = easeOutCubic, onFrame } = options;

  const [displayValue, setDisplayValue] = useState<T>(target);
  const fromRef = useRef<T>(target);
  const animIdRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const animate = useCallback(
    (timestamp: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const rawProgress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(rawProgress);

      const interpolated = lerpObject(fromRef.current, target, easedProgress);
      setDisplayValue(interpolated);

      onFrame?.(rawProgress);

      if (rawProgress < 1) {
        animIdRef.current = requestAnimationFrame(animate);
      }
    },
    [target, duration, easing, onFrame],
  );

  useEffect(() => {
    if (isSameObject(displayValue, target)) {
      return;
    }

    fromRef.current = { ...displayValue };
    startTimeRef.current = 0;

    cancelAnimationFrame(animIdRef.current);
    animIdRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animIdRef.current);
    };
  }, [target, animate, displayValue]);

  return displayValue;
}
