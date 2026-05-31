import { useRef, useCallback } from 'react';
import { useSieveStore } from '@/store/useSieveStore';
import { SieveEngine } from '@/utils/sieveEngine';
import { SPEED_CONFIG, NumberStatus } from '@/types';

export function useSieveAnimation() {
  const isPausedRef = useRef(false);
  const shouldStopRef = useRef(false);

  const {
    n,
    numbers,
    speed,
    setNumbers,
    setCurrentPrime,
    setIsRunning,
    setIsCompleted,
    setStepsCompleted,
    setPrimeCount,
    setIsPaused,
  } = useSieveStore();

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const markMultiplesWithAnimation = useCallback(
    async (p: number, startNumbers: typeof numbers) => {
      const { markDelay } = SPEED_CONFIG[speed];
      const multiples = SieveEngine.getMultiples(p, n, startNumbers);

      let currentNumbers = [...startNumbers];

      for (const multiple of multiples) {
        if (shouldStopRef.current) return;
        if (isPausedRef.current) {
          while (isPausedRef.current && !shouldStopRef.current) {
            await sleep(100);
          }
          if (shouldStopRef.current) return;
        }

        if (
          currentNumbers[multiple].status === NumberStatus.COMPOSITE ||
          currentNumbers[multiple].showStrike
        ) {
          continue;
        }

        currentNumbers = SieveEngine.markBeingMarked(currentNumbers, multiple);
        setNumbers(currentNumbers);
        await sleep(markDelay);

        currentNumbers = SieveEngine.markComposite(currentNumbers, multiple);
        setNumbers(currentNumbers);
        await sleep(markDelay / 2);
      }

      return currentNumbers;
    },
    [n, speed, setNumbers]
  );

  const processSinglePrime = useCallback(
    async (p: number, startNumbers: typeof numbers) => {
      const { stepDelay } = SPEED_CONFIG[speed];

      let currentNumbers = [...startNumbers];

      currentNumbers = SieveEngine.markCurrent(currentNumbers, p);
      setNumbers(currentNumbers);
      setCurrentPrime(p);
      await sleep(stepDelay / 2);

      if (shouldStopRef.current) return { completed: false, numbers: currentNumbers };

      const updatedNumbers = await markMultiplesWithAnimation(p, currentNumbers);
      if (!updatedNumbers) return { completed: false, numbers: currentNumbers };

      currentNumbers = updatedNumbers;

      currentNumbers = SieveEngine.markPrime(currentNumbers, p);
      setNumbers(currentNumbers);

      const count = SieveEngine.countPrimes(currentNumbers);
      setPrimeCount(count);

      await sleep(stepDelay / 2);

      return { completed: true, numbers: currentNumbers };
    },
    [speed, markMultiplesWithAnimation, setNumbers, setCurrentPrime, setPrimeCount]
  );

  const finishAnimation = useCallback(
    async (finalNumbers: typeof numbers) => {
      const { stepDelay } = SPEED_CONFIG[speed];

      let currentNumbers = SieveEngine.markRemainingPrimes(finalNumbers);

      for (let i = 0; i < currentNumbers.length; i++) {
        if (currentNumbers[i].status === NumberStatus.CURRENT) {
          currentNumbers = SieveEngine.markPrime(currentNumbers, i);
        }
      }

      setNumbers(currentNumbers);
      await sleep(stepDelay / 2);

      const count = SieveEngine.countPrimes(currentNumbers);
      setPrimeCount(count);
      setCurrentPrime(null);
      setIsCompleted(true);
      setIsRunning(false);
    },
    [speed, setNumbers, setPrimeCount, setCurrentPrime, setIsCompleted, setIsRunning]
  );

  const stepForward = useCallback(async () => {
    const { numbers: currentNumbers, currentPrime, stepsCompleted } = useSieveStore.getState();

    const nextPrime = SieveEngine.getNextPrime(currentPrime ?? 1, currentNumbers);

    if (nextPrime === null || SieveEngine.isComplete(nextPrime, n)) {
      await finishAnimation(currentNumbers);
      return false;
    }

    setIsRunning(true);
    const result = await processSinglePrime(nextPrime, currentNumbers);

    if (result.completed) {
      setStepsCompleted(stepsCompleted + 1);
      setCurrentPrime(nextPrime);
    }

    setIsRunning(false);

    const checkPrime = SieveEngine.getNextPrime(nextPrime, result.numbers);
    if (checkPrime === null || SieveEngine.isComplete(checkPrime, n)) {
      await finishAnimation(result.numbers);
    }

    return result.completed;
  }, [n, processSinglePrime, finishAnimation, setIsRunning, setStepsCompleted, setCurrentPrime]);

  const autoPlay = useCallback(async () => {
    shouldStopRef.current = false;
    isPausedRef.current = false;
    setIsPaused(false);
    setIsRunning(true);
    setIsCompleted(false);

    const { numbers: startNumbers, currentPrime } = useSieveStore.getState();
    let currentNumbers = [...startNumbers];
    let p = SieveEngine.getNextPrime(currentPrime ?? 1, currentNumbers);
    let steps = useSieveStore.getState().stepsCompleted;

    const { stepDelay } = SPEED_CONFIG[speed];

    while (p !== null && !SieveEngine.isComplete(p, n) && !shouldStopRef.current) {
      if (isPausedRef.current) {
        while (isPausedRef.current && !shouldStopRef.current) {
          await sleep(100);
        }
        if (shouldStopRef.current) break;
      }

      currentNumbers = SieveEngine.markCurrent(currentNumbers, p);
      setNumbers(currentNumbers);
      setCurrentPrime(p);
      await sleep(stepDelay / 2);

      if (shouldStopRef.current) break;

      const multiples = SieveEngine.getMultiples(p, n, currentNumbers);

      for (const multiple of multiples) {
        if (shouldStopRef.current) break;
        if (isPausedRef.current) {
          while (isPausedRef.current && !shouldStopRef.current) {
            await sleep(100);
          }
          if (shouldStopRef.current) break;
        }

        if (
          currentNumbers[multiple].status === NumberStatus.COMPOSITE ||
          currentNumbers[multiple].showStrike
        ) {
          continue;
        }

        currentNumbers = SieveEngine.markBeingMarked(currentNumbers, multiple);
        setNumbers([...currentNumbers]);
        await sleep(SPEED_CONFIG[speed].markDelay);

        currentNumbers = SieveEngine.markComposite(currentNumbers, multiple);
        setNumbers([...currentNumbers]);
        await sleep(SPEED_CONFIG[speed].markDelay / 2);
      }

      if (shouldStopRef.current) break;

      currentNumbers = SieveEngine.markPrime(currentNumbers, p);
      setNumbers([...currentNumbers]);
      steps++;
      setStepsCompleted(steps);

      const count = SieveEngine.countPrimes(currentNumbers);
      setPrimeCount(count);

      await sleep(stepDelay / 2);

      p = SieveEngine.getNextPrime(p, currentNumbers);
    }

    if (!shouldStopRef.current) {
      await finishAnimation(currentNumbers);
    } else {
      setIsRunning(false);
    }
  }, [
    n,
    speed,
    setNumbers,
    setCurrentPrime,
    setIsRunning,
    setIsCompleted,
    setStepsCompleted,
    setPrimeCount,
    setIsPaused,
    finishAnimation,
  ]);

  const pause = useCallback(() => {
    isPausedRef.current = true;
    setIsPaused(true);
  }, [setIsPaused]);

  const resume = useCallback(() => {
    isPausedRef.current = false;
    setIsPaused(false);
  }, [setIsPaused]);

  const stop = useCallback(() => {
    shouldStopRef.current = true;
    isPausedRef.current = false;
  }, []);

  return {
    autoPlay,
    stepForward,
    pause,
    resume,
    stop,
  };
}
