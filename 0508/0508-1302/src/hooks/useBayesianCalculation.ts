import { useState, useMemo, useCallback } from 'react';
import { BayesianParams, BayesianResult, DisplayFormat, TestResult } from '../types';
import { calculateBayesian, performIteration } from '../utils/bayesian';
import { defaultPreset } from '../data/presets';

export function useBayesianCalculation() {
  const [params, setParams] = useState<BayesianParams>({
    priorProbability: defaultPreset.priorProbability,
    sensitivity: defaultPreset.sensitivity,
    falsePositiveRate: defaultPreset.falsePositiveRate,
  });

  const [displayFormat, setDisplayFormat] = useState<DisplayFormat>('probability');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(defaultPreset.id);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testResultForIteration, setTestResultForIteration] = useState<'positive' | 'negative'>('positive');

  const result: BayesianResult = useMemo(() => {
    return calculateBayesian(params);
  }, [params]);

  const currentPrior = useMemo(() => {
    if (testResults.length === 0) {
      return params.priorProbability;
    }
    return testResults[testResults.length - 1].result.posteriorProbability;
  }, [testResults, params.priorProbability]);

  const updateParam = (key: keyof BayesianParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
    setSelectedPresetId('');
  };

  const applyPreset = (preset: BayesianParams & { id: string }) => {
    setParams({
      priorProbability: preset.priorProbability,
      sensitivity: preset.sensitivity,
      falsePositiveRate: preset.falsePositiveRate,
    });
    setSelectedPresetId(preset.id);
  };

  const addTest = useCallback(() => {
    const newTest = performIteration(
      currentPrior,
      params.sensitivity,
      params.falsePositiveRate,
      testResultForIteration,
      testResults.length + 1
    );
    setTestResults(prev => [...prev, newTest]);
  }, [currentPrior, params.sensitivity, params.falsePositiveRate, testResultForIteration, testResults.length]);

  const removeTest = useCallback((testId: string) => {
    setTestResults(prev => prev.filter(t => t.id !== testId));
  }, []);

  const clearTests = useCallback(() => {
    setTestResults([]);
  }, []);

  const resetToInitial = useCallback(() => {
    setTestResults([]);
    setParams({
      priorProbability: defaultPreset.priorProbability,
      sensitivity: defaultPreset.sensitivity,
      falsePositiveRate: defaultPreset.falsePositiveRate,
    });
    setSelectedPresetId(defaultPreset.id);
    setTestResultForIteration('positive');
  }, []);

  return {
    params,
    result,
    displayFormat,
    selectedPresetId,
    testResults,
    testResultForIteration,
    currentPrior,
    updateParam,
    setDisplayFormat,
    applyPreset,
    setTestResultForIteration,
    addTest,
    removeTest,
    clearTests,
    resetToInitial,
  };
}
