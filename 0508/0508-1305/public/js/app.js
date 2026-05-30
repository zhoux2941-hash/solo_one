const App = {
  modes: [],
  currentMode: null,
  currentScale: null,
  semitonePattern: [],
  VF: null,
  renderer: null,
  context: null,

  async init() {
    this.VF = typeof Vex !== 'undefined' ? Vex.Flow : (typeof VexFlow !== 'undefined' ? VexFlow : null);
    if (!this.VF) {
      console.error('VexFlow library not loaded correctly');
    }
    PianoKeyboard.init('piano-container');
    AudioPlayer.init();
    
    this.bindEvents();
    await this.loadModes();
    this.renderNotation();
  },

  bindEvents() {
    document.getElementById('mode-select').addEventListener('change', (e) => {
      const modeId = e.target.value;
      if (modeId) {
        this.loadMode(modeId);
      } else {
        this.clearDisplay();
      }
    });

    document.getElementById('root-select').addEventListener('change', (e) => {
      const rootNote = e.target.value;
      AudioPlayer.setRootNote(rootNote);
      if (this.currentMode) {
        this.updateScale();
      }
    });

    document.getElementById('tuning-select').addEventListener('change', (e) => {
      const tuning = e.target.value;
      AudioPlayer.setTuningSystem(tuning);
      if (this.currentMode) {
        this.updateScale();
      }
    });

    document.getElementById('play-btn').addEventListener('click', () => {
      if (this.currentScale) {
        this.playScale();
      }
    });

    document.getElementById('stop-btn').addEventListener('click', () => {
      AudioPlayer.stop();
    });

    document.getElementById('export-midi-btn').addEventListener('click', () => {
      if (this.currentMode) {
        this.exportMidi();
      }
    });
  },

  async loadModes() {
    try {
      const response = await fetch('/api/modes');
      this.modes = await response.json();
      this.populateModeSelect();
      
      AudioPlayer.setRootNote(document.getElementById('root-select').value);
      AudioPlayer.setTuningSystem(document.getElementById('tuning-select').value);
    } catch (err) {
      console.error('Failed to load modes:', err);
    }
  },

  populateModeSelect() {
    const select = document.getElementById('mode-select');
    this.modes.forEach(mode => {
      const option = document.createElement('option');
      option.value = mode.id;
      option.textContent = `${mode.name_cn} (${mode.name})`;
      select.appendChild(option);
    });
  },

  async loadMode(modeId) {
    try {
      const response = await fetch(`/api/modes/${modeId}`);
      this.currentMode = await response.json();
      this.semitonePattern = this.currentMode.semitone_pattern.split(',').map(Number);
      this.updateScale();
      this.displayModeInfo();
    } catch (err) {
      console.error('Failed to load mode:', err);
    }
  },

  updateScale() {
    const rootNote = document.getElementById('root-select').value;
    const tuningSystem = document.getElementById('tuning-select').value;
    
    this.currentScale = TuningSystem.calculateScale(
      rootNote,
      this.semitonePattern,
      tuningSystem
    );
    
    this.renderNotation();
    this.updatePiano();
    this.updateScaleTable();
  },

  renderNotation() {
    const container = document.getElementById('vexflow-container');
    container.innerHTML = '';
    
    if (!this.currentScale) {
      container.innerHTML = '<p class="placeholder">请选择调式以显示五线谱</p>';
      return;
    }

    const VF = this.VF;
    if (!VF) {
      container.innerHTML = '<p class="placeholder">VexFlow 库加载失败，请刷新页面重试</p>';
      return;
    }
    
    const width = 700;
    const height = 220;
    
    const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();
    context.setFont('Arial', 10);

    const stave = new VF.Stave(10, 40, 680);
    stave.addClef('treble');
    
    const rootNote = this.currentScale[0].noteName;
    const keySignature = this.getKeySignature(rootNote);
    stave.addKeySignature(keySignature);
    stave.setContext(context).draw();

    const notes = [];
    const tuningSystem = document.getElementById('tuning-select').value;
    const tuningInfo = TuningSystem.getTuningInfo(tuningSystem);
    
    this.currentScale.forEach((note, index) => {
      const vexNote = this.convertToVexNote(note.noteName, index === this.currentScale.length - 1);
      notes.push(vexNote);
    });

    this.addAccidentals(notes);

    const voice = new VF.Voice({
      num_beats: this.currentScale.length,
      beat_value: 4
    });
    voice.addTickables(notes);

    new VF.Formatter().joinVoices([voice]).format([voice], 600);
    voice.draw(context, stave);

    context.setFont('Arial', 12, 'bold');
    context.fillText(`律制: ${tuningInfo.name}`, 30, 190);
    context.fillText(
      `调式: ${this.currentMode.name_cn} (${this.currentMode.name})`,
      300, 190
    );
  },

  getKeySignature(rootNote) {
    const note = rootNote.replace(/\d/, '');
    const keyMap = {
      'C': 'C', 'C#': 'C#', 'D': 'D', 'D#': 'D#', 'Eb': 'Eb',
      'E': 'E', 'F': 'F', 'F#': 'F#', 'G': 'G', 'G#': 'G#',
      'Ab': 'Ab', 'A': 'A', 'A#': 'A#', 'Bb': 'Bb', 'B': 'B'
    };
    return keyMap[note] || 'C';
  },

  parseNoteForVex(noteName) {
    const match = noteName.match(/^([A-G])(##|bb|#|b)?(\d)$/);
    if (!match) return { letter: 'C', accidental: '', octave: 4, vexKey: 'C/4', vexAccidental: null };
    
    const letter = match[1];
    const accidental = match[2] || '';
    const octave = parseInt(match[3]);
    
    let vexAccidental = null;
    let vexKey = letter;
    
    if (accidental === '##') {
      vexAccidental = '##';
      vexKey = letter + '##';
    } else if (accidental === 'bb') {
      vexAccidental = 'bb';
      vexKey = letter + 'bb';
    } else if (accidental === '#') {
      vexAccidental = '#';
      vexKey = letter + '#';
    } else if (accidental === 'b') {
      vexAccidental = 'b';
      vexKey = letter + 'b';
    }
    
    return {
      letter,
      accidental,
      octave,
      vexKey: vexKey + '/' + octave,
      vexAccidental
    };
  },

  convertToVexNote(noteName, isOctave = false) {
    const VF = this.VF;
    if (!VF) return null;
    
    const parsed = this.parseNoteForVex(noteName);
    
    return new VF.StaveNote({
      keys: [parsed.vexKey],
      duration: 'q',
      clef: 'treble'
    });
  },

  addAccidentals(notes) {
    const VF = this.VF;
    notes.forEach((note, i) => {
      const key = note.keys[0];
      const notePart = key.split('/')[0];
      
      if (notePart.endsWith('##')) {
        note.addAccidental(0, new VF.Accidental('##'));
      } else if (notePart.endsWith('bb')) {
        note.addAccidental(0, new VF.Accidental('bb'));
      } else if (notePart.endsWith('#')) {
        note.addAccidental(0, new VF.Accidental('#'));
      } else if (notePart.endsWith('b')) {
        note.addAccidental(0, new VF.Accidental('b'));
      }
    });
  },

  updatePiano() {
    if (!this.currentScale) return;
    
    const midiNotes = this.currentScale.map(note => note.midi);
    PianoKeyboard.highlightKeys(midiNotes);
  },

  updateScaleTable() {
    const tbody = document.getElementById('scale-table-body');
    tbody.innerHTML = '';
    
    if (!this.currentScale) return;
    
    const tuningSystem = document.getElementById('tuning-select').value;
    
    this.currentScale.forEach(note => {
      const tr = document.createElement('tr');
      
      const equalFreq = 440 * Math.pow(2, (note.midi - 69) / 12);
      const deviation = 1200 * Math.log2(note.frequency / equalFreq);
      
      tr.innerHTML = `
        <td class="degree">${note.degree}°</td>
        <td class="note-name">${note.noteName}</td>
        <td class="interval">${note.interval !== undefined ? TuningSystem.formatInterval(note.interval) : '-'}</td>
        <td>${note.semitones}</td>
        <td class="ratio">${this.formatRatio(note.ratio)}</td>
        <td class="frequency">${note.frequency.toFixed(2)} Hz</td>
        <td class="cents ${deviation > 1 || deviation < -1 ? 'deviation' : ''}">
          ${note.cents.toFixed(1)} ¢
          ${tuningSystem !== 'equal' ? `<span class="deviation-label">(${deviation >= 0 ? '+' : ''}${deviation.toFixed(1)} ¢)</span>` : ''}
        </td>
      `;
      
      tbody.appendChild(tr);
    });
  },

  formatRatio(ratio) {
    const tolerance = 0.001;
    const commonRatios = [
      { value: 1, text: '1:1' },
      { value: 16 / 15, text: '16:15' },
      { value: 9 / 8, text: '9:8' },
      { value: 6 / 5, text: '6:5' },
      { value: 5 / 4, text: '5:4' },
      { value: 4 / 3, text: '4:3' },
      { value: 45 / 32, text: '45:32' },
      { value: 3 / 2, text: '3:2' },
      { value: 8 / 5, text: '8:5' },
      { value: 5 / 3, text: '5:3' },
      { value: 9 / 5, text: '9:5' },
      { value: 15 / 8, text: '15:8' },
      { value: 2, text: '2:1' }
    ];
    
    const normalized = ratio >= 2 ? ratio / 2 : ratio;
    
    for (const r of commonRatios) {
      if (Math.abs(normalized - r.value) < tolerance) {
        return r.text;
      }
    }
    
    return ratio.toFixed(4);
  },

  displayModeInfo() {
    if (!this.currentMode) return;

    const modeInfo = document.getElementById('mode-info');
    modeInfo.innerHTML = `
      <h3>${this.currentMode.name_cn} <span class="greek-name">${this.currentMode.greek_name}</span></h3>
      <p class="mode-description">${this.currentMode.description}</p>
      <div class="historical-context">
        <h4>历史背景</h4>
        <p>${this.currentMode.historical_context}</p>
      </div>
    `;

    this.displayIntervalInfo();
    this.displayTetrachords();
    this.displayReferences();
  },

  displayIntervalInfo() {
    const container = document.getElementById('interval-info');
    if (!this.currentMode) {
      container.innerHTML = '<p class="placeholder">请选择一个调式查看音程结构</p>';
      return;
    }

    const intervalPattern = this.currentMode.interval_pattern 
      ? this.currentMode.interval_pattern.split(',').map(s => s.trim() === '1/2' ? 0.5 : parseFloat(s.trim()))
      : TuningSystem.semitonePatternToIntervalPattern(this.semitonePattern);
    
    const intervalDisplay = intervalPattern.map(i => TuningSystem.formatInterval(i));

    container.innerHTML = `
      <div class="interval-info">
        <div class="interval-pattern-section">
          <h4>音程结构</h4>
          <div class="pattern-display interval-pattern">
            ${intervalDisplay.map((s, i) => `
              <span class="interval ${intervalPattern[i] === 0.5 ? 'semitone' : 'whole-tone'}">
                ${intervalPattern[i] === 0.5 ? '半音' : '全音'}
                <span class="interval-value">(${s})</span>
              </span>
            `).join(' → ')}
          </div>
        </div>
        <div class="semitone-pattern-section">
          <h4>半音结构</h4>
          <div class="pattern-display semitone-pattern">
            ${this.semitonePattern.map(s => `
              <span class="interval ${s === 1 ? 'semitone' : 'whole-tone'}">
                ${s === 1 ? '半音' : '全音'}
                <span class="interval-value">(${s})</span>
              </span>
            `).join(' → ')}
          </div>
        </div>
        <div class="interval-conversion">
          <h4>音程换算</h4>
          <p>1 全音 = 2 半音，1 半音 = 1/2 全音</p>
        </div>
      </div>
    `;
  },

  displayTetrachords() {
    const container = document.getElementById('tetrachord-info');
    if (!this.currentMode.tetrachords || this.currentMode.tetrachords.length === 0) {
      container.innerHTML = '<p class="placeholder">暂无四音列信息</p>';
      return;
    }

    const tetrachordNames = {
      'lower': '下四音列',
      'upper': '上四音列'
    };

    container.innerHTML = `
      <div class="tetrachords">
        ${this.currentMode.tetrachords.map(tetrachord => {
          const intervalPattern = tetrachord.interval_pattern 
            ? tetrachord.interval_pattern.split(',').map(s => s.trim() === '1/2' ? 0.5 : parseFloat(s.trim()))
            : [];
          const semitonePattern = tetrachord.semitone_pattern
            ? tetrachord.semitone_pattern.split(',').map(Number)
            : [];
          
          return `
            <div class="tetrachord">
              <h5>${tetrachordNames[tetrachord.position] || tetrachord.position}</h5>
              <div class="tetrachord-intervals">
                <div class="tetrachord-row">
                  <span class="tetrachord-label">音程:</span>
                  ${intervalPattern.map((s, i) => `
                    <span class="tetrachord-interval ${s === 0.5 ? 'semitone' : 'whole-tone'}">
                      ${TuningSystem.formatInterval(s)}
                    </span>
                  `).join(' → ')}
                </div>
                <div class="tetrachord-row">
                  <span class="tetrachord-label">半音:</span>
                  ${semitonePattern.map((s, i) => `
                    <span class="tetrachord-interval ${s === 1 ? 'semitone' : 'whole-tone'}">
                      ${s}
                    </span>
                  `).join(' → ')}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div class="tetrachord-explanation">
        <p>两个四音列之间以<strong>全音</strong>相隔，共同构成完整的八度音阶。</p>
      </div>
    `;
  },

  displayReferences() {
    const container = document.getElementById('references-info');
    if (!this.currentMode.references || this.currentMode.references.length === 0) {
      container.innerHTML = '<p class="placeholder">暂无历史文献参考</p>';
      return;
    }

    container.innerHTML = `
      <ul class="references-list">
        ${this.currentMode.references.map(ref => `
          <li class="reference-item">
            <div class="reference-header">
              <span class="reference-author">${ref.author}</span>
              <span class="reference-work">《${ref.work}》</span>
            </div>
            <div class="reference-citation">
              "${ref.citation}"
            </div>
          </li>
        `).join('')}
      </ul>
    `;
  },

  playScale() {
    if (!this.currentScale) return;
    
    AudioPlayer.playScale(
      this.currentScale,
      (note, index) => {
        PianoKeyboard.setActiveKey(note.midi);
      },
      () => {
        PianoKeyboard.clearActiveKey();
      }
    );
  },

  async exportMidi() {
    if (!this.currentMode) return;
    
    const modeId = this.currentMode.id;
    const rootNote = document.getElementById('root-select').value;
    const tuningSystem = document.getElementById('tuning-select').value;
    
    try {
      const response = await fetch(`/api/midi?modeId=${modeId}&rootNote=${rootNote}&tuningSystem=${tuningSystem}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.currentMode.name_cn}_${rootNote}_${tuningSystem}.mid`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export MIDI:', err);
    }
  },

  clearDisplay() {
    this.currentMode = null;
    this.currentScale = null;
    
    document.getElementById('vexflow-container').innerHTML = '<p class="placeholder">请选择调式以显示五线谱</p>';
    document.getElementById('scale-table-body').innerHTML = '';
    document.getElementById('mode-info').innerHTML = '<p class="placeholder">请选择一个调式查看详细信息</p>';
    document.getElementById('tetrachord-info').innerHTML = '<p class="placeholder">请选择一个调式查看四音列结构</p>';
    document.getElementById('references-info').innerHTML = '<p class="placeholder">请选择一个调式查看历史文献</p>';
    
    PianoKeyboard.clearHighlight();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
