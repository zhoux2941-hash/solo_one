import { useState, useCallback, useRef, useEffect } from 'react';
import type { AudioPlayer } from '@/types';

export function useAudioPlayer(wpm: number, frequency: number): AudioPlayer {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const play = useCallback(async (morseCode: string) => {
    if (!morseCode.trim()) return;
    
    stop();
    setIsPlaying(true);

    const dotDuration = 60 / (wpm * 50) * 1000;
    const dashDuration = dotDuration * 3;
    const interSymbolGap = dotDuration;
    const interCharGap = dotDuration * 3;
    const interWordGap = dotDuration * 7;

    const ctx = getAudioContext();
    let currentTime = ctx.currentTime;

    const playTone = (duration: number) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.5, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration / 1000);
      
      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration / 1000);
    };

    const parts = morseCode.split(' ');
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (part === '/') {
        currentTime += interWordGap / 1000;
      } else {
        const symbols = part.split('');
        for (let j = 0; j < symbols.length; j++) {
          const symbol = symbols[j];
          if (symbol === '.') {
            playTone(dotDuration);
            currentTime += dotDuration / 1000;
          } else if (symbol === '-') {
            playTone(dashDuration);
            currentTime += dashDuration / 1000;
          }
          
          if (j < symbols.length - 1) {
            currentTime += interSymbolGap / 1000;
          }
        }
        
        if (i < parts.length - 1 && parts[i + 1] !== '/') {
          currentTime += interCharGap / 1000;
        }
      }
    }

    await new Promise(resolve => {
      timeoutRef.current = setTimeout(() => {
        setIsPlaying(false);
        resolve(undefined);
      }, (currentTime - ctx.currentTime) * 1000 + 100);
    });
  }, [wpm, frequency, stop, getAudioContext]);

  return { play, stop, isPlaying };
}
