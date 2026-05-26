import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import { Question } from '@/types';
import { getWeightedRandomQuestions } from '@/data/questions';
import { CheckCircle, XCircle, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

const PracticePage = () => {
  const { questions, wrongQuestions, addWrongQuestion, updateStudyStats } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [showResult, setShowResult] = useState(false);

  const loadQuestions = useCallback(() => {
    const weightedQuestions = getWeightedRandomQuestions(20, {
      wrongQuestions,
      wrongQuestionRatio: 0.5,
      weightDecayRate: 0.4
    });
    setPracticeQuestions(weightedQuestions);
  }, [wrongQuestions]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const currentQuestion = practiceQuestions[currentIndex];

  const handleSelectAnswer = (answer: string) => {
    if (isSubmitted) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = useCallback(() => {
    if (!selectedAnswer || !currentQuestion) return;
    
    setIsSubmitted(true);
    const isCorrect = selectedAnswer === currentQuestion.answer;
    updateStudyStats(isCorrect);
    
    if (!isCorrect) {
      addWrongQuestion(currentQuestion.id);
    }
  }, [selectedAnswer, currentQuestion, updateStudyStats, addWrongQuestion]);

  const handleNext = () => {
    if (currentIndex < practiceQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setIsSubmitted(false);
    } else {
      setShowResult(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(null);
      setIsSubmitted(false);
    }
  };

  const handleRestart = () => {
    loadQuestions();
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setShowResult(false);
  };

  if (practiceQuestions.length === 0) {
    return <div className="card text-center">加载中...</div>;
  }

  if (showResult) {
    return (
      <div className="card text-center space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">练习完成！</h2>
        <p className="text-gray-600">你已经完成了这组练习</p>
        <button onClick={handleRestart} className="btn-primary inline-flex items-center space-x-2">
          <RotateCcw className="w-5 h-5" />
          <span>再练一组</span>
        </button>
      </div>
    );
  }

  const getOptionClass = (option: string) => {
    if (!isSubmitted) {
      return `option-btn ${selectedAnswer === option ? 'selected' : ''}`;
    }
    
    if (option === currentQuestion.answer) {
      return 'option-btn correct';
    }
    
    if (selectedAnswer === option && option !== currentQuestion.answer) {
      return 'option-btn wrong';
    }
    
    return 'option-btn opacity-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">顺序练习</h2>
        <div className="text-gray-500">
          第 {currentIndex + 1} / {practiceQuestions.length} 题
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / practiceQuestions.length) * 100}%` }}
        />
      </div>

      <div className="card">
        <div className="mb-2 text-sm text-gray-500">{currentQuestion.chapters.join(' · ')}</div>
        <p className="text-lg font-medium text-gray-800 mb-6">{currentQuestion.question}</p>

        <div className="space-y-3">
          {['A', 'B', 'C', 'D'].map((option) => (
            <button
              key={option}
              onClick={() => handleSelectAnswer(option)}
              className={getOptionClass(option)}
              disabled={isSubmitted}
            >
              <span className="font-medium mr-2">{option}.</span>
              {currentQuestion[`option${option}` as keyof Question]}
              {isSubmitted && option === currentQuestion.answer && (
                <CheckCircle className="w-5 h-5 text-green-500 float-right" />
              )}
              {isSubmitted && selectedAnswer === option && option !== currentQuestion.answer && (
                <XCircle className="w-5 h-5 text-red-500 float-right" />
              )}
            </button>
          ))}
        </div>

        {isSubmitted && (
          <div className={`mt-6 p-4 rounded-lg ${selectedAnswer === currentQuestion.answer ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center space-x-2 mb-2">
              {selectedAnswer === currentQuestion.answer ? (
                <><CheckCircle className="w-5 h-5 text-green-500" /><span className="font-medium text-green-700">回答正确！</span></>
              ) : (
                <><XCircle className="w-5 h-5 text-red-500" /><span className="font-medium text-red-700">回答错误</span></>
              )}
            </div>
            <p className="text-gray-700">
              <span className="font-medium">解析：</span>{currentQuestion.explanation}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="btn-secondary inline-flex items-center space-x-2 disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>上一题</span>
        </button>

        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            className="btn-primary disabled:opacity-50"
          >
            提交答案
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <span>{currentIndex < practiceQuestions.length - 1 ? '下一题' : '完成'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default PracticePage;
