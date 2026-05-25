import { Router, type Request, type Response } from 'express'
import { getDatabase, queryAll, queryOne } from '../database.js'
import type { Score } from '../../src/types/index.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDatabase()
    const scores = queryAll<Score>(db, `
      SELECT id, title, composer, instrument, difficulty, svg_content AS svgContent,
             created_at AS createdAt, updated_at AS updatedAt
      FROM scores
      ORDER BY created_at DESC
    `)
    res.status(200).json({ success: true, data: scores })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取曲谱列表失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDatabase()
    const score = queryOne<Score>(db, `
      SELECT id, title, composer, instrument, difficulty, svg_content AS svgContent,
             created_at AS createdAt, updated_at AS updatedAt
      FROM scores
      WHERE id = ?
    `, [req.params.id])

    if (!score) {
      res.status(404).json({ success: false, error: '曲谱不存在' })
      return
    }

    res.status(200).json({ success: true, data: score })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取曲谱详情失败' })
  }
})

export default router
