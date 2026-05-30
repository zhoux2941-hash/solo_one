import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

export const patternsRouter = Router()

patternsRouter.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { category, search } = req.query

    let sql = 'SELECT * FROM patterns WHERE 1=1'
    const params: unknown[] = []

    if (category && typeof category === 'string') {
      sql += ' AND category = ?'
      params.push(category)
    }

    if (search && typeof search === 'string') {
      sql += ' AND name LIKE ?'
      params.push(`%${search}%`)
    }

    sql += ' ORDER BY id ASC'

    const patterns = db.prepare(sql).all(...params)
    res.json({ success: true, data: patterns })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch patterns' })
  }
})

patternsRouter.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const pattern = db.prepare('SELECT * FROM patterns WHERE id = ?').get(req.params.id)

    if (!pattern) {
      res.status(404).json({ success: false, error: 'Pattern not found' })
      return
    }

    res.json({ success: true, data: pattern })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch pattern' })
  }
})

export const tempPatternsRouter = Router()

tempPatternsRouter.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const patterns = db
      .prepare('SELECT * FROM temp_patterns WHERE expires_at > datetime("now") ORDER BY created_at DESC')
      .all()
    res.json({ success: true, data: patterns })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch temp patterns' })
  }
})

tempPatternsRouter.delete('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const result = db.prepare('DELETE FROM temp_patterns WHERE id = ?').run(req.params.id)

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: 'Temp pattern not found' })
      return
    }

    res.json({ success: true, message: 'Temp pattern deleted' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete temp pattern' })
  }
})

export default patternsRouter
