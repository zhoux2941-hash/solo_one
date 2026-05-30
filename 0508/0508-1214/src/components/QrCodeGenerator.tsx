import { useState, useEffect } from 'react'
import { Download, Upload, Trash2, Image, Palette, Square, AlertTriangle, CheckCircle } from 'lucide-react'
import {
  generateQRCode,
  getContrastWarning,
  isHighContrast,
  isWhitelistedColorPair,
  type ErrorLevel,
} from '../utils/QRGenerator'

interface QrCodeGeneratorProps {
  onGenerate?: (dataUrl: string) => void
}

function QrCodeGenerator({ onGenerate }: QrCodeGeneratorProps) {
  const [inputValue, setInputValue] = useState('')
  const [size, setSize] = useState(256)
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>('M')
  const [logo, setLogo] = useState<string | null>(null)
  const [qrcodeDataUrl, setQrcodeDataUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [foregroundColor, setForegroundColor] = useState('#000000')
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [roundedCorners, setRoundedCorners] = useState(false)

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

  const handleGenerate = async () => {
    if (!inputValue.trim()) return

    setIsGenerating(true)
    try {
      const dataUrl = await generateQRCode({
        text: inputValue.trim(),
        size,
        errorLevel,
        foregroundColor,
        backgroundColor,
        roundedCorners,
        logo,
      })
      setQrcodeDataUrl(dataUrl)
      onGenerate?.(dataUrl)
    } catch (error) {
      console.error('生成二维码失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    handleGenerate()
  }, [inputValue, size, errorLevel, logo, foregroundColor, backgroundColor, roundedCorners])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setLogo(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogo(null)
  }

  const downloadQrCode = () => {
    if (!qrcodeDataUrl) return
    const link = document.createElement('a')
    link.href = qrcodeDataUrl
    link.download = `qrcode_${Date.now()}.png`
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              输入文本/URL
            </label>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="请输入要生成二维码的文本或URL..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all"
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              添加Logo
            </label>
            <div className="flex gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all">
                <Upload size={18} />
                <span className="text-sm text-gray-600">上传图片</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              {logo && (
                <button
                  onClick={removeLogo}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                >
                  <Trash2 size={18} />
                  <span className="text-sm">移除</span>
                </button>
              )}
            </div>
            {logo && (
              <div className="mt-2 flex items-center gap-2">
                <Image size={16} className="text-green-600" />
                <span className="text-sm text-green-600">Logo已添加</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="relative bg-gray-50 rounded-xl p-8 min-h-[320px] flex items-center justify-center">
            {qrcodeDataUrl ? (
              <img
                src={qrcodeDataUrl}
                alt="二维码"
                className="max-w-full max-h-[280px] rounded-lg shadow-lg"
              />
            ) : (
              <div className="text-gray-400 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Image size={40} />
                </div>
                <p>请输入内容生成二维码</p>
              </div>
            )}
          </div>
          {qrcodeDataUrl && (
            <button
              onClick={downloadQrCode}
              disabled={isGenerating}
              className="mt-6 flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              <Download size={20} />
              <span>下载二维码</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default QrCodeGenerator
