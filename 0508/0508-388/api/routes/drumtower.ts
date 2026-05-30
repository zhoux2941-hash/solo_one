import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/cities', (_req: Request, res: Response) => {
  const db = getDb()
  const cities = db.prepare('SELECT * FROM cities ORDER BY id').all()
  res.json({ cities })
})

router.post('/cities', (req: Request, res: Response) => {
  const db = getDb()
  const { name, dynasty, latitude, longitude, description, rules } = req.body

  if (!name || !dynasty || !description || !rules || !Array.isArray(rules)) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  if (rules.length !== 12) {
    res.status(400).json({ error: 'Rules must contain exactly 12 shichen entries' })
    return
  }

  const insertCity = db.prepare(
    'INSERT INTO cities (name, dynasty, latitude, longitude, description) VALUES (?, ?, ?, ?, ?)'
  )

  const insertRule = db.prepare(
    'INSERT INTO timekeeping_rules (city_id, shichen, modern_time, bell_count, drum_count, description) VALUES (?, ?, ?, ?, ?, ?)'
  )

  try {
    const result = db.transaction(() => {
      const cityResult = insertCity.run(
        name,
        dynasty,
        latitude || null,
        longitude || null,
        description
      )
      const cityId = cityResult.lastInsertRowid as number

      rules.forEach((rule: { shichen: string; modern_time: string; bell_count: number; drum_count: number; description: string }) => {
        insertRule.run(
          cityId,
          rule.shichen,
          rule.modern_time,
          rule.bell_count || 0,
          rule.drum_count || 0,
          rule.description || ''
        )
      })

      return cityId
    })()

    const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(result)
    const cityRules = db.prepare('SELECT * FROM timekeeping_rules WHERE city_id = ? ORDER BY id').all(result)

    res.json({ city, rules: cityRules })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create city', detail: (error as Error).message })
  }
})

router.delete('/cities/:cityId', (req: Request, res: Response) => {
  const db = getDb()
  const cityId = parseInt(req.params.cityId, 10)
  if (isNaN(cityId)) {
    res.status(400).json({ error: 'Invalid cityId' })
    return
  }

  if (cityId <= 3) {
    res.status(403).json({ error: 'Cannot delete default cities' })
    return
  }

  try {
    db.transaction(() => {
      db.prepare('DELETE FROM timekeeping_rules WHERE city_id = ?').run(cityId)
      db.prepare('DELETE FROM interaction_logs WHERE city_id = ?').run(cityId)
      db.prepare('DELETE FROM cities WHERE id = ?').run(cityId)
    })()

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete city', detail: (error as Error).message })
  }
})

router.get('/rules/:cityId', (req: Request, res: Response) => {
  const db = getDb()
  const cityId = parseInt(req.params.cityId, 10)
  if (isNaN(cityId)) {
    res.status(400).json({ error: 'Invalid cityId' })
    return
  }
  const rules = db.prepare('SELECT * FROM timekeeping_rules WHERE city_id = ? ORDER BY id').all(cityId)
  res.json({ rules })
})

router.post('/logs', (req: Request, res: Response) => {
  const db = getDb()
  const { city_id, shichen, bell_count, drum_count, action } = req.body
  if (!city_id || !shichen || !action) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }
  const stmt = db.prepare(
    'INSERT INTO interaction_logs (city_id, shichen, bell_count, drum_count, action) VALUES (?, ?, ?, ?, ?)'
  )
  const result = stmt.run(city_id, shichen, bell_count || 0, drum_count || 0, action)
  const log = db.prepare('SELECT * FROM interaction_logs WHERE id = ?').get(result.lastInsertRowid)
  res.json({ log })
})

router.get('/logs', (req: Request, res: Response) => {
  const db = getDb()
  const cityId = req.query.city_id ? parseInt(req.query.city_id as string, 10) : undefined
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50

  let logs
  if (cityId && !isNaN(cityId)) {
    logs = db.prepare(
      'SELECT l.*, c.name as city_name FROM interaction_logs l JOIN cities c ON l.city_id = c.id WHERE l.city_id = ? ORDER BY l.timestamp DESC LIMIT ?'
    ).all(cityId, limit)
  } else {
    logs = db.prepare(
      'SELECT l.*, c.name as city_name FROM interaction_logs l JOIN cities c ON l.city_id = c.id ORDER BY l.timestamp DESC LIMIT ?'
    ).all(limit)
  }
  res.json({ logs })
})

router.get('/export/:cityId', (req: Request, res: Response) => {
  const db = getDb()
  const cityId = parseInt(req.params.cityId, 10)
  if (isNaN(cityId)) {
    res.status(400).json({ error: 'Invalid cityId' })
    return
  }
  const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(cityId) as { name: string } | undefined
  if (!city) {
    res.status(404).json({ error: 'City not found' })
    return
  }
  const rules = db.prepare('SELECT * FROM timekeeping_rules WHERE city_id = ? ORDER BY id').all(cityId) as Array<{
    shichen: string
    modern_time: string
    bell_count: number
    drum_count: number
    description: string
  }>

  const filename = `drumtower_rules_${cityId}.csv`

  const header = '时辰,现代时间,钟次数,鼓次数,说明\n'
  const rows = rules.map(r =>
    `${r.shichen},${r.modern_time},${r.bell_count},${r.drum_count},"${r.description}"`
  ).join('\n')
  const csv = '\uFEFF' + header + rows

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(csv)
})

export default router
