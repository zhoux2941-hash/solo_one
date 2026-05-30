const PianoKeyboard = {
  container: null,
  startMidi: 48,
  endMidi: 84,
  whiteKeyWidth: 35,
  blackKeyWidth: 22,
  whiteKeyHeight: 150,
  blackKeyHeight: 95,
  highlightedKeys: new Set(),
  activeKey: null,

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.render();
  },

  isBlackKey(midi) {
    const pitchClass = midi % 12;
    return [1, 3, 6, 8, 10].includes(pitchClass);
  },

  getWhiteKeyIndex(midi) {
    const pitchClass = midi % 12;
    const octave = Math.floor(midi / 12);
    const whitePitchClasses = [0, 2, 4, 5, 7, 9, 11];
    const indexInOctave = whitePitchClasses.indexOf(pitchClass);
    if (indexInOctave === -1) return -1;
    return octave * 7 + indexInOctave;
  },

  getBlackKeyOffset(midi) {
    const pitchClass = midi % 12;
    const offsets = { 1: 0.65, 3: 1.75, 6: 3.55, 8: 4.65, 10: 5.75 };
    return offsets[pitchClass] || 0;
  },

  render() {
    if (!this.container) return;
    
    this.container.innerHTML = '';
    
    const totalWhiteKeys = this.getWhiteKeyIndex(this.endMidi) - this.getWhiteKeyIndex(this.startMidi) + 1;
    const width = totalWhiteKeys * this.whiteKeyWidth;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', this.whiteKeyHeight);
    svg.setAttribute('class', 'piano-keyboard');
    svg.setAttribute('viewBox', `0 0 ${width} ${this.whiteKeyHeight}`);
    
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <linearGradient id="whiteKeyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#e8e8e8;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="blackKeyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#4a4a4a;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#ffd700;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#ff8c00;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="activeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#00ff88;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#00cc66;stop-opacity:1" />
      </linearGradient>
    `;
    svg.appendChild(defs);
    
    const startWhiteIndex = this.getWhiteKeyIndex(this.startMidi);
    
    for (let midi = this.startMidi; midi <= this.endMidi; midi++) {
      if (!this.isBlackKey(midi)) {
        const keyIndex = this.getWhiteKeyIndex(midi) - startWhiteIndex;
        const x = keyIndex * this.whiteKeyWidth;
        
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', 0);
        rect.setAttribute('width', this.whiteKeyWidth - 1);
        rect.setAttribute('height', this.whiteKeyHeight);
        rect.setAttribute('rx', 3);
        rect.setAttribute('ry', 3);
        rect.setAttribute('class', 'piano-key white-key');
        rect.setAttribute('data-midi', midi);
        rect.setAttribute('fill', 'url(#whiteKeyGradient)');
        rect.setAttribute('stroke', '#999');
        rect.setAttribute('stroke-width', '1');
        
        const label = this.getKeyLabel(midi);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + this.whiteKeyWidth / 2);
        text.setAttribute('y', this.whiteKeyHeight - 10);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '10');
        text.setAttribute('fill', '#666');
        text.setAttribute('class', 'key-label');
        text.textContent = label;
        
        svg.appendChild(rect);
        svg.appendChild(text);
      }
    }
    
    for (let midi = this.startMidi; midi <= this.endMidi; midi++) {
      if (this.isBlackKey(midi)) {
        const prevWhiteMidi = midi - 1;
        const prevWhiteIndex = this.getWhiteKeyIndex(prevWhiteMidi) - startWhiteIndex;
        const offset = this.getBlackKeyOffset(midi);
        const x = (prevWhiteIndex + offset) * this.whiteKeyWidth;
        
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', 0);
        rect.setAttribute('width', this.blackKeyWidth);
        rect.setAttribute('height', this.blackKeyHeight);
        rect.setAttribute('rx', 2);
        rect.setAttribute('ry', 2);
        rect.setAttribute('class', 'piano-key black-key');
        rect.setAttribute('data-midi', midi);
        rect.setAttribute('fill', 'url(#blackKeyGradient)');
        rect.setAttribute('stroke', '#000');
        rect.setAttribute('stroke-width', '1');
        
        const label = this.getKeyLabel(midi);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + this.blackKeyWidth / 2);
        text.setAttribute('y', this.blackKeyHeight - 8);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '8');
        text.setAttribute('fill', '#ccc');
        text.setAttribute('class', 'key-label');
        text.textContent = label;
        
        svg.appendChild(rect);
        svg.appendChild(text);
      }
    }
    
    this.container.appendChild(svg);
    this.svg = svg;
  },

  getKeyLabel(midi) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const pitchClass = midi % 12;
    return noteNames[pitchClass] + octave;
  },

  highlightKeys(midiNotes) {
    this.clearHighlight();
    this.highlightedKeys = new Set(midiNotes);
    
    if (!this.svg) return;
    
    const keys = this.svg.querySelectorAll('.piano-key');
    keys.forEach(key => {
      const midi = parseInt(key.getAttribute('data-midi'));
      if (this.highlightedKeys.has(midi)) {
        if (key.classList.contains('white-key')) {
          key.setAttribute('fill', 'url(#highlightGradient)');
          key.setAttribute('stroke', '#ff6600');
        } else {
          key.setAttribute('fill', 'url(#highlightGradient)');
          key.setAttribute('stroke', '#ff6600');
        }
      }
    });
    
    this.updateDegreeLabels(midiNotes);
  },

  updateDegreeLabels(midiNotes) {
    const labels = this.svg.querySelectorAll('.degree-label');
    labels.forEach(label => label.remove());
    
    const startWhiteIndex = this.getWhiteKeyIndex(this.startMidi);
    const rootMidi = midiNotes[0];
    
    midiNotes.forEach((midi, index) => {
      const isBlack = this.isBlackKey(midi);
      const degree = index + 1;
      
      let x, y;
      if (isBlack) {
        const prevWhiteMidi = midi - 1;
        const prevWhiteIndex = this.getWhiteKeyIndex(prevWhiteMidi) - startWhiteIndex;
        const offset = this.getBlackKeyOffset(midi);
        x = (prevWhiteIndex + offset) * this.whiteKeyWidth + this.blackKeyWidth / 2;
        y = this.blackKeyHeight + 20;
      } else {
        const keyIndex = this.getWhiteKeyIndex(midi) - startWhiteIndex;
        x = keyIndex * this.whiteKeyWidth + this.whiteKeyWidth / 2;
        y = this.whiteKeyHeight - 35;
      }
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('fill', degree === 1 || degree === 8 ? '#cc0000' : '#0066cc');
      text.setAttribute('class', 'degree-label');
      text.textContent = degree === 8 ? '8°' : `${degree}°`;
      
      this.svg.appendChild(text);
    });
  },

  setActiveKey(midi) {
    if (!this.svg) return;
    
    if (this.activeKey !== null) {
      const prevKey = this.svg.querySelector(`[data-midi="${this.activeKey}"]`);
      if (prevKey) {
        if (this.highlightedKeys.has(this.activeKey)) {
          prevKey.setAttribute('fill', 'url(#highlightGradient)');
        } else {
          if (prevKey.classList.contains('white-key')) {
            prevKey.setAttribute('fill', 'url(#whiteKeyGradient)');
          } else {
            prevKey.setAttribute('fill', 'url(#blackKeyGradient)');
          }
        }
      }
    }
    
    this.activeKey = midi;
    const key = this.svg.querySelector(`[data-midi="${midi}"]`);
    if (key) {
      key.setAttribute('fill', 'url(#activeGradient)');
    }
  },

  clearActiveKey() {
    if (this.activeKey === null || !this.svg) return;
    
    const key = this.svg.querySelector(`[data-midi="${this.activeKey}"]`);
    if (key) {
      if (this.highlightedKeys.has(this.activeKey)) {
        key.setAttribute('fill', 'url(#highlightGradient)');
      } else {
        if (key.classList.contains('white-key')) {
          key.setAttribute('fill', 'url(#whiteKeyGradient)');
        } else {
          key.setAttribute('fill', 'url(#blackKeyGradient)');
        }
      }
    }
    this.activeKey = null;
  },

  clearHighlight() {
    if (!this.svg) return;
    
    const keys = this.svg.querySelectorAll('.piano-key');
    keys.forEach(key => {
      if (key.classList.contains('white-key')) {
        key.setAttribute('fill', 'url(#whiteKeyGradient)');
        key.setAttribute('stroke', '#999');
      } else {
        key.setAttribute('fill', 'url(#blackKeyGradient)');
        key.setAttribute('stroke', '#000');
      }
    });
    
    const labels = this.svg.querySelectorAll('.degree-label');
    labels.forEach(label => label.remove());
    
    this.highlightedKeys.clear();
    this.activeKey = null;
  }
};
