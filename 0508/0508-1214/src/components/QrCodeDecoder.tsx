import { useState, useRef } from 'react'
import jsQR from 'jsqr'
import { Upload, Copy, Check, Link, AlertCircle, Image } from 'lucide-react'

function QrCodeDecoder() {
  const [uploadedImage, setUploadedImage] = useState<string>('')
  const [decodedText, setDecodedText] = useState<string>('')
  const [isDecoding, setIsDecoding] = useState(false)
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setDecodedText('')
    setIsDecoding(true)

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const imgSrc = event.target?.result as string
        setUploadedImage(imgSrc)

        const img = new Image()
        img.src = imgSrc

        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        })

        if (code) {
          setDecodedText(code.data)
        } else {
          setError('未能识别图片中的二维码')
        }

        setIsDecoding(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setError('图片加载失败，请重试')
      setIsDecoding(false)
    }
  }

  const copyToClipboard = async () => {
    if (!decodedText) return
    try {
      await navigator.clipboard.writeText(decodedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('复制失败')
    }
  }

  const openLink = () => {
    if (!decodedText) return
    try {
      const url = new URL(decodedText)
      window.open(url.toString(), '_blank')
    } catch {
      setError('无效的URL')
    }
  }

  const isUrl = (text: string): boolean => {
    try {
      new URL(text)
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            上传二维码图片
          </label>
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all">
            {uploadedImage ? (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={uploadedImage}
                  alt="上传的二维码"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Upload size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500">点击或拖拽上传图片</p>
                <p className="text-sm text-gray-400 mt-1">支持 PNG, JPG, GIF 格式</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="flex flex-col justify-center">
          <div className="bg-gray-50 rounded-xl p-6 min-h-[256px] flex flex-col">
            {isDecoding ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>正在解析...</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle size={24} />
                  <span>{error}</span>
                </div>
              </div>
            ) : decodedText ? (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  解析结果
                </label>
                <p className="flex-1 p-4 bg-white rounded-lg border border-gray-200 text-gray-800 break-all">
                  {decodedText}
                </p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                  >
                    {copied ? (
                      <>
                        <Check size={18} className="text-green-600" />
                        <span>已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        <span>复制</span>
                      </>
                    )}
                  </button>
                  {isUrl(decodedText) && (
                    <button
                      onClick={openLink}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                    >
                      <Link size={18} />
                      <span>打开链接</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Image size={32} />
                  </div>
                  <p>请上传二维码图片进行解析</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default QrCodeDecoder
