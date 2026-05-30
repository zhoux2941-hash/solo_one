import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import type { VoicePart, TrainingMode } from '@/types';
import { getVoicePartName, getModeName } from '@/utils/audio';

interface QuestionCardProps {
  mode: TrainingMode;
  selectedAnswer: VoicePart | null;
  isAnswered: boolean;
  correctAnswer: VoicePart;
  onSelectAnswer: (answer: VoicePart) => void;
  onSubmit: () => void;
  onNext: () => void;
}

export const QuestionCard = ({
  mode,
  selectedAnswer,
  isAnswered,
  correctAnswer,
  onSelectAnswer,
  onSubmit,
  onNext,
}: QuestionCardProps) => {
  const questionText = mode === 'entry'
    ? '请仔细听辨，哪个声部先进入？'
    : '请仔细听辨，哪个声部是主要旋律？';

  const getOptionClass = (option: VoicePart) => {
    const baseClass = 'relative w-full p-6 rounded-xl border-2 text-left transition-all duration-300 ';

    if (!isAnswered) {
      if (selectedAnswer === option) {
        return baseClass + 'border-primary-500 bg-primary-50 shadow-md scale-[1.02]';
      }
      return baseClass + 'border-wood-200 bg-white hover:border-primary-300 hover:shadow-md cursor-pointer';
    }

    if (option === correctAnswer) {
      return baseClass + 'border-green-500 bg-green-50 animate-bounce-in';
    }

    if (selectedAnswer === option && option !== correctAnswer) {
      return baseClass + 'border-red-500 bg-red-50 animate-shake';
    }

    return baseClass + 'border-gray-200 bg-gray-50 opacity-50';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-wood-200">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-3 py-1 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
          {getModeName(mode)}
        </span>
      </div>

      <h3 className="text-xl font-display font-bold text-heritage-text mb-6">
        {questionText}
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {(['high', 'low'] as VoicePart[]).map((part) => (
          <button
            key={part}
            onClick={() => !isAnswered && onSelectAnswer(part)}
            disabled={isAnswered}
            className={getOptionClass(part)}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-4 h-4 rounded-full ${
                    part === 'high' ? 'bg-primary-500' : 'bg-wood-400'
                  }`}></span>
                  <span className="text-lg font-bold text-heritage-text">
                    {getVoicePartName(part)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {part === 'high'
                    ? '音调较高，明亮清澈'
                    : '音调较低，深沉厚重'}
                </p>
              </div>

              {isAnswered && part === correctAnswer && (
                <CheckCircle2 size={24} className="text-green-500 flex-shrink-0" />
              )}
              {isAnswered && selectedAnswer === part && part !== correctAnswer && (
                <XCircle size={24} className="text-red-500 flex-shrink-0" />
              )}
            </div>

            {selectedAnswer === part && !isAnswered && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-b-xl" />
            )}
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        {!isAnswered ? (
          <button
            onClick={onSubmit}
            disabled={!selectedAnswer}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            提交答案
          </button>
        ) : (
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-wood-400 to-wood-500 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            下一题
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
