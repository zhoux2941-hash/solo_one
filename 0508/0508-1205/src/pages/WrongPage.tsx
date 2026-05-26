import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Question } from '@/types';
import { AlertTriangle, ArrowUpDown, Trash2, RotateCcw, Play } from 'lucide-react';

const WrongPage = () => {
  const { wrongQuestions, getQuestionById, clearWrongQuestion } = useAppStore();
  const [sortBy, setSortBy] = useState<'count' | 'date'>('count');
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const sortedWrongQuestions = [...wrongQuestions].sort((a, b) => {
    if (sortBy === 'count') {
      return b.wrongCount - a.wrongCount;
    }
    return new Date(b.lastWrongDate).getTime() - new Date(a.lastWrongDate).getTime();
  });

  const wrongQuestionsWithDetails: Array<{
    wrong: typeof wrongQuestions[0];
    question: Question | undefined;
  }> = sortedWrongQuestions.map(wq => ({
    wrong: wq,
    question: getQuestionById(wq.questionId)
  })).filter(item => item.question !== undefined);

  const currentPracticeItem = wrongQuestionsWithDetails[currentPracticeIndex];

  const handlePracticeSelectAnswer = (answer: string) => {
    if (isSubmitted) return;
    setSelectedAnswer(answer);
  };

  const handlePracticeSubmit = () => {
    if (!selectedAnswer || !currentPracticeItem?.question) return;
    setIsSubmitted(true);
    
    if (selectedAnswer === currentPracticeItem.question.answer) {
      clearWrongQuestion(currentPracticeItem.wrong.questionId);
    }
  };

  const handleNextPractice = () => {
    if (currentPracticeIndex < wrongQuestionsWithDetails.length - 1) {
      setCurrentPracticeIndex(currentPracticeIndex + 1);
      setSelectedAnswer(null);
      setIsSubmitted(false);
    } else {
      setPracticeMode(false);
      setCurrentPracticeIndex(0);
      setSelectedAnswer(null);
      setIsSubmitted(false);
    }
  };

  const startPractice = () => {
    if (wrongQuestionsWithDetails.length === 0) return;
    setPracticeMode(true);
    setCurrentPracticeIndex(0);
    setSelectedAnswer(null);
    setIsSubmitted(false);
  };

  if (practiceMode && currentPracticeItem?.question) {
    const question = currentPracticeItem.question;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">错题练习</h2>
          <button onClick={() => setPracticeMode(false)} className="text-gray-500 hover:text-gray-700">
            返回错题本
          </button>
        </div>

        <div className="text-gray-500 text-sm">
          第 {currentPracticeIndex + 1} / {wrongQuestionsWithDetails.length} 题
          （错误次数：{currentPracticeItem.wrong.wrongCount}次）
        </div>

        <div className="card">
          <div className="mb-2 text-sm text-gray-500">{question.chapters.join(' · ')}</div>
          <p className="text-lg font-medium text-gray-800 mb-6">{question.question}</p>

          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map((option) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === question.answer;
              const isWrong = isSelected && !isCorrect;

              let className = 'option-btn';
              if (isSubmitted) {
                if (isCorrect) className = 'option-btn correct';
                else if (isWrong) className = 'option-btn wrong';
                else className = 'option-btn opacity-50';
              } else if (isSelected) {
                className = 'option-btn selected';
              }

              return (
                <button
                  key={option}
                  onClick={() => handlePracticeSelectAnswer(option)}
                  className={className}
                  disabled={isSubmitted}
                >
                  <span className="font-medium mr-2">{option}.</span>
                  {question[`option${option}` as keyof Question]}
                </button>
              );
            })}
          </div>

          {isSubmitted && (
            <div className={`mt-6 p-4 rounded-lg ${selectedAnswer === question.answer ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className="font-medium mb-2">
                {selectedAnswer === question.answer ? '回答正确，已从错题本移除' : '回答错误，请继续复习'}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">解析：</span>{question.explanation}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          {!isSubmitted ? (
            <button onClick={handlePracticeSubmit} disabled={!selectedAnswer} className="btn-primary disabled:opacity-50">
              提交答案
            </button>
          ) : (
            <button onClick={handleNextPractice} className="btn-primary">
              {currentPracticeIndex < wrongQuestionsWithDetails.length - 1 ? '下一题' : '完成练习'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
          <AlertTriangle className="w-6 h-6 text-orange-500" />
          <span>错题本</span>
          <span className="text-gray-500 text-base">（{wrongQuestions.length}道）</span>
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSortBy(sortBy === 'count' ? 'date' : 'count')}
            className="inline-flex items-center space-x-1 text-gray-600 hover:text-gray-800"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>{sortBy === 'count' ? '按错误次数' : '按时间'}</span>
          </button>
          <button
            onClick={startPractice}
            disabled={wrongQuestions.length === 0}
            className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span>开始练习</span>
          </button>
        </div>
      </div>

      {wrongQuestionsWithDetails.length === 0 ? (
        <div className="card text-center py-12">
          <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无错题，继续加油！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {wrongQuestionsWithDetails.map(({ wrong, question }) => (
            <div key={wrong.questionId} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm text-gray-500">{question?.chapters.join(' · ')}</span>
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded">
                      错误{wrong.wrongCount}次
                    </span>
                  </div>
                  <p className="text-gray-800">{question?.question}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    正确答案：{question?.answer}
                  </p>
                </div>
                <button
                  onClick={() => clearWrongQuestion(wrong.questionId)}
                  className="text-gray-400 hover:text-red-500 p-2"
                  title="移除此题"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WrongPage;
