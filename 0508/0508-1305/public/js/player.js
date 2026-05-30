const AudioPlayer = {
  audioContext: null,
  masterGain: null,
  isPlaying: false,
  currentTimeouts: [],
  activeOscillators: [],
  tuningSystem: 'pythagorean',
  rootNote: 'C4',
  rootFreq: null,
  rootMidi: null,

  init() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.audioContext.destination);
  },

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  },

  setTuningSystem(tuningSystem) {
    this.tuningSystem = tuningSystem;
  },

  setRootNote(rootNote) {
    this.rootNote = rootNote;
    this.rootMidi = TuningSystem.noteToMidi(rootNote);
    this.rootFreq = TuningSystem.noteToFrequency(rootNote);
  },

  getFrequency(midi) {
    const semitones = midi - this.rootMidi;
    const ratio = TuningSystem.getRatio(semitones, this.tuningSystem);
    return this.rootFreq * ratio;
  },

  playNote(frequency, duration = 0.5, startTime = 0) {
    if (!this.audioContext) this.init();
    
    const now = this.audioContext.currentTime;
    const startAt = now + startTime;
    const endAt = startAt + duration;
    
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.value = frequency;
    
    osc2.type = 'sine';
    osc2.frequency.value = frequency * 2;
    
    const osc2Gain = this.audioContext.createGain();
    osc2Gain.gain.value = 0.2;
    
    gainNode.gain.setValueAtTime(0, startAt);
    gainNode.gain.linearRampToValueAtTime(0.5, startAt + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, endAt);
    
    osc1.connect(gainNode);
    osc2.connect(osc2Gain);
    osc2Gain.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    osc1.start(startAt);
    osc2.start(startAt);
    osc1.stop(endAt + 0.1);
    osc2.stop(endAt + 0.1);
    
    this.activeOscillators.push(osc1, osc2);
    
    return { osc1, osc2, gainNode };
  },

  async playScale(scale, onNotePlay, onComplete) {
    if (this.isPlaying) return;
    
    this.resume();
    this.isPlaying = true;
    
    const noteDuration = 0.5;
    const gap = 0.05;
    
    for (let i = 0; i < scale.length; i++) {
      if (!this.isPlaying) break;
      
      const note = scale[i];
      
      const timeout = setTimeout(() => {
        if (this.isPlaying) {
          this.playNote(note.frequency, noteDuration);
          if (onNotePlay) onNotePlay(note, i);
        }
      }, i * (noteDuration + gap) * 1000);
      
      this.currentTimeouts.push(timeout);
    }
    
    const totalTime = scale.length * (noteDuration + gap) * 1000;
    
    const completeTimeout = setTimeout(() => {
      this.isPlaying = false;
      if (onComplete) onComplete();
    }, totalTime);
    
    this.currentTimeouts.push(completeTimeout);
  },

  stop() {
    this.isPlaying = false;
    
    this.currentTimeouts.forEach(timeout => clearTimeout(timeout));
    this.currentTimeouts = [];
    
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {}
    });
    this.activeOscillators = [];
    
    if (PianoKeyboard) {
      PianoKeyboard.clearActiveKey();
    }
  },

  playChord(frequencies, duration = 1) {
    if (!this.audioContext) this.init();
    this.resume();
    
    const now = this.audioContext.currentTime;
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
    gainNode.connect(this.masterGain);
    
    frequencies.forEach(freq => {
      const osc = this.audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + duration + 0.1);
      
      this.activeOscillators.push(osc);
    });
  },

  async playTetrachord(notes, onNotePlay, onComplete) {
    if (this.isPlaying) return;
    
    this.resume();
    this.isPlaying = true;
    
    const noteDuration = 0.4;
    const gap = 0.05;
    
    for (let i = 0; i < notes.length; i++) {
      if (!this.isPlaying) break;
      
      const note = notes[i];
      const freq = this.getFrequency(note.midi);
      
      const timeout = setTimeout(() => {
        if (this.isPlaying) {
          this.playNote(freq, noteDuration);
          if (onNotePlay) onNotePlay(note, i);
        }
      }, i * (noteDuration + gap) * 1000);
      
      this.currentTimeouts.push(timeout);
    }
    
    const totalTime = notes.length * (noteDuration + gap) * 1000;
    
    const completeTimeout = setTimeout(() => {
      this.isPlaying = false;
      if (onComplete) onComplete();
    }, totalTime);
    
    this.currentTimeouts.push(completeTimeout);
  },

  getTuningDeviation(midi) {
    const equalFreq = 440 * Math.pow(2, (midi - 69) / 12);
    const tunedFreq = this.getFrequency(midi);
    const cents = 1200 * Math.log2(tunedFreq / equalFreq);
    return cents;
  }
};
