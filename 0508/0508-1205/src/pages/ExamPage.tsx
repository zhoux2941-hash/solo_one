import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { Question, ExamRecord } from '@/types';
import { getWeightedRandomQuestions } from '@/data/questions';
import { generateExamId, formatTime, calculateScore, calculateChapterScores, formatDate } from '@/utils/examUtils';
import { Clock, Flag, ChevronLeft, ChevronRight, Send } from 'lucide-react';

const EXAM_DURATION = 45 * 60;
const EXAM_QUESTIONS_COUNT = 100;

const ExamPage = () => {
  const navigate = useNavigate();
  const { addExamRecord, addWrongQuestion, wrongQuestions } = useAppStore();
  
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string | null>>({});
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [isStarted, setIsStarted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!isStarted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted]);

  const startExam = () => {
    const questions = getWeightedRandomQuestions(EXAM_QUESTIONS_COUNT, {
      wrongQuestions,
      wrongQuestionRatio: 0.3,
      weightDecayRate: 0.5
    });
    setExamQuestions(questions);
    const initialAnswers: Record<number, string | null> = {};
    questions.forEach((q) => {
      initialAnswers[q.id] = null;
    });
    setUserAnswers(initialAnswers);
    setIsStarted(true);
    setTimeLeft(EXAM_DURATION);
  };

  const handleSelectAnswer = (questionId: number, answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const toggleMark = (questionId: number) => {
    setMarkedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmit = useCallback((isTimeUp = false) => {
    const correctAnswers: Record<number, string> = {};
    examQuestions.forEach((q) => {
      correctAnswers[q.id] = q.answer;
    });

    let correctCount = 0;
    const wrongQuestionIds: number[] = [];

    examQuestions.forEach((q) => {
      const userAnswer = userAnswers[q.id];
      if (userAnswer === q.answer) {
        correctCount++;
      } else {
        wrongQuestionIds.push(q.id);
        addWrongQuestion(q.id);
      }
    });

    const score = calculateScore(correctCount, examQuestions.length);
    const chapterScores = calculateChapterScores(examQuestions, userAnswers, correctAnswers);

    const record: ExamRecord = {
      id: generateExamId(),
      score,
      totalQuestions: examQuestions.length,
      correctCount,
      date: formatDate(new Date()),
      wrongQuestions: wrongQuestionIds,
      chapterScores,
    };

    addExamRecord(record);
    navigate(`/exam/result/${record.id}`);
  }, [examQuestions, userAnswers, addExamRecord, addWrongQuestion, navigate]);

  if (!isStarted) {
    return (
      <div className="card text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">模拟考试</h2>
        <div className="text-gray-600 space-y-2 mb-8">
          <p>考试时间：45分钟</p>
          <p>题目数量：100道题</p>
          <p>及格分数：90分</p>
        </div>
        <button onClick={startExam} className="btn-primary text-lg px-8 py-4">
          开始考试
        </button>
      </div>
    );
  }

  const currentQuestion = examQuestions[currentIndex];
  const answeredCount = Object.values(userAnswers).filter((a) => a !== null).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${timeLeft < 300 ? 'text-red-600' : 'text-gray-700'}`}>
            <Clock className="w-5 h-5" />
            <span className="text-lg font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
          <div className="text-gray-600">
            已答 {answeredCount} / {examQuestions.length} 题
          </div>
        </div>
        <button onClick={() => setShowConfirm(true)} className="btn-primary inline-flex items-center space-x-2">
          <Send className="w-4 h-4" />
          <span>交卷</span>
        </button>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(answeredCount / examQuestions.length) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-gray-800">
                  第 {currentIndex + 1} 题
                </span>
                <span className="text-sm text-gray-500">{currentQuestion.chapters.join(' · ')}</span>
              </div>
              <button
                onClick={() => toggleMark(currentQuestion.id)}
                className={`p-2 rounded-lg transition-colors ${
                  markedQuestions.has(currentQuestion.id)
                    ? 'bg-orange-100 text-orange-600'
                    : 'text-gray-400 hover:text-orange-500'
                }`}
              >
                <Flag className="w-5 h-5" />
              </button>
            </div>

            <p className="text-lg font-medium text-gray-800 mb-6">{currentQuestion.question}</p>

            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelectAnswer(currentQuestion.id, option)}
                  className={`option-btn ${userAnswers[currentQuestion.id] === option ? 'selected' : ''}`}
                >
                  <span className="font-medium mr-2">{option}.</span>
                  {currentQuestion[`option${option}` as keyof Question]}
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="btn-secondary inline-flex items-center space-x-2 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>上一题</span>
              </button>
              <button
                onClick={() => setCurrentIndex(Math.min(examQuestions.length - 1, currentIndex + 1))}
                disabled={currentIndex === examQuestions.length - 1}
                className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50"
              >
                <span>下一题</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">答题卡</h3>
          <div className="grid grid-cols-5 gap-2">
            {examQuestions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(index)}
                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                  index === currentIndex
                    ? 'bg-blue-600 text-white'
                    : userAnswers[q.id]
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${markedQuestions.has(q.id) ? 'ring-2 ring-orange-400' : ''}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 rounded" />
              <span className="text-gray-600">已答</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 rounded" />
              <span className="text-gray-600">未答</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-400 rounded" />
              <span className="text-gray-600">标记</span>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">确认交卷</h3>
            <p className="text-gray-600 mb-6">
              你还有 {examQuestions.length - answeredCount} 道题未作答，确定要交卷吗？
            </p>
            <div className="flex justify-end space-x-4">
              <button onClick={() => setShowConfirm(false)} className="btn-secondary">
                继续答题
              </button>
              <button onClick={() => handleSubmit(false)} className="btn-primary">
                确认交卷
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPage;
