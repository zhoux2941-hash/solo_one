import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function useAnimation() {
  const {
    isRunning,
    animationSpeed,
    currentStepIndex,
    steps,
    isStepMode,
    isComplete,
    updateToStep,
    pauseAnimation,
    tickAnimationElapsed,
  } = useAppStore();

  const animationRef = useRef<number | null>(null);
  const lastStepTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isRunning || isStepMode || isComplete) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      tickAnimationElapsed();

      if (timestamp - lastStepTimeRef.current >= animationSpeed) {
        const nextIndex = currentStepIndex + 1;

        if (nextIndex >= steps.length) {
          pauseAnimation();
          return;
        }

        updateToStep(nextIndex);
        lastStepTimeRef.current = timestamp;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, animationSpeed, currentStepIndex, steps.length, isStepMode, isComplete, updateToStep, pauseAnimation, tickAnimationElapsed]);

  return null;
}
