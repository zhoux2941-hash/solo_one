import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { VolumeControl } from '@/components/VolumeControl';
import { QuestionCard } from '@/components/QuestionCard';
import { FeedbackPanel } from '@/components/FeedbackPanel';
import { useStore } from '@/store/useStore';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import type { VoicePart, TrainingMode } from '@/types';
import { getModeName } from '@/utils/audio';

export default function Training() {
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
  const [previousUnlockedCount, setPreviousUnlockedCount] = useState(0);

  const {
    userProgress,
    currentMode,
    selectedAnswer,
    isAnswered,
    showFeedback,
    feedbackData,
    highVolume,
    lowVolume,
    setMode,
    setSelectedAnswer,
    submitAnswer,
    nextSong,
    setHighVolume,
    setLowVolume,
    getCurrentSong,
  } = useStore();

  const currentSong = getCurrentSong();
  const trainingMode = (mode as TrainingMode) || 'entry';

  useEffect(() => {
    setMode(trainingMode);
    setPreviousUnlockedCount(userProgress.unlockedHeritageIds.length);
  }, [trainingMode, setMode]);

  useEffect(() => {
    if (
      showFeedback &&
      feedbackData?.isCorrect &&
      userProgress.unlockedHeritageIds.length > previousUnlockedCount
    ) {
      setShowUnlockAnimation(true);
      setPreviousUnlockedCount(userProgress.unlockedHeritageIds.length);
      const timer = setTimeout(() => setShowUnlockAnimation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showFeedback, feedbackData, userProgress.unlockedHeritageIds.length, previousUnlockedCount]);

  const {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    togglePlay,
    seek,
    pause,
    highAnalyser,
    lowAnalyser,
  } = useAudioPlayer({
    song: currentSong,
    highVolume,
    lowVolume,
  });

  const handleRestart = useCallback(() => {
    pause();
    seek(0);
  }, [pause, seek]);

  const handleSubmit = useCallback(() => {
    if (!currentSong || !selectedAnswer) return;
    pause();
    submitAnswer(currentSong, trainingMode);
  }, [currentSong, selectedAnswer, trainingMode, pause, submitAnswer]);

  const handleNext = useCallback(() => {
    pause();
    seek(0);
    nextSong();
  }, [pause, seek, nextSong]);

  const handleSelectAnswer = useCallback((answer: VoicePart) => {
    setSelectedAnswer(answer);
  }, [setSelectedAnswer]);

  if (!currentSong) {
    return (
      <div className="min-h-screen bg-heritage-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">当前方言下没有可用曲目</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const correctAnswer = trainingMode === 'entry'
    ? currentSong.questions.entry.correctAnswer
    : currentSong.questions.melody.correctAnswer;

  return (
    <div className="min-h-screen bg-heritage-bg">
      <div className="bg-white shadow-sm border-b border-wood-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>返回首页</span>
            </button>

            <div className="flex items-center gap-4">
              <span className="px-4 py-1 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                {getModeName(trainingMode)}
              </span>
              <span className="text-gray-600">
                得分: <span className="font-bold text-primary-600">{userProgress.score}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <AudioPlayer
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              isLoading={isLoading}
              onTogglePlay={togglePlay}
              onSeek={seek}
              onRestart={handleRestart}
              songTitle={currentSong.title}
              highAnalyser={highAnalyser}
              lowAnalyser={lowAnalyser}
            />

            {showFeedback && feedbackData ? (
              <FeedbackPanel
                feedback={feedbackData}
                showUnlockAnimation={showUnlockAnimation}
              />
            ) : (
              <QuestionCard
                mode={trainingMode}
                selectedAnswer={selectedAnswer}
                isAnswered={isAnswered}
                correctAnswer={correctAnswer}
                onSelectAnswer={handleSelectAnswer}
                onSubmit={handleSubmit}
                onNext={handleNext}
              />
            )}
          </div>

          <div className="space-y-6">
            <VolumeControl
              highVolume={highVolume}
              lowVolume={lowVolume}
              onHighVolumeChange={setHighVolume}
              onLowVolumeChange={setLowVolume}
            />

            {trainingMode === 'entry' && (
              <div className="bg-white rounded-xl p-6 shadow-md border border-wood-200">
                <h4 className="font-bold text-primary-600 mb-3">声部进入时间</h4>
                <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-primary-500"
                    style={{ left: `${(currentSong.questions.entry.highEntryTime / currentSong.duration) * 100}%` }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-primary-600 whitespace-nowrap">
                      高音部
                    </span>
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-wood-500"
                    style={{ left: `${(currentSong.questions.entry.lowEntryTime / currentSong.duration) * 100}%` }}
                  >
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-wood-500 whitespace-nowrap">
                      低音部
                    </span>
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 transition-all duration-100"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-8">
                  注意：答题后才会显示声部进入位置参考
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
