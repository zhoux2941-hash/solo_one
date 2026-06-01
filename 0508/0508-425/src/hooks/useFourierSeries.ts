import { useState, useMemo, useCallback } from 'react';
import type { WaveformType, HarmonicData, GibbsData } from '../types';
import {
  generateHarmonics,
  generateWaveformPoints,
  calculateGibbsPhenomenon,
} from '../utils/fourierCalculations';

export function useFourierSeries() {
  const [harmonicCount, setHarmonicCount] = useState<number>(5);
  const [waveformType, setWaveformType] = useState<WaveformType>('square');
  const [showIndividualHarmonics, setShowIndividualHarmonics] = useState<boolean>(true);
  const [animationPhase, setAnimationPhase] = useState<number>(0);

  const harmonics = useMemo(() => {
    return generateHarmonics(harmonicCount, waveformType);
  }, [harmonicCount, waveformType]);

  const waveformPoints = useMemo(() => {
    return generateWaveformPoints(harmonics, 1000, [0, 4 * Math.PI]);
  }, [harmonics]);

  const gibbsData = useMemo(() => {
    return calculateGibbsPhenomenon(waveformPoints.y, waveformType);
  }, [waveformPoints, waveformType]);

  const getPartialHarmonics = useCallback((upTo: number): HarmonicData[] => {
    return harmonics.slice(0, upTo);
  }, [harmonics]);

  const getPartialWaveform = useCallback((upTo: number) => {
    const partialHarmonics = harmonics.slice(0, upTo);
    return generateWaveformPoints(partialHarmonics, 500, [0, 4 * Math.PI]);
  }, [harmonics]);

  const updateAnimationPhase = useCallback((phase: number) => {
    setAnimationPhase(phase % (2 * Math.PI));
  }, []);

  return {
    harmonicCount,
    setHarmonicCount,
    waveformType,
    setWaveformType,
    showIndividualHarmonics,
    setShowIndividualHarmonics,
    harmonics,
    waveformPoints,
    gibbsData,
    animationPhase,
    updateAnimationPhase,
    getPartialHarmonics,
    getPartialWaveform,
  };
}
