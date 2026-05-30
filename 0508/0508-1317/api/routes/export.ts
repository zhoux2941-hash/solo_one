import { Router, type Request, type Response } from 'express'
import { jsPDF } from 'jspdf'

const router = Router()

interface Inscription {
  x: number
  y: number
  text: string
  fontSize: number
  rotation: number
}

interface PdfExportRequest {
  shellType: 'plastron' | 'carapace'
  pitShape: 'circle' | 'jujube'
  temperature: number
  anisotropyRatio: number
  inscriptions: Inscription[]
  imageDataUrl: string
}

router.post('/pdf', (req: Request, res: Response): void => {
  const { shellType, pitShape, temperature, anisotropyRatio, inscriptions, imageDataUrl } =
    req.body as PdfExportRequest

  const doc = new jsPDF()

  doc.setFontSize(22)
  doc.text('\u535C\u7532\u89E3\u8BFB\u62A5\u544A', 105, 20, { align: 'center' })

  doc.setFontSize(12)
  const shellLabel = shellType === 'plastron' ? '\u8179\u7532' : '\u80CC\u7532'
  const pitLabel = pitShape === 'circle' ? '\u5706\u5F62' : '\u67A3\u6838\u5F62'
  const anisoLabel = anisotropyRatio > 1 ? `\u7EB5\u5411\u5360\u4F18 (${anisotropyRatio.toFixed(1)})` : anisotropyRatio < 1 ? `\u6A2A\u5411\u5360\u4F18 (${anisotropyRatio.toFixed(1)})` : `\u5404\u5411\u540C\u6027 (${anisotropyRatio.toFixed(1)})`

  doc.text(`\u9F9F\u7532\u90E8\u4F4D\uFF1A${shellLabel}`, 20, 40)
  doc.text(`\u51FF\u5751\u5F62\u72B6\uFF1A${pitLabel}`, 20, 50)
  doc.text(`\u707C\u70E7\u6E29\u5EA6\uFF1A${temperature}\u2103`, 20, 60)
  doc.text(`\u7EB5/\u6A2A\u6BD4\uFF1A${anisoLabel}`, 20, 70)

  if (imageDataUrl) {
    try {
      const format = imageDataUrl.includes('image/png') ? 'PNG' : 'JPEG'
      doc.addImage(imageDataUrl, format, 20, 75, 170, 120)
    } catch {
      doc.text('\u56FE\u50CF\u52A0\u8F7D\u5931\u8D25', 20, 80)
    }
  }

  if (inscriptions && inscriptions.length > 0) {
    doc.setFontSize(14)
    doc.text('\u535C\u8F9E\u6807\u6CE8\uFF1A', 20, 205)

    doc.setFontSize(11)
    let y = 215
    for (const ins of inscriptions) {
      if (y > 280) {
        doc.addPage()
        y = 20
      }
      doc.text(ins.text, 20, y)
      y += 8
    }
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename=oracle-report.pdf')
  res.send(pdfBuffer)
})

export default router
