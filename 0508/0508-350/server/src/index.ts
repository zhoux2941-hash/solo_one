import express from 'express'
import cors from 'cors'
import routes from './routes'
import { generateMockData } from './data/mockData'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api', routes)

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '渔港加冰站服务运行正常' })
})

generateMockData()

app.listen(PORT, () => {
  console.log(`渔港加冰站服务已启动，端口: ${PORT}`)
  console.log(`健康检查: http://localhost:${PORT}/api/health`)
})
