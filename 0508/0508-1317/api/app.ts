import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initialize } from './database.js'
import templateRoutes from './routes/templates.js'
import exampleRoutes from './routes/examples.js'
import exportRoutes from './routes/export.js'

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/templates', templateRoutes)
app.use('/api/examples', exampleRoutes)
app.use('/api/export', exportRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, _next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
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

initialize()
  .then(() => {
    console.log('Database initialized')
  })
  .catch((err) => {
    console.error('Database initialization failed:', err)
  })

export default app
