import { useState, useRef } from 'react'
import JSZip from 'jszip'
import { Download, Loader2, FileText, AlertCircle, Palette, Square, AlertTriangle, CheckCircle } from 'lucide-react'
import {
  generateQRCodeToCanvas,
  getContrastWarning,
  isHighContrast,
  isWhitelistedColorPair,
  type ErrorLevel,
} from '../utils/QRGenerator'

function BatchGenerator() {
  const [inputText, setInputText] = useState('')
  const [size, setSize] = useState(200)
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>('M')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCount, setGeneratedCount] = useState(0)
  const [foregroundColor, setForegroundColor] = useState('#000000')
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [roundedCorners, setRoundedCorners] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const errorLevels: { value: ErrorLevel; label: string; desc: string }[] = [
    { value: 'L', label: 'L', desc: '低 (7%)' },
    { value: 'M', label: 'M', desc: '中 (15%)' },
    { value: 'Q', label: 'Q', desc: '较高 (25%)' },
    { value: 'H', label: 'H', desc: '高 (30%)' },
  ]

  const popularColors = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'
  ]

  const contrastWarning = getContrastWarning(foregroundColor, backgroundColor)
  const isContrastValid = isHighContrast(foregroundColor, backgroundColor)
  const isColorWhitelisted = isWhitelistedColorPair(foregroundColor, backgroundColor)

  const parseLines = (text: string): string[] => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  }

  const generateAndDownload = async () => {
    const lines = parseLines(inputText)
    if (lines.length === 0) return

    setIsGenerating(true)
    setGeneratedCount(0)

    try {
      const zip = new JSZip()
      const canvas = canvasRef.current
      if (!canvas) return

      for (let i = 0; i < lines.length; i++) {
        const text = lines[i]
        const filename = `qrcode_${i + 1}.png`

        await generateQRCodeToCanvas(canvas, {
          text,
          size,
          errorLevel,
          foregroundColor,
          backgroundColor,
          roundedCorners,
        })

        const dataUrl = canvas.toDataURL('image/png')
        const base64Data = dataUrl.split(',')[1]
        zip.file(filename, base64Data, { base64: true })

        setGeneratedCount(i + 1)
      }

      const stream = zip.generateInternalStream({ type: 'uint8array' })

      const reader = new ReadableStream({
        async start(controller) {
          try {
            await new Promise<void>((resolve, reject) => {
              stream.on('data', (chunk: Uint8Array) => {
                controller.enqueue(chunk)
              })
              stream.on('end', () => {
                controller.close()
                resolve()
              })
              stream.on('error', (err: Error) => {
                controller.error(err)
                reject(err)
              })
              stream.resume()
            })
          } catch (err) {
            controller.error(err)
          }
        },
      })

      const blob = await new Response(reader).blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qrcodes_${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('批量生成失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const lineCount = parseLines(inputText).length

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              输入文本（每行一条）
            </label>
            <span className="text-sm text-gray-500">
              {lineCount > 0 ? `${lineCount} 条记录` : '暂无数据'}
            </span>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="请输入要生成二维码的文本或URL，每行一条...&#10;&#10;例如：&#10;https://example.com&#10;hello@example.com&#10;这是一段测试文本"
            className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all font-mono text-sm"
          />
          {lineCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText size={16} />
              <span>将生成 {lineCount} 个二维码</span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              尺寸: {size}px
            </label>
            <input
              type="range"
              min="100"
              max="500"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>100px</span>
              <span>500px</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              容错级别
            </label>
            <div className="grid grid-cols-4 gap-2">
              {errorLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setErrorLevel(level.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    errorLevel === level.value
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div>{level.label}</div>
                  <div className="text-xs opacity-70">{level.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Palette size={16} />
            颜色设置
          </label>
          <div className={`p-3 rounded-lg border ${
            isContrastValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">前景色</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={foregroundColor}
                    onChange={(e) => setForegroundColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={foregroundColor}
                    onChange={(e) => setForegroundColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div className="flex gap-1 mt-2">
                  {popularColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setForegroundColor(color)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                        foregroundColor === color ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">背景色</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div className="flex gap-1 mt-2">
                  {popularColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setBackgroundColor(color)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                        backgroundColor === color ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              {isContrastValid ? (
                <>
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-sm text-green-700">
                    {isColorWhitelisted ? '颜色组合在推荐白名单中' : '对比度符合要求'}
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} className="text-red-600" />
                  <span className="text-sm text-red-700">对比度不足，可能影响扫描</span>
                </>
              )}
            </div>
            {contrastWarning && !isContrastValid && (
              <p className="mt-2 text-xs text-red-600">{contrastWarning}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Square size={16} />
            样式设置
          </label>
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
            <input
              type="checkbox"
              checked={roundedCorners}
              onChange={(e) => setRoundedCorners(e.target.checked)}
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-gray-700">圆角方块样式</span>
          </label>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <button
          onClick={generateAndDownload}
          disabled={isGenerating || lineCount === 0}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl text-lg font-medium"
        >
          {isGenerating ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              <span>正在生成... ({generatedCount}/{lineCount})</span>
            </>
          ) : (
            <>
              <Download size={24} />
              <span>批量下载二维码 (ZIP)</span>
            </>
          )}
        </button>

        {lineCount === 0 && !isGenerating && (
          <div className="mt-4 flex items-center justify-center gap-2 text-amber-600">
            <AlertCircle size={18} />
            <span className="text-sm">请先输入要生成二维码的内容</span>
          </div>
        )}

        {lineCount > 10 && !isGenerating && (
          <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
            <FileText size={18} />
            <span className="text-sm">将生成包含 {lineCount} 个二维码的压缩包</span>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default BatchGenerator
