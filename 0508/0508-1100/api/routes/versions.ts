import { Router, type Request, type Response } from 'express'
import { getDatabase, queryAll, queryOne, runSql, saveDatabase } from '../database.js'
import type { AnnotationVersion } from '../../src/types/index.js'

const router = Router()

router.get('/:id/versions', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDatabase()
    const versions = queryAll<AnnotationVersion>(db, `
      SELECT id, score_id AS scoreId, teacher_id AS teacherId,
             teacher_name AS teacherName, version_number AS versionNumber,
             color, is_final AS isFinal, created_at AS createdAt
      FROM annotation_versions
      WHERE score_id = ?
      ORDER BY version_number ASC
    `, [req.params.id])
    res.status(200).json({ success: true, data: versions })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取版本列表失败' })
  }
})

router.post('/:id/finalize', async (req: Request, res: Response): Promise<void> => {
  try {
    const { versionId } = req.body as { versionId?: string }
    if (!versionId) {
      res.status(400).json({ success: false, error: '缺少 versionId' })
      return
    }

    const db = await getDatabase()
    const version = queryOne<AnnotationVersion>(db, `
      SELECT id, score_id AS scoreId, teacher_id AS teacherId,
             teacher_name AS teacherName, version_number AS versionNumber,
             color, is_final AS isFinal, created_at AS createdAt
      FROM annotation_versions
      WHERE id = ? AND score_id = ?
    `, [versionId, req.params.id])

    if (!version) {
      res.status(404).json({ success: false, error: '版本不存在' })
      return
    }

    runSql(db, `
      UPDATE annotation_versions SET is_final = 0 WHERE score_id = ?
    `, [req.params.id])
    runSql(db, `
      UPDATE annotation_versions SET is_final = 1 WHERE id = ?
    `, [versionId])
    saveDatabase(db)

    const updated = queryOne<AnnotationVersion>(db, `
      SELECT id, score_id AS scoreId, teacher_id AS teacherId,
             teacher_name AS teacherName, version_number AS versionNumber,
             color, is_final AS isFinal, created_at AS createdAt
      FROM annotation_versions
      WHERE id = ?
    `, [versionId])

    res.status(200).json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '设置定稿失败' })
  }
})

export default router
