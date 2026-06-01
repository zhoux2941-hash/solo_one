import { useState, useRef, useCallback, useEffect } from 'react';
import type { HarmonicData } from '../types';

export function useAudioSynthesizer(baseFrequency: number = 220) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.3);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainsRef = useRef<GainNode[]>([]);
  const masterGainRef = useRef<GainNode | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.gain.value = volume;
      masterGainRef.current.connect(audioContextRef.current.destination);
    }
    return audioContextRef.current;
  }, [volume]);

  const stopAllOscillators = useCallback(() => {
    oscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
      } catch (e) {}
    });
    oscillatorsRef.current = [];
    gainsRef.current = [];
  }, []);

  const playHarmonics = useCallback((harmonics: HarmonicData[]) => {
    const ctx = initAudioContext();
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    stopAllOscillators();
    
    if (!masterGainRef.current) return;
    
    harmonics.forEach((harmonic) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = baseFrequency * harmonic.frequency;
      
      const gainValue = Math.abs(harmonic.amplitude) * 0.5;
      gain.gain.value = gainValue;
      
      osc.connect(gain);
      gain.connect(masterGainRef.current);
      
      osc.start();
      
      oscillatorsRef.current.push(osc);
      gainsRef.current.push(gain);
    });
    
    setIsPlaying(true);
  }, [initAudioContext, stopAllOscillators, baseFrequency]);

  const stop = useCallback(() => {
    stopAllOscillators();
    setIsPlaying(false);
  }, [stopAllOscillators]);

  const toggle = useCallback((harmonics: HarmonicData[]) => {
    if (isPlaying) {
      stop();
    } else {
      playHarmonics(harmonics);
    }
  }, [isPlaying, playHarmonics, stop]);

  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume;
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      stopAllOscillators();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopAllOscillators]);

  return {
    isPlaying,
    volume,
    setVolume,
    playHarmonics,
    stop,
    toggle,
  };
}
