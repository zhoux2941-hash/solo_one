import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGame } from './hooks/useGame';
import { usePracticeRecords } from './hooks/usePracticeRecords';
import { StartPage } from './components/StartPage';
import { SolarTermPicker } from './components/SolarTermPicker';
import { ScoreBoard } from './components/ScoreBoard';
import { QuestionCard } from './components/QuestionCard';
import { OptionCard } from './components/OptionCard';
import { HintPanel } from './components/HintPanel';
import { FeedbackModal } from './components/FeedbackModal';
import { PracticeFeedback } from './components/PracticeFeedback';
import { ResultPage } from './components/ResultPage';

type AppView = 'home' | 'picker' | 'playing';

function App() {
  const { state, currentQuestion, startExam, startPractice, submitAnswer, nextQuestion, restartGame, practiceAgain } = useGame();
  const { records, recordAnswer, getRecord, getAccuracy } = usePracticeRecords();
  const [view, setView] = useState<AppView>('home');

  const isGameStarted = state.questions.length > 0;
  const isPractice = state.gameMode === 'practice';

  const handleStartExam = useCallback(() => {
    startExam();
    setView('playing');
  }, [startExam]);

  const handleStartPractice = useCallback(() => {
    setView('picker');
  }, []);

  const handlePickSolarTerm = useCallback((solarTermId: string) => {
    startPractice(solarTermId);
    setView('playing');
  }, [startPractice]);

  const handleBackHome = useCallback(() => {
    restartGame();
    setView('home');
  }, [restartGame]);

  const handleSubmitAnswer = useCallback((answerId: string) => {
    submitAnswer(answerId);
    if (currentQuestion) {
      const isCorrect = answerId === currentQuestion.correctAnswerId;
      if (isPractice && state.practiceSolarTermId) {
        recordAnswer(state.practiceSolarTermId, isCorrect);
      }
    }
  }, [submitAnswer, currentQuestion, isPractice, state.practiceSolarTermId, recordAnswer]);

  const handlePracticeAgain = useCallback(() => {
    if (state.practiceSolarTermId) {
      startPractice(state.practiceSolarTermId);
    }
  }, [state.practiceSolarTermId, startPractice]);

  const handlePickAnother = useCallback(() => {
    restartGame();
    setView('picker');
  }, [restartGame]);

  if (view === 'picker') {
    return (
      <SolarTermPicker
        onSelect={handlePickSolarTerm}
        onBack={handleBackHome}
        records={records}
      />
    );
  }

  if (!isGameStarted || view === 'home') {
    return (
      <StartPage
        onStartExam={handleStartExam}
        onStartPractice={handleStartPractice}
      />
    );
  }

  if (!isPractice && state.isGameOver && state.showFeedback) {
    return (
      <AnimatePresence mode="wait">
        <ResultPage key="result" score={state.score} onRestart={handleBackHome} />
      </AnimatePresence>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const isLastQuestion = state.currentQuestionIndex >= state.totalQuestions - 1;

  return (
    <div className="min-h-screen bg-texture py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {!isPractice && (
          <ScoreBoard
            score={state.score}
            currentQuestion={state.currentQuestionIndex}
            totalQuestions={state.totalQuestions}
          />
        )}

        {isPractice && (
          <div className="w-full max-w-3xl mx-auto mb-8">
            <div className="bg-gold-50 border-2 border-gold-200 rounded-2xl p-4 card-shadow flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌿</span>
                <span className="font-serif-sc font-semibold text-gold-700">练习模式</span>
              </div>
              <button
                onClick={handlePickAnother}
                className="text-gold-600 hover:text-gold-800 font-serif-sc text-sm underline transition-colors"
              >
                换一个节气
              </button>
            </div>
          </div>
        )}

        <QuestionCard solarTerm={currentQuestion.solarTerm} />

        <div key={currentQuestion.id} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {currentQuestion.options.map((option, index) => (
            <OptionCard
              key={option.id}
              solarTerm={option}
              index={index}
              isSelected={state.selectedAnswer === option.id}
              isCorrect={option.id === currentQuestion.correctAnswerId}
              showResult={state.showFeedback}
              onClick={() => handleSubmitAnswer(option.id)}
            />
          ))}
        </div>

        <HintPanel solarTerm={currentQuestion.solarTerm} />

        {isPractice ? (
          <PracticeFeedback
            isOpen={state.showFeedback}
            isCorrect={state.isCorrect ?? false}
            correctAnswer={currentQuestion.solarTerm}
            onPracticeAgain={handlePracticeAgain}
            onPickAnother={handlePickAnother}
            records={records}
            currentSolarTermId={state.practiceSolarTermId!}
          />
        ) : (
          <FeedbackModal
            isOpen={state.showFeedback && !state.isGameOver}
            isCorrect={state.isCorrect ?? false}
            correctAnswer={currentQuestion.solarTerm}
            onNext={nextQuestion}
            isLastQuestion={isLastQuestion}
          />
        )}

        {!isPractice && state.isGameOver && (
          <ResultPage score={state.score} onRestart={handleBackHome} />
        )}
      </div>
    </div>
  );
}

export default App;
