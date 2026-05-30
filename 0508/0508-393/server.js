const express = require('express');
const path = require('path');
const { getDb, initDb } = require('./database');

const app = express();
const PORT = 5000;

initDb();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.get('/api/patterns', (req, res) => {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM pattern_templates ORDER BY category, id').all();
    const result = rows.map(r => ({
        id: r.id,
        name: r.name,
        name_en: r.name_en,
        vertices: JSON.parse(r.vertices),
        symmetry_type: r.symmetry_type,
        default_n: r.default_n,
        description: r.description,
        category: r.category
    }));
    res.json(result);
});

app.get('/api/patterns/:id', (req, res) => {
    const db = getDb();
    const r = db.prepare('SELECT * FROM pattern_templates WHERE id = ?').get(req.params.id);
    if (!r) return res.status(404).json({ error: 'Pattern not found' });
    res.json({
        id: r.id,
        name: r.name,
        name_en: r.name_en,
        vertices: JSON.parse(r.vertices),
        symmetry_type: r.symmetry_type,
        default_n: r.default_n,
        description: r.description,
        category: r.category
    });
});

app.get('/api/isfahan-presets', (req, res) => {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM isfahan_presets ORDER BY id').all();
    const result = rows.map(r => ({
        id: r.id,
        name: r.name,
        name_en: r.name_en,
        pattern_ids: JSON.parse(r.pattern_ids),
        colors: JSON.parse(r.colors),
        repeat_counts: JSON.parse(r.repeat_counts),
        layout_type: r.layout_type,
        description: r.description
    }));
    res.json(result);
});

app.get('/api/color-history', (req, res) => {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM color_history ORDER BY created_at DESC LIMIT 20').all();
    const result = rows.map(r => ({
        id: r.id,
        colors: JSON.parse(r.colors),
        created_at: r.created_at
    }));
    res.json(result);
});

app.post('/api/color-history', (req, res) => {
    const { colors } = req.body;
    if (!colors) return res.status(400).json({ error: 'Colors data required' });
    const db = getDb();
    const info = db.prepare('INSERT INTO color_history (colors) VALUES (?)').run(JSON.stringify(colors));
    res.status(201).json({ id: info.lastInsertRowid, message: 'Color scheme saved' });
});

app.delete('/api/color-history/:id', (req, res) => {
    const db = getDb();
    db.prepare('DELETE FROM color_history WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted' });
});

app.listen(PORT, () => {
    console.log(`Persian Pattern Designer running at http://localhost:${PORT}`);
});
