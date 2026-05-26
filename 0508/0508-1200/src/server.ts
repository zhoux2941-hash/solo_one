import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import notesRouter from './routes/notes';
import { PRESET_COLORS } from './db';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/colors', (_req, res) => {
  res.json(PRESET_COLORS);
});

app.use('/api/notes', notesRouter);

const distClientDir = path.join(__dirname, '..', 'dist-client');
const publicDir = path.join(__dirname, '..', 'public');
const clientDir = fs.existsSync(distClientDir) ? distClientDir : publicDir;
app.use(express.static(clientDir));

app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Sticky notes wall server running at http://localhost:${PORT}`);
});
