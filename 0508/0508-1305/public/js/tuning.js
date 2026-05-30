const TuningSystem = {
  SHARP_NAMES: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
  FLAT_NAMES: ['C', 'Db', 'Eb', 'Eb', 'F', 'Gb', 'Gb', 'Ab', 'Ab', 'Bb', 'Bb', 'B'],
  NATURAL_LETTERS: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],

  semitonesToInterval(semitones) {
    if (semitones === 1) return 0.5;
    if (semitones === 2) return 1;
    return semitones / 2;
  },

  intervalToSemitones(interval) {
    if (interval === 0.5 || interval === '1/2') return 1;
    if (interval === 1) return 2;
    return Math.round(interval * 2);
  },

  semitonePatternToIntervalPattern(pattern) {
    return pattern.map(s => this.semitonesToInterval(s));
  },

  intervalPatternToSemitonePattern(pattern) {
    return pattern.map(i => this.intervalToSemitones(i));
  },

  formatInterval(interval) {
    if (interval === 0.5 || interval === '1/2') return '1/2';
    if (interval === 1) return '1';
    if (typeof interval === 'number') return interval.toString();
    return interval;
  },

  parseIntervalPatternString(str) {
    return str.split(',').map(s => {
      s = s.trim();
      if (s === '1/2') return 0.5;
      return parseFloat(s);
    });
  },

  noteToMidi(note) {
    const noteMap = { 'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11, 'C##': 2, 'D##': 4, 'E##': 6, 'F##': 7, 'G##': 9, 'A##': 11, 'B##': 13, 'Dbb': 0, 'Ebb': 2, 'Fbb': 3, 'Gbb': 5, 'Abb': 7, 'Bbb': 9 };
    const match = note.match(/^([A-G](?:##|bb|#|b)?)(\d)$/);
    if (!match) return 60;
    const pitchClass = match[1];
    const octave = parseInt(match[2]);
    return (octave + 1) * 12 + (noteMap[pitchClass] !== undefined ? noteMap[pitchClass] % 12 : 0);
  },

  midiToNote(midi) {
    const noteNames = this.SHARP_NAMES;
    const octave = Math.floor(midi / 12) - 1;
    const pitchClass = midi % 12;
    return noteNames[pitchClass] + octave;
  },

  midiToNoteFlat(midi) {
    const noteNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const pitchClass = midi % 12;
    return noteNames[pitchClass] + octave;
  },

  getDiatonicNoteName(rootNote, semitonesFromRoot) {
    const rootMatch = rootNote.match(/^([A-G])(#|b)?(\d)$/);
    if (!rootMatch) return this.midiToNote(this.noteToMidi(rootNote) + semitonesFromRoot);

    const rootLetter = rootMatch[1];
    const rootLetterIndex = this.NATURAL_LETTERS.indexOf(rootLetter);
    const rootMidi = this.noteToMidi(rootNote);
    const targetMidi = rootMidi + semitonesFromRoot;

    if (semitonesFromRoot === 0) return rootNote;

    if (semitonesFromRoot >= 12) {
      const octavesUp = Math.floor(semitonesFromRoot / 12);
      const remainder = semitonesFromRoot % 12;
      const remainderInfo = this.getDiatonicNoteName(rootNote, remainder);
      const remMatch = remainderInfo.match(/^([A-G])(##|bb|#|b)?(\d)$/);
      if (remMatch) {
        return remMatch[1] + (remMatch[2] || '') + (parseInt(remMatch[3]) + octavesUp);
      }
      return this.midiToNote(targetMidi);
    }

    let diatonicSteps = 0;
    let tempSemi = 0;
    const majorScaleIntervals = [2, 2, 1, 2, 2, 2, 1];
    for (let i = 0; i < 7 && tempSemi < semitonesFromRoot; i++) {
      if (tempSemi + majorScaleIntervals[i] <= semitonesFromRoot) {
        tempSemi += majorScaleIntervals[i];
        diatonicSteps++;
      } else {
        break;
      }
    }

    const letterIndex = (rootLetterIndex + diatonicSteps) % 7;
    const octave = parseInt(rootMatch[3]);
    const targetOctave = octave + Math.floor((rootLetterIndex + diatonicSteps) / 7);

    const targetLetter = this.NATURAL_LETTERS[letterIndex];
    const naturalMidi = this.noteToMidi(targetLetter + targetOctave);
    const diff = targetMidi - naturalMidi;

    let accidental = '';
    if (diff === 1) accidental = '#';
    else if (diff === -1) accidental = 'b';
    else if (diff === 2) accidental = '##';
    else if (diff === -2) accidental = 'bb';
    else if (diff !== 0) {
      return this.midiToNoteFlat ? this.midiToNoteFlat(targetMidi) : this.midiToNote(targetMidi);
    }

    return targetLetter + accidental + targetOctave;
  },

  noteToFrequency(note) {
    const noteMap = { 'C': -9, 'C#': -8, 'Db': -8, 'D': -7, 'D#': -6, 'Eb': -6, 'E': -5, 'F': -4, 'F#': -3, 'Gb': -3, 'G': -2, 'G#': -1, 'Ab': -1, 'A': 0, 'A#': 1, 'Bb': 1, 'B': 2, 'C##': -7, 'D##': -5, 'E##': -3, 'F##': -2, 'G##': 0, 'A##': 2, 'B##': 4, 'Dbb': -9, 'Ebb': -7, 'Fbb': -6, 'Gbb': -4, 'Abb': -2, 'Bbb': 0 };
    const match = note.match(/^([A-G])(##|bb|#|b)?(\d)$/);
    if (!match) return 440;
    const letter = match[1];
    const accidental = match[2] || '';
    const octave = parseInt(match[3]);
    const pitchClass = letter + accidental;
    const semitonesFromA4 = (octave - 4) * 12 + (noteMap[pitchClass] !== undefined ? noteMap[pitchClass] : 0);
    return 440 * Math.pow(2, semitonesFromA4 / 12);
  },

  midiToFrequency(midi, tuningSystem = 'equal', rootMidi = 60, rootFreq = null) {
    if (rootFreq === null) {
      rootFreq = 440 * Math.pow(2, (rootMidi - 69) / 12);
    }
    const semitones = midi - rootMidi;
    return rootFreq * this.getRatio(semitones, tuningSystem);
  },

  getRatio(semitones, tuningSystem) {
    const s = semitones % 12;
    const octaves = Math.floor(semitones / 12);
    
    let ratio;
    switch (tuningSystem) {
      case 'pythagorean':
        ratio = this.pythagoreanRatio(s);
        break;
      case 'just':
        ratio = this.justIntonationRatio(s);
        break;
      case 'equal':
      default:
        ratio = Math.pow(2, s / 12);
        break;
    }
    
    return ratio * Math.pow(2, octaves);
  },

  pythagoreanRatio(semitones) {
    const fifths = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
    const index = fifths.indexOf(semitones);
    if (index === -1) return Math.pow(2, semitones / 12);
    
    let ratio = Math.pow(3, index) / Math.pow(2, 0);
    while (ratio >= 2) ratio /= 2;
    while (ratio < 1) ratio *= 2;
    return ratio;
  },

  justIntonationRatio(semitones) {
    const ratios = {
      0: 1 / 1,
      1: 16 / 15,
      2: 9 / 8,
      3: 6 / 5,
      4: 5 / 4,
      5: 4 / 3,
      6: 45 / 32,
      7: 3 / 2,
      8: 8 / 5,
      9: 5 / 3,
      10: 9 / 5,
      11: 15 / 8,
      12: 2 / 1
    };
    return ratios[semitones % 12] || Math.pow(2, semitones / 12);
  },

  cents(ratio) {
    return 1200 * Math.log2(ratio);
  },

  calculateScale(rootNote, pattern, tuningSystem, patternType = 'semitone') {
    let semitonePattern;
    if (patternType === 'interval') {
      semitonePattern = this.intervalPatternToSemitonePattern(pattern);
    } else {
      semitonePattern = pattern;
    }

    const rootFreq = this.noteToFrequency(rootNote);
    const rootMidi = this.noteToMidi(rootNote);
    
    const scale = [{
      degree: 1,
      semitones: 0,
      interval: 0,
      ratio: 1,
      frequency: rootFreq,
      cents: 0,
      midi: rootMidi,
      noteName: rootNote
    }];
    
    let totalSemitones = 0;
    let totalIntervals = 0;
    
    for (let i = 0; i < semitonePattern.length; i++) {
      totalSemitones += semitonePattern[i];
      totalIntervals += this.semitonesToInterval(semitonePattern[i]);
      
      const ratio = this.getRatio(totalSemitones, tuningSystem);
      const cents = this.cents(ratio);
      const midi = rootMidi + totalSemitones;
      const noteName = this.getDiatonicNoteName(rootNote, totalSemitones);
      
      scale.push({
        degree: i + 2,
        semitones: totalSemitones,
        interval: totalIntervals,
        ratio: ratio,
        frequency: rootFreq * ratio,
        cents: cents,
        midi: midi,
        noteName: noteName
      });
    }
    
    const octaveNoteName = this.getDiatonicNoteName(rootNote, 12);
    scale.push({
      degree: 8,
      semitones: 12,
      interval: 6,
      ratio: 2,
      frequency: rootFreq * 2,
      cents: 1200,
      midi: rootMidi + 12,
      noteName: octaveNoteName
    });
    
    return scale;
  },

  calculateScaleFromIntervals(rootNote, intervalPattern, tuningSystem) {
    return this.calculateScale(rootNote, intervalPattern, tuningSystem, 'interval');
  },

  getTuningInfo(tuningSystem) {
    const info = {
      pythagorean: {
        name: '毕达哥拉斯音律',
        nameEn: 'Pythagorean Tuning',
        description: '古希腊最重要的律制之一，基于3:2的纯五度连续相生而得。每升高一个纯五度（7个半音），频率乘以3/2，然后除以2以保持在一个八度内。',
        intervals: [
          { semitones: 0, ratio: '1:1', cents: 0 },
          { semitones: 1, ratio: '256:243', cents: 90.22 },
          { semitones: 2, ratio: '9:8', cents: 203.91 },
          { semitones: 3, ratio: '32:27', cents: 294.13 },
          { semitones: 4, ratio: '81:64', cents: 407.82 },
          { semitones: 5, ratio: '4:3', cents: 498.04 },
          { semitones: 6, ratio: '729:512', cents: 611.73 },
          { semitones: 7, ratio: '3:2', cents: 701.96 },
          { semitones: 8, ratio: '128:81', cents: 792.18 },
          { semitones: 9, ratio: '27:16', cents: 905.87 },
          { semitones: 10, ratio: '16:9', cents: 996.09 },
          { semitones: 11, ratio: '243:128', cents: 1109.78 }
        ]
      },
      just: {
        name: '纯律',
        nameEn: 'Just Intonation',
        description: '基于自然泛音列的律制，使用最简单的整数比来构建音阶。每个音程都采用最纯净的比例，如大三度5:4、小三度6:5、纯四度4:3、纯五度3:2等。',
        intervals: [
          { semitones: 0, ratio: '1:1', cents: 0 },
          { semitones: 1, ratio: '16:15', cents: 111.73 },
          { semitones: 2, ratio: '9:8', cents: 203.91 },
          { semitones: 3, ratio: '6:5', cents: 315.64 },
          { semitones: 4, ratio: '5:4', cents: 386.31 },
          { semitones: 5, ratio: '4:3', cents: 498.04 },
          { semitones: 6, ratio: '45:32', cents: 590.22 },
          { semitones: 7, ratio: '3:2', cents: 701.96 },
          { semitones: 8, ratio: '8:5', cents: 813.69 },
          { semitones: 9, ratio: '5:3', cents: 884.36 },
          { semitones: 10, ratio: '9:5', cents: 1017.60 },
          { semitones: 11, ratio: '15:8', cents: 1088.27 }
        ]
      },
      equal: {
        name: '十二平均律',
        nameEn: 'Equal Temperament',
        description: '现代最常用的律制，将八度平均分为12个半音，每个半音的频率比为2^(1/12) ≈ 1.05946。所有调的音程关系完全相同，但没有绝对纯净的音程。',
        intervals: Array.from({ length: 12 }, (_, i) => ({
          semitones: i,
          ratio: `2^(${i}/12)`,
          cents: i * 100
        }))
      }
    };
    return info[tuningSystem];
  }
};
