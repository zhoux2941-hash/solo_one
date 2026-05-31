import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { BPM } from '@/constants/game';

export function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextBeatTimeRef = useRef<number>(0);
  const schedulerTimerRef = useRef<number | null>(null);
  const { isPlaying, isPaused, startTime } = useGameStore();

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const playClick = useCallback((time: number, isAccent: boolean = false) => {
    if (!audioContextRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();

    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);

    osc.frequency.value = isAccent ? 1000 : 800;
    osc.type = 'sine';

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduleBeats = useCallback(() => {
    if (!audioContextRef.current || !isPlaying || isPaused) return;

    const beatInterval = 60 / BPM;
    const currentAudioTime = audioContextRef.current.currentTime;
    const scheduleAheadTime = 0.1;

    while (nextBeatTimeRef.current < currentAudioTime + scheduleAheadTime) {
      const beatNumber = Math.floor(
        (nextBeatTimeRef.current - (startTime / 1000 - currentAudioTime)) / beatInterval
      );
      const isAccent = beatNumber % 4 === 0;
      playClick(nextBeatTimeRef.current, isAccent);
      nextBeatTimeRef.current += beatInterval;
    }

    schedulerTimerRef.current = window.setTimeout(scheduleBeats, 25);
  }, [isPlaying, isPaused, startTime, playClick]);

  useEffect(() => {
    if (isPlaying && !isPaused) {
      initAudioContext();
      if (audioContextRef.current) {
        nextBeatTimeRef.current = audioContextRef.current.currentTime + 0.1;
        scheduleBeats();
      }
    } else {
      if (schedulerTimerRef.current) {
        clearTimeout(schedulerTimerRef.current);
        schedulerTimerRef.current = null;
      }
    }

    return () => {
      if (schedulerTimerRef.current) {
        clearTimeout(schedulerTimerRef.current);
      }
    };
  }, [isPlaying, isPaused, initAudioContext, scheduleBeats]);

  const playJudgeSound = useCallback((type: 'perfect' | 'good' | 'miss') => {
    if (!audioContextRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();

    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);

    const frequencies = {
      perfect: 1200,
      good: 900,
      miss: 300,
    };

    osc.frequency.value = frequencies[type];
    osc.type = type === 'miss' ? 'square' : 'sine';

    const now = audioContextRef.current.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.2);
  }, []);

  return { initAudioContext, playJudgeSound };
}
