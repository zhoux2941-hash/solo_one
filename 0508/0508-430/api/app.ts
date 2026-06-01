/**
 * This is a API server
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
import './db/init.js'
import { extractDepartment, requireAdmin, loginAdmin } from './middleware/auth.js'
import searchRoutes from './routes/search.js'
import statsRoutes from './routes/stats.js'
import pinRoutes from './routes/pin.js'
import abtestRoutes from './routes/abtest.js'
import logsRoutes from './routes/logs.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(extractDepartment)

app.post('/api/admin/login', async (req: Request, res: Response) => {
  const { username, password } = req.body
  const result = await loginAdmin(username, password)
  if (!result.success) {
    res.status(401).json({ error: result.error })
    return
  }
  res.json({ success: true, token: result.token })
})

app.use('/api', searchRoutes)

app.use('/api/admin/stats', requireAdmin, statsRoutes)
app.use('/api/admin/pin', requireAdmin, pinRoutes)
app.use('/api/admin/abtest', requireAdmin, abtestRoutes)
app.use('/api/admin/logs', requireAdmin, logsRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
