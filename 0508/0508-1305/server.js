import express from 'express';
import cors from 'cors';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from '@tonejs/midi';
const { Midi } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db;

async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: file => path.join(__dirname, 'node_modules', 'sql.js', 'dist', file)
  });

  const dbPath = path.join(__dirname, 'greek-modes.db');
  const fileBuffer = fs.readFileSync(dbPath);
  db = new SQL.Database(fileBuffer);
  console.log('Database loaded successfully');
}

function getModes() {
  const result = db.exec('SELECT * FROM modes');
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const rows = result[0].values;
  
  return rows.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

function getModeById(id) {
  const result = db.exec('SELECT * FROM modes WHERE id = ?', [id]);
  if (result.length === 0) return null;
  
  const columns = result[0].columns;
  const rows = result[0].values;
  
  const mode = {};
  columns.forEach((col, i) => {
    mode[col] = rows[0][i];
  });

  const tetrachordsResult = db.exec('SELECT * FROM tetrachords WHERE mode_id = ?', [id]);
  if (tetrachordsResult.length > 0) {
    const tColumns = tetrachordsResult[0].columns;
    mode.tetrachords = tetrachordsResult[0].values.map(row => {
      const obj = {};
      tColumns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  } else {
    mode.tetrachords = [];
  }

  const refsResult = db.exec('SELECT * FROM historical_references WHERE mode_id = ?', [id]);
  if (refsResult.length > 0) {
    const rColumns = refsResult[0].columns;
    mode.references = refsResult[0].values.map(row => {
      const obj = {};
      rColumns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  } else {
    mode.references = [];
  }

  return mode;
}

function generateMidi(modeId, rootNote, tuningSystem) {
  const mode = getModeById(modeId);
  if (!mode) return null;

  const semitonePattern = mode.semitone_pattern.split(',').map(Number);
  
  const midi = new Midi();
  const track = midi.addTrack();
  track.name = `${mode.name_cn} (${mode.name}) - ${tuningSystem}`;

  const rootMidi = noteToMidi(rootNote);
  
  let currentMidi = rootMidi;
  const notes = [currentMidi];
  
  for (const semitones of semitonePattern) {
    currentMidi += semitones;
    notes.push(currentMidi);
  }

  const duration = 0.5;
  let time = 0;
  
  notes.forEach(midiNote => {
    track.addNote({
      midi: midiNote,
      time: time,
      duration: duration,
      velocity: 0.8
    });
    time += duration;
  });

  track.addNote({
    midi: notes[0] + 12,
    time: time,
    duration: duration,
    velocity: 0.8
  });

  return midi.toArray();
}

function noteToMidi(note) {
  const noteMap = { 'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11, 'C##': 2, 'D##': 4, 'E##': 6, 'F##': 7, 'G##': 9, 'A##': 11, 'B##': 13, 'Dbb': 0, 'Ebb': 2, 'Fbb': 3, 'Gbb': 5, 'Abb': 7, 'Bbb': 9 };
  const match = note.match(/^([A-G](?:##|bb|#|b)?)(\d)$/);
  if (!match) return 60;
  
  const pitchClass = match[1];
  const octave = parseInt(match[2]);
  
  return (octave + 1) * 12 + (noteMap[pitchClass] !== undefined ? noteMap[pitchClass] % 12 : 0);
}

app.get('/api/modes', (req, res) => {
  try {
    const modes = getModes();
    res.json(modes);
  } catch (err) {
    console.error('Error fetching modes:', err);
    res.status(500).json({ error: 'Failed to fetch modes' });
  }
});

app.get('/api/modes/:id', (req, res) => {
  try {
    const mode = getModeById(req.params.id);
    if (!mode) {
      res.status(404).json({ error: 'Mode not found' });
      return;
    }
    res.json(mode);
  } catch (err) {
    console.error('Error fetching mode:', err);
    res.status(500).json({ error: 'Failed to fetch mode' });
  }
});

app.get('/api/midi', (req, res) => {
  try {
    const { modeId, rootNote, tuningSystem } = req.query;
    
    if (!modeId || !rootNote) {
      res.status(400).json({ error: 'modeId and rootNote are required' });
      return;
    }

    const midiData = generateMidi(modeId, rootNote, tuningSystem || 'equal');
    if (!midiData) {
      res.status(404).json({ error: 'Mode not found' });
      return;
    }

    const mode = getModeById(modeId);
    const safeName = mode.name.replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `${safeName}_${rootNote}_${tuningSystem || 'equal'}.mid`;
    const displayFilename = `${mode.name_cn}_${rootNote}_${tuningSystem || 'equal'}.mid`;
    
    res.setHeader('Content-Type', 'audio/midi');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(displayFilename)}`);
    res.send(Buffer.from(midiData));
  } catch (err) {
    console.error('Error generating MIDI:', err);
    res.status(500).json({ error: 'Failed to generate MIDI' });
  }
});

app.get('/api/scale', (req, res) => {
  try {
    const { modeId, rootNote, tuningSystem, patternType } = req.query;
    
    if (!modeId || !rootNote) {
      res.status(400).json({ error: 'modeId and rootNote are required' });
      return;
    }

    const mode = getModeById(modeId);
    if (!mode) {
      res.status(404).json({ error: 'Mode not found' });
      return;
    }

    const semitonePattern = mode.semitone_pattern.split(',').map(Number);
    const intervalPattern = mode.interval_pattern.split(',').map(s => s.trim() === '1/2' ? 0.5 : parseFloat(s));
    const rootFreq = noteToFrequency(rootNote);
    
    const type = patternType === 'interval' ? 'interval' : 'semitone';
    const pattern = type === 'interval' ? intervalPattern : semitonePattern;
    const scale = calculateScale(rootNote, rootFreq, pattern, tuningSystem || 'pythagorean', type);
    
    res.json({
      mode: {
        id: mode.id,
        name: mode.name,
        name_cn: mode.name_cn,
        greek_name: mode.greek_name,
        description: mode.description,
        historical_context: mode.historical_context,
        semitone_pattern: mode.semitone_pattern,
        interval_pattern: mode.interval_pattern,
        interval_pattern_display: intervalPattern.map(i => formatInterval(i)).join(', '),
        tetrachord_type: mode.tetrachord_type,
        tetrachords: mode.tetrachords,
        references: mode.references
      },
      rootNote: rootNote,
      tuningSystem: tuningSystem || 'pythagorean',
      patternType: type,
      semitonePattern: semitonePattern,
      intervalPattern: intervalPattern,
      intervalPatternDisplay: intervalPattern.map(i => formatInterval(i)).join(', '),
      scale: scale
    });
  } catch (err) {
    console.error('Error calculating scale:', err);
    res.status(500).json({ error: 'Failed to calculate scale' });
  }
});

app.post('/api/calculate-scale', express.json(), (req, res) => {
  try {
    const { rootNote, tuningSystem, semitonePattern, intervalPattern } = req.body;
    
    if (!rootNote) {
      res.status(400).json({ error: 'rootNote is required' });
      return;
    }

    let pattern, patternType;
    if (intervalPattern) {
      pattern = intervalPattern.map(i => typeof i === 'string' && i.trim() === '1/2' ? 0.5 : parseFloat(i));
      patternType = 'interval';
    } else if (semitonePattern) {
      pattern = semitonePattern.map(Number);
      patternType = 'semitone';
    } else {
      res.status(400).json({ error: 'semitonePattern or intervalPattern is required' });
      return;
    }

    const rootFreq = noteToFrequency(rootNote);
    const scale = calculateScale(rootNote, rootFreq, pattern, tuningSystem || 'pythagorean', patternType);
    
    res.json({
      rootNote: rootNote,
      tuningSystem: tuningSystem || 'pythagorean',
      patternType: patternType,
      semitonePattern: patternType === 'interval' ? intervalPatternToSemitonePattern(pattern) : pattern,
      intervalPattern: patternType === 'semitone' ? semitonePatternToIntervalPattern(pattern) : pattern,
      intervalPatternDisplay: (patternType === 'semitone' ? semitonePatternToIntervalPattern(pattern) : pattern).map(i => formatInterval(i)).join(', '),
      scale: scale
    });
  } catch (err) {
    console.error('Error calculating scale:', err);
    res.status(500).json({ error: 'Failed to calculate scale' });
  }
});

function noteToFrequency(note) {
  const noteMap = { 'C': -9, 'C#': -8, 'Db': -8, 'D': -7, 'D#': -6, 'Eb': -6, 'E': -5, 'F': -4, 'F#': -3, 'Gb': -3, 'G': -2, 'G#': -1, 'Ab': -1, 'A': 0, 'A#': 1, 'Bb': 1, 'B': 2, 'C##': -7, 'D##': -5, 'E##': -3, 'F##': -2, 'G##': 0, 'A##': 2, 'B##': 4, 'Dbb': -9, 'Ebb': -7, 'Fbb': -6, 'Gbb': -4, 'Abb': -2, 'Bbb': 0 };
  const match = note.match(/^([A-G])(##|bb|#|b)?(\d)$/);
  if (!match) return 440;
  
  const letter = match[1];
  const accidental = match[2] || '';
  const octave = parseInt(match[3]);
  const pitchClass = letter + accidental;
  const semitonesFromA4 = (octave - 4) * 12 + (noteMap[pitchClass] !== undefined ? noteMap[pitchClass] : 0);
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

const NATURAL_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

function semitonesToInterval(semitones) {
  if (semitones === 1) return 0.5;
  if (semitones === 2) return 1;
  return semitones / 2;
}

function intervalToSemitones(interval) {
  if (interval === 0.5 || interval === '1/2') return 1;
  if (interval === 1) return 2;
  return Math.round(interval * 2);
}

function semitonePatternToIntervalPattern(pattern) {
  return pattern.map(s => semitonesToInterval(s));
}

function intervalPatternToSemitonePattern(pattern) {
  return pattern.map(i => intervalToSemitones(i));
}

function formatInterval(interval) {
  if (interval === 0.5 || interval === '1/2') return '1/2';
  if (interval === 1) return '1';
  if (typeof interval === 'number') return interval.toString();
  return interval;
}

function parseIntervalPatternString(str) {
  return str.split(',').map(s => {
    s = s.trim();
    if (s === '1/2') return 0.5;
    return parseFloat(s);
  });
}

function midiToNote(midiVal) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiVal / 12) - 1;
  const pitchClass = midiVal % 12;
  return noteNames[pitchClass] + octave;
}

function getDiatonicNoteName(rootNote, semitonesFromRoot) {
  const rootMatch = rootNote.match(/^([A-G])(##|bb|#|b)?(\d)$/);
  if (!rootMatch) return midiToNote(noteToMidi(rootNote) + semitonesFromRoot);

  const rootLetter = rootMatch[1];
  const rootLetterIndex = NATURAL_LETTERS.indexOf(rootLetter);
  const rootMidi = noteToMidi(rootNote);
  const targetMidi = rootMidi + semitonesFromRoot;

  if (semitonesFromRoot === 0) return rootNote;

  if (semitonesFromRoot >= 12) {
    const octavesUp = Math.floor(semitonesFromRoot / 12);
    const remainder = semitonesFromRoot % 12;
    const remainderInfo = getDiatonicNoteName(rootNote, remainder);
    const remMatch = remainderInfo.match(/^([A-G])(##|bb|#|b)?(\d)$/);
    if (remMatch) {
      return remMatch[1] + (remMatch[2] || '') + (parseInt(remMatch[3]) + octavesUp);
    }
    return midiToNote(targetMidi);
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

  const targetLetter = NATURAL_LETTERS[letterIndex];
  const naturalMidi = noteToMidi(targetLetter + targetOctave);
  const diff = targetMidi - naturalMidi;

  let accidental = '';
  if (diff === 1) accidental = '#';
  else if (diff === -1) accidental = 'b';
  else if (diff === 2) accidental = '##';
  else if (diff === -2) accidental = 'bb';
  else if (diff !== 0) {
    return midiToNote(targetMidi);
  }

  return targetLetter + accidental + targetOctave;
}

function getScaleRatio(totalSemitones, tuningSystem) {
  const s = totalSemitones % 12;
  const octaves = Math.floor(totalSemitones / 12);
  
  let ratio;
  
  if (tuningSystem === 'pythagorean') {
    ratio = pythagoreanRatio(s);
  } else if (tuningSystem === 'just') {
    ratio = justIntonationRatio(s);
  } else {
    ratio = Math.pow(2, s / 12);
  }
  
  return ratio * Math.pow(2, octaves);
}

function calculateScale(rootNote, rootFreq, pattern, tuningSystem, patternType = 'semitone') {
  let semitonePattern;
  if (patternType === 'interval') {
    semitonePattern = intervalPatternToSemitonePattern(pattern);
  } else {
    semitonePattern = pattern;
  }

  const rootMidi = noteToMidi(rootNote);
  
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
    totalIntervals += semitonesToInterval(semitonePattern[i]);
    
    const ratio = getScaleRatio(totalSemitones, tuningSystem);
    const cents = 1200 * Math.log2(ratio);
    const midi = rootMidi + totalSemitones;
    const noteName = getDiatonicNoteName(rootNote, totalSemitones);
    
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
  
  const octaveNoteName = getDiatonicNoteName(rootNote, 12);
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
}

function calculateScaleFromIntervals(rootNote, rootFreq, intervalPattern, tuningSystem) {
  return calculateScale(rootNote, rootFreq, intervalPattern, tuningSystem, 'interval');
}

function pythagoreanRatio(semitones) {
  const fifths = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
  const index = fifths.indexOf(semitones % 12);
  if (index === -1) return Math.pow(2, semitones / 12);
  
  let ratio = Math.pow(3, index);
  while (ratio >= 2) ratio /= 2;
  while (ratio < 1) ratio *= 2;
  return ratio;
}

function normalizedRatio(ratio) {
  while (ratio >= 2) ratio /= 2;
  while (ratio < 1) ratio *= 2;
  return ratio;
}

function justIntonationRatio(semitones) {
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
}

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
