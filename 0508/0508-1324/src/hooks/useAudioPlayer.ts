import { useState, useEffect, useRef, useCallback } from 'react';
import type { Song } from '@/types';
import { createSongAudioBuffers } from '@/utils/audio';

interface UseAudioPlayerOptions {
  song: Song | null;
  highVolume: number;
  lowVolume: number;
  onTimeUpdate?: (time: number) => void;
}

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  isLoading: boolean;
  highAnalyser: AnalyserNode | null;
  lowAnalyser: AnalyserNode | null;
}

export const useAudioPlayer = ({
  song,
  highVolume,
  lowVolume,
  onTimeUpdate,
}: UseAudioPlayerOptions): UseAudioPlayerReturn => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const highSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const lowSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const highGainRef = useRef<GainNode | null>(null);
  const lowGainRef = useRef<GainNode | null>(null);
  const highAnalyserRef = useRef<AnalyserNode | null>(null);
  const lowAnalyserRef = useRef<AnalyserNode | null>(null);
  const highBufferRef = useRef<AudioBuffer | null>(null);
  const lowBufferRef = useRef<AudioBuffer | null>(null);

  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const loadBuffers = useCallback(async () => {
    if (!song) return;

    setIsLoading(true);
    try {
      const ctx = getAudioContext();
      const { highBuffer, lowBuffer } = await createSongAudioBuffers(ctx, song);
      highBufferRef.current = highBuffer;
      lowBufferRef.current = lowBuffer;
    } catch (error) {
      console.error('Failed to load audio buffers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [song, getAudioContext]);

  useEffect(() => {
    loadBuffers();
    return () => {
      stopPlayback();
      pauseTimeRef.current = 0;
      setCurrentTime(0);
    };
  }, [loadBuffers]);

  useEffect(() => {
    if (highGainRef.current) {
      highGainRef.current.gain.setValueAtTime(highVolume, getAudioContext().currentTime);
    }
    if (lowGainRef.current) {
      lowGainRef.current.gain.setValueAtTime(lowVolume, getAudioContext().currentTime);
    }
  }, [highVolume, lowVolume, getAudioContext]);

  const stopPlayback = useCallback(() => {
    if (highSourceRef.current) {
      try { highSourceRef.current.stop(); } catch (e) {}
      highSourceRef.current.disconnect();
      highSourceRef.current = null;
    }
    if (lowSourceRef.current) {
      try { lowSourceRef.current.stop(); } catch (e) {}
      lowSourceRef.current.disconnect();
      lowSourceRef.current = null;
    }
    if (highGainRef.current) {
      highGainRef.current.disconnect();
      highGainRef.current = null;
    }
    if (lowGainRef.current) {
      lowGainRef.current.disconnect();
      lowGainRef.current = null;
    }
    if (highAnalyserRef.current) {
      highAnalyserRef.current.disconnect();
      highAnalyserRef.current = null;
    }
    if (lowAnalyserRef.current) {
      lowAnalyserRef.current.disconnect();
      lowAnalyserRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsPlaying(false);
  }, []);

  const updateTime = useCallback(() => {
    if (!audioContextRef.current || !startTimeRef.current) return;

    const elapsed = audioContextRef.current.currentTime - startTimeRef.current + pauseTimeRef.current;
    const clampedTime = Math.min(elapsed, song?.duration || 0);
    setCurrentTime(clampedTime);
    onTimeUpdate?.(clampedTime);

    if (clampedTime < (song?.duration || 0)) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    } else {
      stopPlayback();
      pauseTimeRef.current = 0;
      setCurrentTime(0);
    }
  }, [song, onTimeUpdate, stopPlayback]);

  const play = useCallback(() => {
    if (!song || !highBufferRef.current || !lowBufferRef.current) return;

    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    stopPlayback();

    const highSource = ctx.createBufferSource();
    const lowSource = ctx.createBufferSource();
    const highGain = ctx.createGain();
    const lowGain = ctx.createGain();
    const highAnalyser = ctx.createAnalyser();
    const lowAnalyser = ctx.createAnalyser();

    highAnalyser.fftSize = 256;
    lowAnalyser.fftSize = 256;

    highSource.buffer = highBufferRef.current;
    lowSource.buffer = lowBufferRef.current;

    highGain.gain.setValueAtTime(highVolume, ctx.currentTime);
    lowGain.gain.setValueAtTime(lowVolume, ctx.currentTime);

    highSource.connect(highGain);
    highGain.connect(highAnalyser);
    highAnalyser.connect(ctx.destination);

    lowSource.connect(lowGain);
    lowGain.connect(lowAnalyser);
    lowAnalyser.connect(ctx.destination);

    highSourceRef.current = highSource;
    lowSourceRef.current = lowSource;
    highGainRef.current = highGain;
    lowGainRef.current = lowGain;
    highAnalyserRef.current = highAnalyser;
    lowAnalyserRef.current = lowAnalyser;

    const offset = pauseTimeRef.current;
    highSource.start(0, offset);
    lowSource.start(0, offset);
    startTimeRef.current = ctx.currentTime;

    setIsPlaying(true);
    updateTime();
  }, [song, highVolume, lowVolume, getAudioContext, stopPlayback, updateTime]);

  const pause = useCallback(() => {
    if (!isPlaying) return;

    stopPlayback();
    if (audioContextRef.current && startTimeRef.current) {
      pauseTimeRef.current = audioContextRef.current.currentTime - startTimeRef.current + pauseTimeRef.current;
    }
  }, [isPlaying, stopPlayback]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    const wasPlaying = isPlaying;
    pauseTimeRef.current = Math.max(0, Math.min(time, song?.duration || 0));
    setCurrentTime(pauseTimeRef.current);
    if (wasPlaying) {
      stopPlayback();
      play();
    }
  }, [song, isPlaying, play, stopPlayback]);

  useEffect(() => {
    return () => {
      stopPlayback();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [stopPlayback]);

  return {
    isPlaying,
    currentTime,
    duration: song?.duration || 0,
    play,
    pause,
    togglePlay,
    seek,
    isLoading,
    highAnalyser: highAnalyserRef.current,
    lowAnalyser: lowAnalyserRef.current,
  };
};
