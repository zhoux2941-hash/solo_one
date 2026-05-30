import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

interface OracleExample {
  id: number
  name: string
  period: string
  description: string
  shell_type: string
  pit_shape: string
  temperature: number
  anisotropy_ratio: number
  crack_data: string
  inscriptions: string
}

router.get('/', (_req: Request, res: Response): void => {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM oracle_examples')
  const results: OracleExample[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject() as OracleExample
    results.push({
      ...row,
      crack_data: JSON.parse(row.crack_data as string),
      inscriptions: JSON.parse(row.inscriptions as string),
    } as never)
  }
  stmt.free()

  res.json({ success: true, data: results })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const id = Number(req.params.id)

  const stmt = db.prepare('SELECT * FROM oracle_examples WHERE id = ?')
  stmt.bind([id])

  if (!stmt.step()) {
    stmt.free()
    res.status(404).json({ success: false, error: '示例未找到' })
    return
  }

  const row = stmt.getAsObject() as OracleExample
  stmt.free()

  const result = {
    ...row,
    crack_data: JSON.parse(row.crack_data as string),
    inscriptions: JSON.parse(row.inscriptions as string),
  }

  res.json({ success: true, data: result })
})

export default router
