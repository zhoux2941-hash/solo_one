let audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export function playSingleBellSound() {
  const ctx = getAudioCtx()
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, now)
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.1)

  gain.gain.setValueAtTime(0.6, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 2.0)

  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(1320, now)
  osc2.frequency.exponentialRampToValueAtTime(660, now + 0.05)
  gain2.gain.setValueAtTime(0.2, now)
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.0)
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.start(now)
  osc2.stop(now + 1.0)
}

export function playSingleDrumSound() {
  const ctx = getAudioCtx()
  const now = ctx.currentTime

  const bufferSize = ctx.sampleRate * 0.3
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04))
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buffer

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(300, now)
  filter.frequency.exponentialRampToValueAtTime(80, now + 0.2)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.8, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  noise.start(now)

  const osc = ctx.createOscillator()
  const oscGain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(120, now)
  osc.frequency.exponentialRampToValueAtTime(50, now + 0.15)
  oscGain.gain.setValueAtTime(0.5, now)
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
  osc.connect(oscGain)
  oscGain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.3)
}

export function playBellSound(count: number, onDone?: () => void) {
  const interval = Math.max(300, 1200 - count * 8)
  let played = 0

  function playOne() {
    if (played >= count) {
      onDone?.()
      return
    }
    playSingleBellSound()
    played++
    if (played < count) {
      setTimeout(playOne, interval)
    } else {
      setTimeout(() => onDone?.(), interval)
    }
  }

  playOne()
}

export function playDrumSound(count: number, onDone?: () => void) {
  const interval = Math.max(250, 900 - count * 6)
  let played = 0

  function playOne() {
    if (played >= count) {
      onDone?.()
      return
    }
    playSingleDrumSound()
    played++
    if (played < count) {
      setTimeout(playOne, interval)
    } else {
      setTimeout(() => onDone?.(), interval)
    }
  }

  playOne()
}
