import { useState, useRef, useEffect, useCallback } from 'react'
import { Video, StopCircle, RotateCcw, Camera } from 'lucide-react'

interface VideoRecorderProps {
  onRecordingComplete: (videoBlob: Blob) => void
  disabled?: boolean
}

export function VideoRecorder({ onRecordingComplete, disabled }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      setError('无法访问摄像头，请确保已授予摄像头权限')
      console.error('Camera error:', err)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [stream])

  const startRecording = useCallback(() => {
    if (!stream) return

    chunksRef.current = []
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    })

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' })
      onRecordingComplete(videoBlob)
    }

    mediaRecorder.start(100)
    mediaRecorderRef.current = mediaRecorder
    setIsRecording(true)
    setRecordingTime(0)

    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1)
    }, 1000)
  }, [stream, onRecordingComplete])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRecording(false)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [startCamera, stopCamera])

  useEffect(() => {
    if (recordingTime >= 15 && isRecording) {
      stopRecording()
    }
  }, [recordingTime, isRecording, stopRecording])

  return (
    <div className="space-y-4">
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {isRecording && (
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            <span>录制中 {formatTime(recordingTime)}</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
            <div className="text-center text-white p-4">
              <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{error}</p>
              <button
                onClick={startCamera}
                className="mt-3 px-4 py-2 bg-blue-500 rounded-lg text-sm hover:bg-blue-600"
              >
                重试
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={disabled || !stream}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Video className="w-5 h-5" />
            开始录制
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <StopCircle className="w-5 h-5" />
            停止录制
          </button>
        )}
        <button
          onClick={startCamera}
          disabled={isRecording}
          className="flex items-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          重置摄像头
        </button>
      </div>
    </div>
  )
}
