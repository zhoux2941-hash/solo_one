import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

interface DivinationTemplate {
  id: number
  category: string
  content: string
  interpretation: string
  period: string
}

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { category } = req.query

  let results: DivinationTemplate[]

  if (category && typeof category === 'string') {
    const stmt = db.prepare('SELECT * FROM divination_templates WHERE category = ?')
    stmt.bind([category])
    results = []
    while (stmt.step()) {
      results.push(stmt.getAsObject() as DivinationTemplate)
    }
    stmt.free()
  } else {
    const stmt = db.prepare('SELECT * FROM divination_templates')
    results = []
    while (stmt.step()) {
      results.push(stmt.getAsObject() as DivinationTemplate)
    }
    stmt.free()
  }

  res.json({ success: true, data: results })
})

export default router
