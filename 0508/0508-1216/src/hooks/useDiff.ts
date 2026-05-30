import { useState, useMemo, useCallback } from 'react';
import type { CompareMode, CompareOptions, Diff, LineDiff } from '../types';
import { computeDiff, exportToHTML } from '../utils/diffUtils';

export function useDiff() {
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [options, setOptions] = useState<CompareOptions>({
    mode: 'char',
    ignoreWhitespace: false,
  });

  const diffs = useMemo(() => {
    return computeDiff(leftText, rightText, options);
  }, [leftText, rightText, options]);

  const swapTexts = useCallback(() => {
    setLeftText(rightText);
    setRightText(leftText);
  }, [leftText, rightText]);

  const clearAll = useCallback(() => {
    setLeftText('');
    setRightText('');
  }, []);

  const reset = useCallback(() => {
    setLeftText('');
    setRightText('');
    setOptions({ mode: 'char', ignoreWhitespace: false });
  }, []);

  const setMode = useCallback((mode: CompareMode) => {
    setOptions(prev => ({ ...prev, mode }));
  }, []);

  const setIgnoreWhitespace = useCallback((ignoreWhitespace: boolean) => {
    setOptions(prev => ({ ...prev, ignoreWhitespace }));
  }, []);

  const handleFileUpload = useCallback(async (file: File, target: 'left' | 'right') => {
    try {
      const text = await file.text();
      if (target === 'left') {
        setLeftText(text);
      } else {
        setRightText(text);
      }
    } catch {
      alert('无法读取文件内容');
    }
  }, []);

  const handleExport = useCallback(() => {
    const html = exportToHTML(leftText, rightText, options);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diff-report-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [leftText, rightText, options]);

  return {
    leftText,
    rightText,
    options,
    diffs: diffs as Diff[] | LineDiff[],
    setLeftText,
    setRightText,
    setMode,
    setIgnoreWhitespace,
    swapTexts,
    clearAll,
    reset,
    handleFileUpload,
    handleExport,
  };
}
