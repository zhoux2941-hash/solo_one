import { useCallback, useRef, useEffect } from 'react';

export const useSpeech = () => {
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      initializedRef.current = true;
    }
  }, []);

  const speak = useCallback((text: string, lang: string = 'zh-CN') => {
    if (!synthRef.current || !initializedRef.current) {
      console.warn('Speech synthesis not supported');
      return;
    }

    try {
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1;

      const voices = synthRef.current.getVoices();
      const chineseVoice = voices.find(v => v.lang.includes('zh'));
      if (chineseVoice) {
        utterance.voice = chineseVoice;
      }

      synthRef.current.speak(utterance);
    } catch (error) {
      console.error('Speech error:', error);
    }
  }, []);

  const speakCorrect = useCallback(() => {
    speak('正确！');
  }, [speak]);

  const speakWrong = useCallback(() => {
    speak('再试试');
  }, [speak]);

  const speakNumber = useCallback((num: number) => {
    speak(num.toString());
  }, [speak]);

  const speakFormula = useCallback((formula: string) => {
    speak(formula);
  }, [speak]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  }, []);

  return {
    speak,
    speakCorrect,
    speakWrong,
    speakNumber,
    speakFormula,
    stop,
    isSupported: initializedRef.current,
  };
};
