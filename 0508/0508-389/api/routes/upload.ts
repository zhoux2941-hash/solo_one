import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { getDb } from '../db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const UPLOADS_DIR = path.join(__dirname, '../../uploads')

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.svg']
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, allowed.includes(ext))
  },
})

const router = Router()

async function extractContourFromImage(filePath: string): Promise<string> {
  const SIZE = 200

  const processed = await sharp(filePath)
    .resize(SIZE, SIZE, { fit: 'inside', background: { r: 255, g: 255, b: 255 } })
    .grayscale()
    .threshold(128)
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { data, info } = processed
  const width = info.width
  const height = info.height
  const channels = info.channels

  const isBlack = (x: number, y: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false
    const idx = (y * width + x) * channels
    return data[idx] < 128
  }

  const edgePoints: Array<[number, number]> = []

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (!isBlack(x, y)) continue
      if (
        !isBlack(x - 1, y) ||
        !isBlack(x + 1, y) ||
        !isBlack(x, y - 1) ||
        !isBlack(x, y + 1)
      ) {
        edgePoints.push([x, y])
      }
    }
  }

  if (edgePoints.length === 0) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>'
  }

  const step = Math.max(1, Math.floor(edgePoints.length / 500))
  const sampled: Array<[number, number]> = []
  for (let i = 0; i < edgePoints.length; i += step) {
    sampled.push(edgePoints[i])
  }

  const scaleX = 100 / width
  const scaleY = 100 / height

  if (sampled.length === 0) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>'
  }

  let pathD = `M${(sampled[0][0] * scaleX).toFixed(1)} ${(sampled[0][1] * scaleY).toFixed(1)}`

  for (let i = 1; i < sampled.length; i++) {
    const [x, y] = sampled[i]
    pathD += ` L${(x * scaleX).toFixed(1)} ${(y * scaleY).toFixed(1)}`
  }

  pathD += ' Z'

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="${pathD}" fill="none" stroke="#1A2332" stroke-width="1.5"/></svg>`
}

async function extractContourFromSvg(filePath: string): Promise<string> {
  const svgContent = fs.readFileSync(filePath, 'utf-8')

  const base64 = Buffer.from(svgContent).toString('base64')
  const dataUri = `data:image/svg+xml;base64,${base64}`

  const processed = await sharp(Buffer.from(svgContent))
    .resize(200, 200, { fit: 'inside', background: { r: 255, g: 255, b: 255 } })
    .grayscale()
    .threshold(128)
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { data, info } = processed
  const width = info.width
  const height = info.height
  const channels = info.channels

  const isBlack = (x: number, y: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false
    const idx = (y * width + x) * channels
    return data[idx] < 128
  }

  const edgePoints: Array<[number, number]> = []

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (!isBlack(x, y)) continue
      if (
        !isBlack(x - 1, y) ||
        !isBlack(x + 1, y) ||
        !isBlack(x, y - 1) ||
        !isBlack(x, y + 1)
      ) {
        edgePoints.push([x, y])
      }
    }
  }

  if (edgePoints.length === 0) {
    return svgContent.includes('viewBox') ? svgContent : svgContent.replace('<svg', '<svg viewBox="0 0 100 100"')
  }

  const step = Math.max(1, Math.floor(edgePoints.length / 500))
  const sampled: Array<[number, number]> = []
  for (let i = 0; i < edgePoints.length; i += step) {
    sampled.push(edgePoints[i])
  }

  const scaleX = 100 / width
  const scaleY = 100 / height

  let pathD = `M${(sampled[0][0] * scaleX).toFixed(1)} ${(sampled[0][1] * scaleY).toFixed(1)}`

  for (let i = 1; i < sampled.length; i++) {
    const [x, y] = sampled[i]
    pathD += ` L${(x * scaleX).toFixed(1)} ${(y * scaleY).toFixed(1)}`
  }

  pathD += ' Z'

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="${pathD}" fill="none" stroke="#1A2332" stroke-width="1.5"/></svg>`
}

async function extractContour(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.svg') {
    return extractContourFromSvg(filePath)
  }
  return extractContourFromImage(filePath)
}

router.post(
  '/',
  upload.single('image'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No image file provided' })
        return
      }

      const filePath = req.file.path
      const originalName = req.file.originalname

      const svgPath = await extractContour(filePath)

      const ext = path.extname(filePath).toLowerCase()
      let thumbnail: string

      if (ext === '.svg') {
        const svgBuffer = fs.readFileSync(filePath)
        thumbnail = await sharp(svgBuffer)
          .resize(100, 100, { fit: 'inside' })
          .png()
          .toBuffer()
          .then((buf) => `data:image/png;base64,${buf.toString('base64')}`)
      } else {
        thumbnail = await sharp(filePath)
          .resize(100, 100, { fit: 'inside' })
          .png()
          .toBuffer()
          .then((buf) => `data:image/png;base64,${buf.toString('base64')}`)
      }

      const db = getDb()
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19)

      const result = db
        .prepare(
          `INSERT INTO temp_patterns (name, svg_path, original_image, thumbnail, expires_at)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(originalName, svgPath, filePath, thumbnail, expiresAt)

      const tempPattern = db
        .prepare('SELECT * FROM temp_patterns WHERE id = ?')
        .get(result.lastInsertRowid)

      res.json({ success: true, data: tempPattern })
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to process upload' })
    }
  }
)

export default router
