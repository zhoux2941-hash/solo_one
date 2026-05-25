import { Router, type Request, type Response } from 'express'
import { getDatabase, queryAll } from '../database.js'
import type { Annotation, AnnotationVersion, Conflict, MissingAnnotation } from '../../src/types/index.js'

const router = Router()

interface RowAnnotation extends Annotation {
  versionId: string
  teacherId: string
}

router.get('/:id/conflicts', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDatabase()
    const scoreId = req.params.id

    const rows = queryAll<RowAnnotation>(db, `
      SELECT a.id, a.version_id AS versionId, a.score_id AS scoreId, a.type,
             a.measure_number AS measureNumber, a.beat_position AS beatPosition,
             a.content, a.x, a.y, a.width, a.height, a.created_at AS createdAt,
             v.teacher_id AS teacherId, v.teacher_name AS teacherName,
             v.version_number AS versionNumber, v.color
      FROM annotations a
      JOIN annotation_versions v ON v.id = a.version_id
      WHERE a.score_id = ?
      ORDER BY a.measure_number ASC, a.beat_position ASC
    `, [scoreId])

    const groups = new Map<string, RowAnnotation[]>()
    for (const ann of rows) {
      const key = `${ann.measureNumber}|${ann.type}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(ann)
    }

    const conflicts: Conflict[] = []
    for (const [key, items] of groups.entries()) {
      if (items.length < 2) continue
      const uniqueContents = new Set(items.map(a => a.content.trim()))
      if (uniqueContents.size < 2) continue

      const teachers = new Set(items.map(a => a.teacherId))
      if (teachers.size < 2) continue

      const [measureNumber, type] = key.split('|')
      conflicts.push({
        id: `conflict-${scoreId}-${measureNumber}-${type}`,
        scoreId,
        measureNumber: Number(measureNumber),
        type: type as Conflict['type'],
        annotations: items.map(a => ({
          id: a.id,
          versionId: a.versionId,
          scoreId: a.scoreId,
          type: a.type,
          measureNumber: a.measureNumber,
          beatPosition: a.beatPosition,
          content: a.content,
          x: a.x,
          y: a.y,
          width: a.width,
          height: a.height,
        })),
        resolved: false,
        createdAt: new Date().toISOString(),
      })
    }

    res.status(200).json({ success: true, data: conflicts })
  } catch (error) {
    res.status(500).json({ success: false, error: '冲突检测失败' })
  }
})

router.get('/:id/missing', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDatabase()
    const scoreId = req.params.id

    const versions = queryAll<AnnotationVersion>(db, `
      SELECT id, score_id AS scoreId, teacher_id AS teacherId,
             teacher_name AS teacherName, version_number AS versionNumber,
             color, is_final AS isFinal, created_at AS createdAt
      FROM annotation_versions
      WHERE score_id = ?
    `, [scoreId])

    if (versions.length < 2) {
      res.status(200).json({ success: true, data: [] })
      return
    }

    const rows = queryAll<RowAnnotation>(db, `
      SELECT a.id, a.version_id AS versionId, a.score_id AS scoreId, a.type,
             a.measure_number AS measureNumber, a.beat_position AS beatPosition,
             a.content, a.x, a.y, a.width, a.height, a.created_at AS createdAt,
             v.teacher_id AS teacherId, v.teacher_name AS teacherName,
             v.version_number AS versionNumber, v.color
      FROM annotations a
      JOIN annotation_versions v ON v.id = a.version_id
      WHERE a.score_id = ?
    `, [scoreId])

    const typeMeasureToVersions = new Map<string, Map<number, Set<string>>>()
    for (const ann of rows) {
      const byMeasure = typeMeasureToVersions.get(ann.type) ?? new Map<number, Set<string>>()
      const set = byMeasure.get(ann.measureNumber) ?? new Set<string>()
      set.add(ann.versionId)
      byMeasure.set(ann.measureNumber, set)
      typeMeasureToVersions.set(ann.type, byMeasure)
    }

    const missing: MissingAnnotation[] = []
    for (const [type, byMeasure] of typeMeasureToVersions.entries()) {
      for (const [measureNumber, presentSet] of byMeasure.entries()) {
        if (presentSet.size === versions.length) continue
        const missingIn = versions.filter(v => !presentSet.has(v.id)).map(v => v.id)
        const presentIn = Array.from(presentSet)
        const sample = rows.find(r =>
          r.type === type &&
          r.measureNumber === measureNumber &&
          presentSet.has(r.versionId)
        )
        if (!sample) continue
        missing.push({
          id: `missing-${scoreId}-${type}-${measureNumber}`,
          scoreId,
          measureNumber,
          type: type as MissingAnnotation['type'],
          presentInVersions: presentIn,
          missingInVersions: missingIn,
          annotation: {
            id: sample.id,
            versionId: sample.versionId,
            scoreId: sample.scoreId,
            type: sample.type,
            measureNumber: sample.measureNumber,
            beatPosition: sample.beatPosition,
            content: sample.content,
            x: sample.x,
            y: sample.y,
            width: sample.width,
            height: sample.height,
          },
        })
      }
    }

    res.status(200).json({ success: true, data: missing })
  } catch (error) {
    res.status(500).json({ success: false, error: '缺失检测失败' })
  }
})

export default router
