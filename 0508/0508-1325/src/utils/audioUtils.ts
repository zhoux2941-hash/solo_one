let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

export function playDingSound(): void {
  const ctx = getAudioContext();
  
  const oscillator1 = ctx.createOscillator();
  const oscillator2 = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  oscillator1.type = 'sine';
  oscillator1.frequency.setValueAtTime(880, ctx.currentTime);
  oscillator1.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
  
  oscillator2.type = 'sine';
  oscillator2.frequency.setValueAtTime(1320, ctx.currentTime);
  oscillator2.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.5);
  
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, ctx.currentTime);
  
  gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
  
  oscillator1.connect(filter);
  oscillator2.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator1.start(ctx.currentTime);
  oscillator2.start(ctx.currentTime);
  oscillator1.stop(ctx.currentTime + 0.8);
  oscillator2.stop(ctx.currentTime + 0.8);
}

export function playThrowSound(): void {
  const ctx = getAudioContext();
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(300, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
  
  gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.3);
}

export function playMissSound(): void {
  const ctx = getAudioContext();
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(200, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
  
  gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.3);
}
