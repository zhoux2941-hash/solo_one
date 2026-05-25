import { Router, type Request, type Response } from 'express'
import { getDatabase, queryAll } from '../database.js'
import type {
  Teacher,
  TeacherScoreSummary,
  Annotation,
  Conflict,
  AnnotationVersion,
} from '../../src/types/index.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDatabase()
    const teachers = queryAll<{ teacherId: string; teacherName: string; createdAt: string }>(db, `
      SELECT DISTINCT teacher_id AS teacherId, teacher_name AS teacherName,
             MIN(created_at) AS createdAt
      FROM annotation_versions
      GROUP BY teacher_id, teacher_name
      ORDER BY createdAt DESC
    `)

    const result: Teacher[] = []
    for (const t of teachers) {
      const annotationCount = queryAll<{ count: number }>(db, `
        SELECT COUNT(*) AS count
        FROM annotations a
        JOIN annotation_versions v ON v.id = a.version_id
        WHERE v.teacher_id = ?
      `, [t.teacherId])[0]?.count ?? 0

      const scoreCount = queryAll<{ count: number }>(db, `
        SELECT COUNT(DISTINCT score_id) AS count
        FROM annotation_versions
        WHERE teacher_id = ?
      `, [t.teacherId])[0]?.count ?? 0

      const conflictCount = queryAll<{ count: number }>(db, `
        SELECT COUNT(DISTINCT ca.conflict_id) AS count
        FROM conflict_annotations ca
        JOIN annotations a ON a.id = ca.annotation_id
        JOIN annotation_versions v ON v.id = a.version_id
        WHERE v.teacher_id = ?
      `, [t.teacherId])[0]?.count ?? 0

      result.push({
        id: t.teacherId,
        name: t.teacherName,
        annotationCount,
        scoreCount,
        conflictCount,
        createdAt: t.createdAt,
      })
    }

    res.status(200).json({ success: true, data: result })
  } catch (_error) {
    res.status(500).json({ success: false, error: '获取老师列表失败' })
  }
})

router.get('/:teacherId/scores', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDatabase()
    const { teacherId } = req.params

    const scores = queryAll<TeacherScoreSummary>(db, `
      SELECT s.id AS scoreId, s.title AS scoreTitle, s.composer,
             COUNT(a.id) AS annotationCount,
             MAX(v.created_at) AS lastAnnotatedAt
      FROM scores s
      JOIN annotation_versions v ON v.score_id = s.id
      LEFT JOIN annotations a ON a.version_id = v.id
      WHERE v.teacher_id = ?
      GROUP BY s.id, s.title, s.composer
      ORDER BY lastAnnotatedAt DESC
    `, [teacherId])

    const result: TeacherScoreSummary[] = []
    for (const score of scores) {
      const conflictCount = queryAll<{ count: number }>(db, `
        SELECT COUNT(DISTINCT c.id) AS count
        FROM conflicts c
        JOIN conflict_annotations ca ON ca.conflict_id = c.id
        JOIN annotations a ON a.id = ca.annotation_id
        JOIN annotation_versions v ON v.id = a.version_id
        WHERE c.score_id = ? AND v.teacher_id = ?
      `, [score.scoreId, teacherId])[0]?.count ?? 0

      result.push({
        ...score,
        hasConflicts: conflictCount > 0,
        conflictCount,
      })
    }

    res.status(200).json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取老师曲谱列表失败' })
  }
})

router.get('/:teacherId/annotations', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDatabase()
    const { teacherId } = req.params
    const { scoreId } = req.query

    let sql = `
      SELECT a.id, a.version_id AS versionId, a.score_id AS scoreId, a.type,
             a.measure_number AS measureNumber, a.beat_position AS beatPosition,
             a.content, a.x, a.y, a.width, a.height, a.created_at AS createdAt,
             s.title AS scoreTitle, v.version_number AS versionNumber
      FROM annotations a
      JOIN annotation_versions v ON v.id = a.version_id
      JOIN scores s ON s.id = a.score_id
      WHERE v.teacher_id = ?
    `
    const params: unknown[] = [teacherId]

    if (typeof scoreId === 'string' && scoreId) {
      sql += ' AND a.score_id = ?'
      params.push(scoreId)
    }

    sql += ' ORDER BY a.created_at DESC'

    const annotations = queryAll<Annotation & { scoreTitle: string; versionNumber: number }>(db, sql, params)
    res.status(200).json({ success: true, data: annotations })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取老师批注列表失败' })
  }
})

