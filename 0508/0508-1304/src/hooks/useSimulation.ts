import { useState, useRef, useEffect, useCallback } from 'react';
import { FireSimulator } from '../engine/FireSimulator';
import { SimulationParams, SimulationStats } from '../engine/types';
import { CellGrid } from '../engine/CellGrid';
import { SIMULATION_FPS } from '../engine/constants';

export function useSimulation() {
  const simulatorRef = useRef<FireSimulator | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<SimulationStats>({
    totalTrees: 0,
    burningTrees: 0,
    burnedTrees: 0,
    burnedArea: 0,
    survivalRate: 0,
    timeStep: 0,
    firefighterCount: 0,
  });
  const [gridVersion, setGridVersion] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const initSimulator = useCallback(() => {
    simulatorRef.current = new FireSimulator();
    simulatorRef.current.initialize();
    setStats(simulatorRef.current.getStats());
    setGridVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    initSimulator();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initSimulator]);

  const updateStats = useCallback(() => {
    if (simulatorRef.current) {
      setStats(simulatorRef.current.getStats());
    }
  }, []);

  const simulateStep = useCallback(() => {
    if (simulatorRef.current) {
      simulatorRef.current.step();
      updateStats();
      setGridVersion((v) => v + 1);

      if (!simulatorRef.current.isBurning()) {
        setIsRunning(false);
      }
    }
  }, [updateStats]);

  const animationLoop = useCallback(
    (timestamp: number) => {
      const frameInterval = 1000 / SIMULATION_FPS;

      if (timestamp - lastUpdateRef.current >= frameInterval) {
        simulateStep();
        lastUpdateRef.current = timestamp;
      }

      animationRef.current = requestAnimationFrame(animationLoop);
    },
    [simulateStep]
  );

  const start = useCallback(() => {
    if (!simulatorRef.current?.isBurning()) return;
    setIsRunning(true);
    lastUpdateRef.current = performance.now();
    animationRef.current = requestAnimationFrame(animationLoop);
  }, [animationLoop]);

  const pause = useCallback(() => {
    setIsRunning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    pause();
    if (simulatorRef.current) {
      simulatorRef.current.reset();
      updateStats();
      setGridVersion((v) => v + 1);
    }
  }, [pause, updateStats]);

  const ignite = useCallback((x: number, y: number): boolean => {
    if (simulatorRef.current) {
      const success = simulatorRef.current.ignite(x, y);
      if (success) {
        updateStats();
        setGridVersion((v) => v + 1);
      }
      return success;
    }
    return false;
  }, [updateStats]);

  const placeFirefighter = useCallback((x: number, y: number): boolean => {
    if (simulatorRef.current) {
      const success = simulatorRef.current.placeFirefighter(x, y);
      if (success) {
        updateStats();
        setGridVersion((v) => v + 1);
      }
      return success;
    }
    return false;
  }, [updateStats]);

  const setParams = useCallback(
    (params: Partial<SimulationParams>) => {
      if (simulatorRef.current) {
        simulatorRef.current.setParams(params);
        if (params.treeDensity !== undefined) {
          simulatorRef.current.initialize(params.treeDensity);
          updateStats();
          setGridVersion((v) => v + 1);
        }
      }
    },
    [updateStats]
  );

  const getGrid = useCallback((): CellGrid | null => {
    return simulatorRef.current?.getGrid() || null;
  }, []);

  const getParams = useCallback((): SimulationParams | null => {
    return simulatorRef.current?.getParams() || null;
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    isRunning,
    stats,
    gridVersion,
    start,
    pause,
    reset,
    step: simulateStep,
    ignite,
    placeFirefighter,
    setParams,
    getGrid,
    getParams,
  };
}
