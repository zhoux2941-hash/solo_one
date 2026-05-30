/**
 * 古代星图 API 服务器
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { initDatabase } from './db/index.js'
import { StarService } from './services/starService.js'
import { ConstellationService } from './services/constellationService.js'
import { ConnectionService } from './services/connectionService.js'
import { createStarRouter } from './routes/stars.js'
import { createConstellationRouter } from './routes/constellations.js'
import { createConnectionRouter } from './routes/connections.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const db = initDatabase()

const starService = new StarService(db)
const constellationService = new ConstellationService(db)
const connectionService = new ConnectionService(db)

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/stars', createStarRouter(starService))
app.use('/api/constellations', createConstellationRouter(constellationService))
app.use('/api/connections', createConnectionRouter(connectionService))

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    const starCount = db.prepare('SELECT COUNT(*) as count FROM stars').get() as { count: number }
    const constellationCount = db.prepare('SELECT COUNT(*) as count FROM constellations').get() as { count: number }
    res.status(200).json({
      success: true,
      message: 'ok',
      data: {
        stars: starCount.count,
        constellations: constellationCount.count,
      },
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
