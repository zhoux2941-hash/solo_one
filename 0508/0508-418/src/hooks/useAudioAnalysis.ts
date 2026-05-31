import { useState, useRef, useCallback, useEffect } from 'react';

export interface FormantData {
  f1: number;
  f2: number;
  timestamp: number;
  confidence: number;
}

interface AudioState {
  isActive: boolean;
  isRecording: boolean;
  error: string | null;
  formantHistory: FormantData[];
  currentFormant: FormantData | null;
  waveform: number[];
  spectrum: number[];
}

const SAMPLE_RATE = 44100;
const FFT_SIZE = 2048;
const HISTORY_SIZE = 50;
const MIN_F1 = 200;
const MAX_F1 = 1000;
const MIN_F2 = 600;
const MAX_F2 = 3000;

const findPeaks = (spectrum: Float32Array, sampleRate: number): number[] => {
  const peaks: number[] = [];
  const threshold = 0.15;
  const minPeakDistance = 50;

  for (let i = 2; i < spectrum.length - 2; i++) {
    const freq = (i * sampleRate) / FFT_SIZE;

    if (freq < MIN_F1 || freq > MAX_F2) continue;

    const val = spectrum[i];
    if (
      val > threshold &&
      val > spectrum[i - 1] &&
      val > spectrum[i - 2] &&
      val > spectrum[i + 1] &&
      val > spectrum[i + 2]
    ) {
      const lastPeak = peaks[peaks.length - 1];
      if (lastPeak && Math.abs(freq - lastPeak) < minPeakDistance) {
        if (val > spectrum[Math.round((lastPeak * FFT_SIZE) / sampleRate)]) {
          peaks[peaks.length - 1] = freq;
        }
      } else {
        peaks.push(freq);
      }
    }
  }

  return peaks.sort((a, b) => b - a);
};

const smoothValue = (history: number[], newValue: number, window: number = 5): number => {
  history.push(newValue);
  if (history.length > window) history.shift();
  return history.reduce((a, b) => a + b, 0) / history.length;
};

export const useAudioAnalysis = () => {
  const [state, setState] = useState<AudioState>({
    isActive: false,
    isRecording: false,
    error: null,
    formantHistory: [],
    currentFormant: null,
    waveform: [],
    spectrum: [],
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const f1HistoryRef = useRef<number[]>([]);
  const f2HistoryRef = useRef<number[]>([]);

  const processAudio = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const spectrumData = new Float32Array(FFT_SIZE);
    const waveformData = new Float32Array(FFT_SIZE);

    const analyze = () => {
      analyser.getFloatFrequencyData(spectrumData);
      analyser.getFloatTimeDomainData(waveformData);

      const normalizedSpectrum = new Float32Array(spectrumData.length);
      for (let i = 0; i < spectrumData.length; i++) {
        normalizedSpectrum[i] = (spectrumData[i] + 100) / 100;
      }

      let rms = 0;
      for (let i = 0; i < waveformData.length; i++) {
        rms += waveformData[i] * waveformData[i];
      }
      rms = Math.sqrt(rms / waveformData.length);

      const confidence = Math.min(1, rms * 50);

      if (confidence > 0.3) {
        const peaks = findPeaks(normalizedSpectrum, SAMPLE_RATE);

        let f1 = 0;
        let f2 = 0;

        const f1Candidates = peaks.filter((f) => f >= MIN_F1 && f <= MAX_F1);
        const f2Candidates = peaks.filter((f) => f >= MIN_F2 && f <= MAX_F2 && f > (f1Candidates[0] || 500) + 200);

        if (f1Candidates.length > 0) {
          f1 = smoothValue(f1HistoryRef.current, f1Candidates[0], 8);
        }
        if (f2Candidates.length > 0) {
          f2 = smoothValue(f2HistoryRef.current, f2Candidates[0], 8);
        }

        if (f1 > 0 && f2 > 0) {
          const formant: FormantData = {
            f1: Math.round(f1),
            f2: Math.round(f2),
            timestamp: Date.now(),
            confidence,
          };

          setState((prev) => ({
            ...prev,
            currentFormant: formant,
            formantHistory: [
              ...prev.formantHistory.slice(-HISTORY_SIZE + 1),
              formant,
            ],
            waveform: Array.from(waveformData).slice(0, 200),
            spectrum: Array.from(normalizedSpectrum).slice(0, 300),
          }));
        }
      } else {
        setState((prev) => ({
          ...prev,
          waveform: Array.from(waveformData).slice(0, 200),
          spectrum: Array.from(normalizedSpectrum).slice(0, 300),
        }));
      }

      animationRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null, isRecording: true }));

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;

      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;

      const filter = audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1500;
      filter.Q.value = 0.5;

      microphone.connect(filter);
      filter.connect(analyser);

      setState((prev) => ({ ...prev, isActive: true }));
      processAudio();
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : '无法访问麦克风',
        isRecording: false,
        isActive: false,
      }));
    }
  }, [processAudio]);

  const stopRecording = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    microphoneRef.current = null;
    analyserRef.current = null;
    f1HistoryRef.current = [];
    f2HistoryRef.current = [];

    setState((prev) => ({
      ...prev,
      isActive: false,
      isRecording: false,
      currentFormant: null,
      formantHistory: [],
      waveform: [],
      spectrum: [],
    }));
  }, []);

  const toggleRecording = useCallback(() => {
    if (state.isActive) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [state.isActive, startRecording, stopRecording]);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    ...state,
    startRecording,
    stopRecording,
    toggleRecording,
  };
};
