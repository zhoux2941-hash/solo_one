import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SolarTerm } from '../models/solarTerm';
import { PracticeRecords } from '../models/solarTerm';

interface PracticeFeedbackProps {
  isOpen: boolean;
  isCorrect: boolean;
  correctAnswer: SolarTerm;
  onPracticeAgain: () => void;
  onPickAnother: () => void;
  records: PracticeRecords;
  currentSolarTermId: string;
}

export function PracticeFeedback({
  isOpen,
  isCorrect,
  correctAnswer,
  onPracticeAgain,
  onPickAnother,
  records,
  currentSolarTermId,
}: PracticeFeedbackProps) {
  const record = records[currentSolarTermId];
  const practiceCount = record?.practiceCount ?? 0;
  const correctCount = record?.correctCount ?? 0;
  const accuracy = practiceCount > 0 ? Math.round((correctCount / practiceCount) * 100) : 0;

  useEffect(() => {
    if (isOpen && isCorrect) {
      const timer = setTimeout(() => {}, 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isCorrect]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-parchment-50 rounded-3xl p-8 max-w-md w-full card-shadow"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className={`text-7xl mb-4 ${isCorrect ? 'animate-float' : ''}`}
              >
                {isCorrect ? '🎉' : '😅'}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`font-calligraphy text-4xl mb-3 ${
                  isCorrect ? 'text-jade-600' : 'text-cinnabar-500'
                }`}
              >
                {isCorrect ? '回答正确！' : '回答错误'}
              </motion.h2>

              {!isCorrect && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-4 p-4 bg-ink-50 rounded-xl"
                >
                  <p className="text-ink-600 text-sm mb-2">正确答案：</p>
                  <p className="text-ink-800 font-serif-sc font-semibold">
                    {correctAnswer.phenology.join('、')}
                  </p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-6 mb-6 text-sm font-serif-sc text-ink-500"
              >
                <span>练习 {practiceCount} 次</span>
                <span>正确 {correctCount} 次</span>
                <span>正确率 {accuracy}%</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex gap-3"
              >
                <button
                  onClick={onPracticeAgain}
                  className="flex-1 px-6 py-3 bg-ink-700 hover:bg-ink-800 text-white rounded-xl font-serif-sc font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  🔄 再练一次
                </button>
                <button
                  onClick={onPickAnother}
                  className="flex-1 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white rounded-xl font-serif-sc font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  🔄 换一个
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
