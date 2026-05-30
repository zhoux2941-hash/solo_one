import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';

export function useTimeControl() {
  const isPlaying = useAppStore((s) => s.isPlaying);
  const timeSpeed = useAppStore((s) => s.timeSpeed);
  const advanceTime = useAppStore((s) => s.advanceTime);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = performance.now();
      return;
    }

    let animationId: number;

    const loop = () => {
      const now = performance.now();
      const delta = (now - lastTimeRef.current) * timeSpeed;
      lastTimeRef.current = now;
      advanceTime(delta);
      animationId = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animationId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, timeSpeed, advanceTime]);
}
