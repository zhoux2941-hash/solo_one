import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { questions } from "@/data/questions";
import { useAssessmentStore } from "@/store/useAssessmentStore";

const scoreOptions = [
  { value: 1, label: "没有", description: "根本不" },
  { value: 2, label: "很少", description: "很少" },
  { value: 3, label: "有时", description: "有一些" },
  { value: 4, label: "经常", description: "比较多" },
  { value: 5, label: "总是", description: "非常多" },
];

export default function Questionnaire() {
  const navigate = useNavigate();
  const {
    answers,
    currentQuestionIndex,
    setAnswer,
    setCurrentQuestionIndex,
    submitAssessment,
  } = useAssessmentStore();

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const selectedScore = answers[currentQuestion.id];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const allAnswered = Object.keys(answers).length === questions.length;

  const handleSelectScore = (score: number) => {
    setAnswer(currentQuestion.id, score);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    submitAssessment();
    navigate("/result");
  };

  const handleGoToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f0e6] to-[#e8e0d0] py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-[#6b8e9e]">
              第 {currentQuestionIndex + 1} 题 / 共 {questions.length} 题
            </span>
            <span className="text-sm text-[#c9a962]">
              已答 {Object.keys(answers).length} / {questions.length}
            </span>
          </div>
          <div className="w-full h-2 bg-[#e5dcc8] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#c9a962] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="mb-8">
            <div className="flex items-start gap-3">
              <span
                className="flex-shrink-0 w-10 h-10 rounded-full bg-[#2d5a4a] text-white flex items-center justify-center font-bold text-lg"
              >
                {currentQuestionIndex + 1}
              </span>
              <h2
                className="text-2xl font-bold text-[#2d5a4a] leading-relaxed pt-1"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                {currentQuestion.text}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {scoreOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelectScore(option.value)}
                className={`relative flex flex-col items-center justify-center py-6 px-2 rounded-xl border-2 transition-all duration-200 ${
                  selectedScore === option.value
                    ? "border-[#c9a962] bg-[#c9a962]/10 shadow-md scale-105"
                    : "border-[#e5dcc8] hover:border-[#c9a962]/60 hover:bg-[#c9a962]/5"
                }`}
              >
                <span
                  className={`text-3xl font-bold mb-1 ${
                    selectedScore === option.value
                      ? "text-[#c9a962]"
                      : "text-[#6b8e9e]"
                  }`}
                >
                  {option.value}
                </span>
                <span
                  className={`text-sm font-medium ${
                    selectedScore === option.value
                      ? "text-[#2d5a4a]"
                      : "text-gray-500"
                  }`}
                >
                  {option.label}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  {option.description}
                </span>
                {selectedScore === option.value && (
                  <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-[#c9a962]" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">题目导航</span>
            <span className="text-xs text-gray-400">点击跳转题目</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {questions.map((_, index) => {
              const isAnswered = answers[questions[index].id] !== undefined;
              const isCurrent = index === currentQuestionIndex;
              return (
                <button
                  key={index}
                  onClick={() => handleGoToQuestion(index)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isCurrent
                      ? "bg-[#c9a962] text-[#2d5a4a] scale-110 shadow-md"
                      : isAnswered
                      ? "bg-[#2d5a4a] text-white hover:bg-[#3d6a5a]"
                      : "bg-[#f5f0e6] text-gray-500 hover:bg-[#e5dcc8]"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              currentQuestionIndex === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-[#2d5a4a] border-2 border-[#2d5a4a] hover:bg-[#2d5a4a] hover:text-white"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            上一题
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all duration-200 ${
                allAnswered
                  ? "bg-[#2d5a4a] text-white hover:bg-[#3d6a5a] hover:shadow-lg hover:-translate-y-0.5"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              提交测评
              <CheckCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={selectedScore === undefined}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all duration-200 ${
                selectedScore !== undefined
                  ? "bg-[#c9a962] text-[#2d5a4a] hover:bg-[#d4b872] hover:shadow-lg hover:-translate-y-0.5"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              下一题
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
