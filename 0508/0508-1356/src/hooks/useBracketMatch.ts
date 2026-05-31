import { useState, useCallback } from 'react';
import { matchBrackets, type BracketResult } from '@/utils/bracketMatcher';

export function useBracketMatch() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<BracketResult | null>(null);

  const calculate = useCallback(() => {
    const res = matchBrackets(input);
    setResult(res);
    return res;
  }, [input]);

  const setExample = useCallback((example: string) => {
    setInput(example);
    setResult(null);
  }, []);

  const reset = useCallback(() => {
    setInput('');
    setResult(null);
  }, []);

  return {
    input,
    setInput,
    result,
    calculate,
    setExample,
    reset,
  };
}