router.get('/:teacherId/conflicts', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDatabase()
    const { teacherId } = req.params

    const conflictIds = queryAll<{ conflictId: string }>(db, `
      SELECT DISTINCT ca.conflict_id AS conflictId
      FROM conflict_annotations ca
      JOIN annotations a ON a.id = ca.annotation_id
      JOIN annotation_versions v ON v.id = a.version_id
      WHERE v.teacher_id = ?
    `, [teacherId])

    const conflicts: Conflict[] = []
    for (const { conflictId } of conflictIds) {
      const conflictData = queryAll<{
        id: string
        scoreId: string
        scoreTitle: string
        measureNumber: number
        type: string
        resolved: number
        createdAt: string
      }>(db, `
        SELECT c.id, c.score_id AS scoreId, s.title AS scoreTitle,
               c.measure_number AS measureNumber, c.type, c.resolved,
               c.created_at AS createdAt
        FROM conflicts c
        JOIN scores s ON s.id = c.score_id
        WHERE c.id = ?
      `, [conflictId])[0]

      if (!conflictData) continue

      const annotations = queryAll<Annotation>(db, `
        SELECT a.id, a.version_id AS versionId, a.score_id AS scoreId, a.type,
               a.measure_number AS measureNumber, a.beat_position AS beatPosition,
               a.content, a.x, a.y, a.width, a.height, a.created_at AS createdAt
        FROM conflict_annotations ca
        JOIN annotations a ON a.id = ca.annotation_id
        WHERE ca.conflict_id = ?
      `, [conflictId])

      conflicts.push({
        id: conflictData.id,
        scoreId: conflictData.scoreId,
        measureNumber: conflictData.measureNumber,
        type: conflictData.type as Conflict['type'],
        annotations,
        resolved: conflictData.resolved === 1,
        createdAt: conflictData.createdAt,
      })
    }

    res.status(200).json({ success: true, data: conflicts })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取老师冲突列表失败' })
  }
})

router.get('/compare', async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherIds } = req.query
    if (typeof teacherIds !== 'string' || !teacherIds) {
      res.status(400).json({ success: false, error: '缺少 teacherIds 参数' })
      return
    }

    const ids = teacherIds.split(',').filter(Boolean)
    if (ids.length !== 2) {
      res.status(400).json({ success: false, error: '请提供两位老师的ID' })
      return
    }

    const db = await getDatabase()

    const versions1 = queryAll<AnnotationVersion>(db, `
      SELECT id, score_id AS scoreId, teacher_id AS teacherId,
             teacher_name AS teacherName, version_number AS versionNumber,
             color, is_final AS isFinal, created_at AS createdAt
      FROM annotation_versions
      WHERE teacher_id = ?
    `, [ids[0]])

    const versions2 = queryAll<AnnotationVersion>(db, `
      SELECT id, score_id AS scoreId, teacher_id AS teacherId,
             teacher_name AS teacherName, version_number AS versionNumber,
             color, is_final AS isFinal, created_at AS createdAt
      FROM annotation_versions
      WHERE teacher_id = ?
    `, [ids[1]])

    const commonScoreIds = new Set(
      versions1
        .filter(v => versions2.some(v2 => v2.scoreId === v.scoreId))
        .map(v => v.scoreId)
    )

    const result: Array<{
      scoreId: string
      scoreTitle: string
      teacher1Annotations: Annotation[]
      teacher2Annotations: Annotation[]
      conflicts: Array<{
        measureNumber: number
        type: string
        teacher1Content: string
        teacher2Content: string
      }>
    }> = []

    for (const scoreId of commonScoreIds) {
      const score = queryAll<{ id: string; title: string }>(db, `
        SELECT id, title FROM scores WHERE id = ?
      `, [scoreId])[0]

      if (!score) continue

      const ann1 = queryAll<Annotation>(db, `
        SELECT a.id, a.version_id AS versionId, a.score_id AS scoreId, a.type,
               a.measure_number AS measureNumber, a.beat_position AS beatPosition,
               a.content, a.x, a.y, a.width, a.height, a.created_at AS createdAt
        FROM annotations a
        JOIN annotation_versions v ON v.id = a.version_id
        WHERE a.score_id = ? AND v.teacher_id = ?
      `, [scoreId, ids[0]])

      const ann2 = queryAll<Annotation>(db, `
        SELECT a.id, a.version_id AS versionId, a.score_id AS scoreId, a.type,
               a.measure_number AS measureNumber, a.beat_position AS beatPosition,
               a.content, a.x, a.y, a.width, a.height, a.created_at AS createdAt
        FROM annotations a
        JOIN annotation_versions v ON v.id = a.version_id
        WHERE a.score_id = ? AND v.teacher_id = ?
      `, [scoreId, ids[1]])

      const conflicts: Array<{
        measureNumber: number
        type: string
        teacher1Content: string
        teacher2Content: string
      }> = []

      const ann1Map = new Map<string, Annotation>()
      for (const a of ann1) {
        ann1Map.set(`${a.measureNumber}|${a.type}`, a)
      }

      for (const a of ann2) {
        const key = `${a.measureNumber}|${a.type}`
        const matching = ann1Map.get(key)
        if (matching && matching.content.trim() !== a.content.trim()) {
          conflicts.push({
            measureNumber: a.measureNumber,
            type: a.type,
            teacher1Content: matching.content,
            teacher2Content: a.content,
          })
        }
      }

      result.push({
        scoreId,
        scoreTitle: score.title,
        teacher1Annotations: ann1,
        teacher2Annotations: ann2,
        conflicts,
      })
    }

    res.status(200).json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, error: '对比老师批注失败' })
  }
})

export default router
