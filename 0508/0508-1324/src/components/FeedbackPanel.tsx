import { CheckCircle, XCircle, Music, BookOpen, Sparkles } from 'lucide-react';
import type { AnswerFeedback } from '@/types';
import { getVoicePartName } from '@/utils/audio';

interface FeedbackPanelProps {
  feedback: AnswerFeedback;
  showUnlockAnimation: boolean;
}

export const FeedbackPanel = ({ feedback, showUnlockAnimation }: FeedbackPanelProps) => {
  return (
    <div className={`rounded-xl p-6 shadow-md border-2 transition-all duration-500 ${
      feedback.isCorrect
        ? 'bg-green-50 border-green-300'
        : 'bg-red-50 border-red-300'
    }`}>
      <div className="flex items-start gap-4 mb-6">
        <div className={`p-3 rounded-full ${
          feedback.isCorrect ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {feedback.isCorrect ? (
            <CheckCircle size={32} className="text-green-600" />
          ) : (
            <XCircle size={32} className="text-red-600" />
          )}
        </div>

        <div className="flex-1">
          <h3 className={`text-2xl font-display font-bold mb-1 ${
            feedback.isCorrect ? 'text-green-700' : 'text-red-700'
          }`}>
            {feedback.isCorrect ? '回答正确！' : '回答错误'}
          </h3>
          <p className="text-gray-600">
            正确答案是 <span className="font-bold text-primary-600">{getVoicePartName(feedback.correctAnswer)}</span>
            {feedback.userAnswer !== feedback.correctAnswer && (
              <span>，您选择了 <span className="font-bold text-red-600">{getVoicePartName(feedback.userAnswer)}</span></span>
            )}
          </p>
        </div>

        {showUnlockAnimation && (
          <div className="relative">
            <Sparkles size={32} className="text-yellow-500 animate-bounce-in" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Music size={18} className="text-primary-600" />
          <span className="font-semibold text-primary-600">解析</span>
        </div>
        <p className="text-gray-700">{feedback.explanation}</p>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={18} className="text-wood-500" />
          <span className="font-semibold text-wood-500">歌词大意</span>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-primary-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">侗语原文</p>
            <p className="font-medium text-primary-700">{feedback.lyrics.dong}</p>
          </div>
          <div className="p-3 bg-wood-100 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">汉语翻译</p>
            <p className="font-medium text-wood-600">{feedback.lyrics.chinese}</p>
          </div>
        </div>
      </div>

      {showUnlockAnimation && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-300 animate-bounce-in">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-600" />
            <span className="font-bold text-yellow-800">
              🎉 恭喜！您已解锁新的非遗背景介绍！
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
