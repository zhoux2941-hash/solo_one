import { useRef, useState } from 'react';
import { Mic, MicOff, Play, Trash2, AlertCircle } from 'lucide-react';
import { SpectrumCanvas } from './SpectrumCanvas';
import { useRecorder } from '@/hooks/useRecorder';

export const Recorder = () => {
  const {
    isRecording,
    recordedUrl,
    startRecording,
    stopRecording,
    playRecording,
    clearRecording,
    analyser,
    error,
  } = useRecorder();

  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  const handleStart = async () => {
    setRecordingTime(0);
    await startRecording();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setRecordingTime(t => t + 1);
    }, 1000);
  };

  const handleStop = () => {
    stopRecording();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-wood-200">
      <h3 className="text-lg font-display font-semibold text-primary-600 mb-6">
        录音练习
      </h3>

      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">实时频谱</span>
          {isRecording && (
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-sm font-mono text-red-600">
                录音中 {formatTime(recordingTime)}
              </span>
            </div>
          )}
        </div>
        <SpectrumCanvas
          analyser={analyser}
          isActive={isRecording}
          type="bars"
          color="#1E3A5F"
          backgroundColor="#F5F0E8"
          height={150}
        />
      </div>

      <div className="flex items-center justify-center gap-4 mb-6">
        {!isRecording ? (
          <button
            onClick={handleStart}
            disabled={!!error}
            className="relative group flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-wine-500 to-wine-600 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {isRecording && (
              <span className="absolute inset-0 rounded-full bg-wine-400 animate-pulse-ring" />
            )}
            <Mic size={24} className="relative z-10" />
            <span className="relative z-10">开始录音</span>
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            <MicOff size={24} />
            <span>停止录音</span>
          </button>
        )}

        {recordedUrl && (
          <>
            <button
              onClick={playRecording}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors"
            >
              <Play size={20} />
              <span>播放</span>
            </button>
            <button
              onClick={clearRecording}
              className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </>
        )}
      </div>

      {recordedUrl && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-green-700 font-medium">
            ✓ 录音完成，您可以播放回放与标准音高对比
          </p>
        </div>
      )}

      <div className="mt-6 p-4 bg-heritage-bg rounded-lg border border-wood-200">
        <p className="text-sm text-gray-600">
          <span className="font-medium text-primary-600">提示：</span>
          尝试模仿侗族大歌的声部演唱，录制您的声音后可以通过频谱对比观察音高差异。
        </p>
      </div>
    </div>
  );
};
