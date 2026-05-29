import { useState, useCallback } from 'react';

interface UseCopyToClipboardResult {
  copied: boolean;
  copy: (text: string) => Promise<void>;
  error: Error | null;
}

export const useCopyToClipboard = (): UseCopyToClipboardResult => {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copy = useCallback(async (text: string) => {
    try {
      if (!navigator.clipboard) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setError(null);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to copy'));
      setCopied(false);
    }
  }, []);

  return { copied, copy, error };
};
