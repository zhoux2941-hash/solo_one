import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import packageRoutes from './routes/packages.js'
import coachRoutes from './routes/coaches.js'
import bookingRoutes from './routes/bookings.js'
import settlementRoutes from './routes/settlement.js'
import memberRoutes from './routes/member.js'
import './db/index.js'
import { initCronJobs } from './utils/cron.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/packages', packageRoutes)
app.use('/api/coaches', coachRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/coach', settlementRoutes)
app.use('/api/member', memberRoutes)

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
  console.error('Server error:', error)
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API不存在',
  })
})

initCronJobs()

export default app
