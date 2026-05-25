import { Router, type Request, type Response } from 'express'
import { getDatabase, queryAll, runSql, saveDatabase, generateId } from '../database.js'
import type { Annotation } from '../../src/types/index.js'

const router = Router()

router.get('/:id/annotations', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDatabase()
    const { versionId } = req.query

    let sql = `
      SELECT id, version_id AS versionId, score_id AS scoreId, type,
             measure_number AS measureNumber, beat_position AS beatPosition,
             content, x, y, width, height, created_at AS createdAt
      FROM annotations
      WHERE score_id = ?
    `
    const params: any[] = [req.params.id]

    if (typeof versionId === 'string' && versionId) {
      sql += ' AND version_id = ?'
      params.push(versionId)
    }

    sql += ' ORDER BY measure_number ASC, beat_position ASC'
    const annotations = queryAll<Annotation>(db, sql, params)
    res.status(200).json({ success: true, data: annotations })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取批注列表失败' })
  }
})

router.post('/:id/annotations', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as Partial<Omit<Annotation, 'id' | 'scoreId'>>
    const { versionId, type, measureNumber, content } = body

    if (!versionId || !type || measureNumber == null || !content) {
      res.status(400).json({ success: false, error: '缺少必填字段: versionId, type, measureNumber, content' })
      return
    }

    const db = await getDatabase()
    const id = generateId('ann')
    runSql(db, `
      INSERT INTO annotations (id, version_id, score_id, type, measure_number,
                               beat_position, content, x, y, width, height)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      versionId,
      req.params.id,
      type,
      measureNumber,
      body.beatPosition ?? 0,
      content,
      body.x ?? 0,
      body.y ?? 0,
      body.width ?? 40,
      body.height ?? 30,
    ])
    saveDatabase(db)

    const created = queryAll<Annotation>(db, `
      SELECT id, version_id AS versionId, score_id AS scoreId, type,
             measure_number AS measureNumber, beat_position AS beatPosition,
             content, x, y, width, height, created_at AS createdAt
      FROM annotations
      WHERE id = ?
    `, [id])[0]

    res.status(201).json({ success: true, data: created })
  } catch (error) {
    res.status(500).json({ success: false, error: '添加批注失败' })
  }
})

export default router
