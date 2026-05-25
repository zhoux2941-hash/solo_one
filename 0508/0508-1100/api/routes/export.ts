import { Router, type Request, type Response } from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { getDatabase, queryOne, runSql, saveDatabase, generateId, queryAll } from '../database.js'
import type { ExportConfig, Annotation, Score, AnnotationVersion } from '../../src/types/index.js'

const router = Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const EXPORT_DIR = path.join(__dirname, '..', '..', 'data', 'exports')

function ensureExportDir(): void {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true })
  }
}

function buildProofDocument(
  score: Score,
  finalVersion: AnnotationVersion | null,
  annotations: Annotation[],
  versions: AnnotationVersion[],
  config: ExportConfig,
): string {
  const lines: string[] = []
  lines.push(`# ${score.title}`)
  lines.push(`作曲: ${score.composer}`)
  lines.push(`乐器: ${score.instrument}`)
  lines.push(`难度: ${score.difficulty}`)
  lines.push('')
  if (finalVersion) {
    lines.push(`定稿版本: ${finalVersion.teacherName} (v${finalVersion.versionNumber})`)
    lines.push('')
  }

  const filtered = annotations.filter(a => {
    if (!config.includeFingerings && a.type === 'fingering') return false
    if (!config.includeOralNotes && a.type === 'oral') return false
    return true
  })

  const byMeasure = new Map<number, Annotation[]>()
  for (const a of filtered) {
    if (!byMeasure.has(a.measureNumber)) byMeasure.set(a.measureNumber, [])
    byMeasure.get(a.measureNumber)!.push(a)
  }

  const versionName = (vid: string) =>
    versions.find(v => v.id === vid)?.teacherName ?? vid

  for (const [measure, items] of [...byMeasure.entries()].sort((a, b) => a[0] - b[0])) {
    lines.push(`## 第 ${measure} 小节`)
    const sortedItems = [...items].sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type)
      if (a.beatPosition !== b.beatPosition) return a.beatPosition - b.beatPosition
      return a.versionId.localeCompare(b.versionId)
    })
    for (const a of sortedItems) {
      const label = a.type === 'fingering' ? '指法' : a.type === 'oral' ? '口授' : '分句'
      const isFinal = finalVersion && a.versionId === finalVersion.id
      const finalMark = isFinal ? ' ★[定稿]' : ''
      lines.push(`- [${label}] ${versionName(a.versionId)} · 拍 ${a.beatPosition}: ${a.content}${finalMark}`)
    }
    lines.push('')
  }

  if (config.includeConflicts) {
    lines.push('---')
    lines.push('## 冲突汇总')
    const conflictGroups = new Map<string, Annotation[]>()
    for (const a of filtered) {
      const key = `${a.measureNumber}|${a.type}`
      if (!conflictGroups.has(key)) conflictGroups.set(key, [])
      conflictGroups.get(key)!.push(a)
    }
    for (const [key, items] of conflictGroups) {
      const unique = new Set(items.map(a => a.content.trim()))
      if (unique.size < 2) continue
      const [m, t] = key.split('|')
      const label = t === 'fingering' ? '指法' : t === 'oral' ? '口授' : '分句'
      lines.push(`### 第 ${m} 小节 · ${label} 冲突`)
      for (const a of items) {
        lines.push(`- ${versionName(a.versionId)}: ${a.content}`)
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}

router.post('/proof', async (req: Request, res: Response): Promise<void> => {
  try {
    const config = req.body as ExportConfig
    if (!config?.scoreId || !config?.format) {
      res.status(400).json({ success: false, error: '缺少 scoreId 或 format' })
      return
    }

    const db = await getDatabase()
    const score = queryOne<Score>(db, `
      SELECT id, title, composer, instrument, difficulty,
             svg_content AS svgContent,
             created_at AS createdAt, updated_at AS updatedAt
      FROM scores
      WHERE id = ?
    `, [config.scoreId])

    if (!score) {
      res.status(404).json({ success: false, error: '曲谱不存在' })
      return
    }

    const finalVersion = config.finalVersionId
      ? queryOne<AnnotationVersion>(db, `
          SELECT id, score_id AS scoreId, teacher_id AS teacherId,
                 teacher_name AS teacherName, version_number AS versionNumber,
                 color, is_final AS isFinal, created_at AS createdAt
          FROM annotation_versions
          WHERE id = ? AND score_id = ?
        `, [config.finalVersionId, config.scoreId])
      : null

    const annotations = queryAll<Annotation>(db, `
      SELECT id, version_id AS versionId, score_id AS scoreId, type,
             measure_number AS measureNumber, beat_position AS beatPosition,
             content, x, y, width, height, created_at AS createdAt
      FROM annotations
      WHERE score_id = ?
      ORDER BY measure_number ASC, beat_position ASC
    `, [config.scoreId])

    const allVersions = queryAll<AnnotationVersion>(db, `
      SELECT id, score_id AS scoreId, teacher_id AS teacherId,
             teacher_name AS teacherName, version_number AS versionNumber,
             color, is_final AS isFinal, created_at AS createdAt
      FROM annotation_versions
      WHERE score_id = ?
    `, [config.scoreId])

    ensureExportDir()
    const id = generateId('exp')
    const ext = config.format === 'pdf' ? 'pdf' : 'txt'
    const fileName = `${id}.${ext}`
    const filePath = path.join(EXPORT_DIR, fileName)

    const document = buildProofDocument(score, finalVersion, annotations, allVersions, config)
    fs.writeFileSync(filePath, document, 'utf-8')

    runSql(db, `
      INSERT INTO export_tasks (id, score_id, format, status, file_path, config)
      VALUES (?, ?, ?, 'completed', ?, ?)
    `, [id, config.scoreId, config.format, filePath, JSON.stringify(config)])
    saveDatabase(db)

    res.status(201).json({
      success: true,
      data: { id, format: config.format, file_path: filePath, created_at: new Date().toISOString() },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '生成校样文档失败' })
  }
})

router.get('/:id/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDatabase()
    const task = queryOne<{ id: string; file_path: string; format: string }>(db, `
      SELECT id, file_path AS file_path, format
      FROM export_tasks
      WHERE id = ?
    `, [req.params.id])

    if (!task || !task.file_path) {
      res.status(404).json({ success: false, error: '导出任务不存在' })
      return
    }

    if (!fs.existsSync(task.file_path)) {
      res.status(404).json({ success: false, error: '文件不存在' })
      return
    }

    res.download(task.file_path, `proof.${task.format === 'pdf' ? 'pdf' : 'txt'}`)
  } catch (error) {
    res.status(500).json({ success: false, error: '下载失败' })
  }
})

export default router
