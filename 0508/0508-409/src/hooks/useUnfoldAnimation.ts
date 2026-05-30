import { useEffect, useRef, useCallback } from 'react';
import { usePaperCuttingStore } from '../store/usePaperCuttingStore';

export function useUnfoldAnimation() {
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const duration = 1600;

  const {
    isUnfolding,
    setUnfoldProgress,
    setIsAnimating,
    setShowFinalResult,
    setIsUnfolding,
    drawPaths,
  } = usePaperCuttingStore();

  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);

    const easeProgress = 1 - Math.pow(1 - progress, 3);
    setUnfoldProgress(easeProgress);

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setIsAnimating(false);
      setIsUnfolding(false);
      setShowFinalResult(true);
    }
  }, [setUnfoldProgress, setIsAnimating, setShowFinalResult, setIsUnfolding]);

  useEffect(() => {
    if (isUnfolding && drawPaths.length > 0) {
      startTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    } else if (isUnfolding && drawPaths.length === 0) {
      setIsAnimating(false);
      setIsUnfolding(false);
      setShowFinalResult(true);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isUnfolding, drawPaths.length, animate, setIsAnimating, setIsUnfolding, setShowFinalResult]);
}
