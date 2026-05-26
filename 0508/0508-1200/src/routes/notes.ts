import { Router, Request, Response } from 'express';
import { db, Note, PRESET_COLORS } from '../db';

const router = Router();

const validateColor = (color: string | undefined): string => {
  return PRESET_COLORS.includes(color as any) ? (color as string) : 'yellow';
};

router.get('/', (req: Request, res: Response) => {
  const archived = req.query.archived === '1' ? 1 : 0;
  const color = req.query.color as string | undefined;
  const q = req.query.q as string | undefined;

  let sql = 'SELECT * FROM notes WHERE archived = ?';
  const params: (string | number)[] = [archived];

  if (color && PRESET_COLORS.includes(color as any)) {
    sql += ' AND color = ?';
    params.push(color);
  }

  if (q && typeof q === 'string' && q.trim().length > 0) {
    sql += ' AND (title LIKE ? OR content LIKE ?)';
    const like = `%${q.trim()}%`;
    params.push(like, like);
  }

  sql += ' ORDER BY sortOrder ASC, id ASC';

  const rows = db.prepare(sql).all(...params) as Note[];
  res.json(rows);
});

router.post('/', (req: Request, res: Response) => {
  const { title = '', content = '', color } = req.body || {};
  const safeColor = validateColor(color);

  const maxRow = db.prepare('SELECT COALESCE(MAX(sortOrder), -1) AS m FROM notes').get() as { m: number };
  const sortOrder = (maxRow.m ?? -1) + 1;

  const info = db
    .prepare('INSERT INTO notes (title, content, color, position, sortOrder) VALUES (?, ?, ?, ?, ?)')
    .run(String(title), String(content), safeColor, sortOrder, sortOrder);

  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(info.lastInsertRowid) as Note;
  res.status(201).json(row);
});

router.put('/sort', (req: Request, res: Response) => {
  const { order } = req.body || {};
  if (!Array.isArray(order)) {
    return res.status(400).json({ error: 'order must be an array of ids' });
  }

  const updateStmt = db.prepare(
    'UPDATE notes SET sortOrder = ?, position = ?, updated_at = datetime(\'now\') WHERE id = ?'
  );
  const tx = db.transaction((ids: number[]) => {
    for (let i = 0; i < ids.length; i++) {
      updateStmt.run(i, i, ids[i]);
    }
  });

  tx(order as number[]);
  res.json({ ok: true });
});

router.put('/reorder', (req: Request, res: Response) => {
  const { order } = req.body || {};
  if (!Array.isArray(order)) {
    return res.status(400).json({ error: 'order must be an array of ids' });
  }

  const updateStmt = db.prepare(
    'UPDATE notes SET sortOrder = ?, position = ?, updated_at = datetime(\'now\') WHERE id = ?'
  );
  const tx = db.transaction((ids: number[]) => {
    for (let i = 0; i < ids.length; i++) {
      updateStmt.run(i, i, ids[i]);
    }
  });

  tx(order as number[]);
  res.json({ ok: true });
});

router.put('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

  const existing = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note | undefined;
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const body = req.body || {};
  const title = typeof body.title === 'string' ? body.title : existing.title;
  const content = typeof body.content === 'string' ? body.content : existing.content;
  const color = typeof body.color === 'string' ? validateColor(body.color) : existing.color;
  const archived = typeof body.archived === 'number' ? (body.archived ? 1 : 0) : existing.archived;

  db.prepare(
    'UPDATE notes SET title = ?, content = ?, color = ?, archived = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).run(title, content, color, archived, id);

  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note;
  res.json(row);
});

router.delete('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

  const info = db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export default router;
