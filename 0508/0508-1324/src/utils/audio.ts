import type { Song } from '@/types';

const NOTE_FREQUENCIES = [
  1.0, 1.05946, 1.12246, 1.18921, 1.25992, 1.33484, 1.41421,
  1.49831, 1.58740, 1.68179, 1.78180, 1.88775, 2.0,
];

export const generateNoteFrequency = (baseFreq: number, semitoneOffset: number): number => {
  const octaveShift = Math.floor(semitoneOffset / 12);
  const noteIndex = ((semitoneOffset % 12) + 12) % 12;
  return baseFreq * NOTE_FREQUENCIES[noteIndex] * Math.pow(2, octaveShift);
};

export const generateVoiceBuffer = (
  audioContext: AudioContext,
  baseFrequency: number,
  entryTime: number,
  pattern: number[],
  duration: number,
  noteDuration: number = 0.5,
): AudioBuffer => {
  const sampleRate = audioContext.sampleRate;
  const totalSamples = Math.floor(duration * sampleRate);
  const buffer = audioContext.createBuffer(1, totalSamples, sampleRate);
  const channelData = buffer.getChannelData(0);

  const entrySample = Math.floor(entryTime * sampleRate);
  const noteSamples = Math.floor(noteDuration * sampleRate);

  for (let i = 0; i < totalSamples; i++) {
    if (i < entrySample) {
      channelData[i] = 0;
      continue;
    }

    const relativeSample = i - entrySample;
    const patternIndex = Math.floor(relativeSample / noteSamples) % pattern.length;
    const semitoneOffset = pattern[patternIndex];
    const frequency = generateNoteFrequency(baseFrequency, semitoneOffset);

    const noteProgress = (relativeSample % noteSamples) / noteSamples;
    const envelope = Math.sin(noteProgress * Math.PI);
    const sample = Math.sin(2 * Math.PI * frequency * (i / sampleRate)) * envelope * 0.3;

    const harmonic2 = Math.sin(4 * Math.PI * frequency * (i / sampleRate)) * envelope * 0.1;
    const harmonic3 = Math.sin(6 * Math.PI * frequency * (i / sampleRate)) * envelope * 0.05;

    channelData[i] = sample + harmonic2 + harmonic3;
  }

  return buffer;
};

export const createVoiceOscillator = (
  audioContext: AudioContext,
  frequency: number,
  type: OscillatorType = 'sine',
): { oscillator: OscillatorNode; gainNode: GainNode } => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);

  oscillator.connect(gainNode);

  return { oscillator, gainNode };
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getDialectName = (dialect: string): string => {
  const names: Record<string, string> = {
    sanjiang: '三江',
    congjiang: '从江',
    liping: '黎平',
  };
  return names[dialect] || dialect;
};

export const getVoicePartName = (part: string): string => {
  return part === 'high' ? '高音部' : '低音部';
};

export const getModeName = (mode: string): string => {
  return mode === 'entry' ? '声部先进入' : '主要旋律';
};

export const createSongAudioBuffers = async (
  audioContext: AudioContext,
  song: Song,
): Promise<{ highBuffer: AudioBuffer; lowBuffer: AudioBuffer }> => {
  const { highVoice, lowVoice } = song.audioConfig;

  const highBuffer = generateVoiceBuffer(
    audioContext,
    highVoice.baseFrequency,
    highVoice.entryTime,
    highVoice.pattern,
    song.duration,
    0.6,
  );

  const lowBuffer = generateVoiceBuffer(
    audioContext,
    lowVoice.baseFrequency,
    lowVoice.entryTime,
    lowVoice.pattern,
    song.duration,
    0.8,
  );

  return { highBuffer, lowBuffer };
};
