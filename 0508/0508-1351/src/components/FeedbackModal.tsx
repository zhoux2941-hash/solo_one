import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SolarTerm } from '../models/solarTerm';

interface FeedbackModalProps {
  isOpen: boolean;
  isCorrect: boolean;
  correctAnswer: SolarTerm;
  onNext: () => void;
  isLastQuestion: boolean;
}

export function FeedbackModal({
  isOpen,
  isCorrect,
  correctAnswer,
  onNext,
  isLastQuestion,
}: FeedbackModalProps) {
  useEffect(() => {
    if (isOpen && isCorrect) {
      const timer = setTimeout(() => {
        onNext();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isCorrect, onNext]);

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
                className={`text-7xl mb-6 ${isCorrect ? 'animate-float' : ''}`}
              >
                {isCorrect ? '🎉' : '😅'}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`font-calligraphy text-4xl mb-4 ${
                  isCorrect ? 'text-jade-600' : 'text-cinnabar-500'
                }`}
              >
                {isCorrect ? '回答正确！' : '回答错误'}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className={`text-xl font-semibold mb-2 ${
                  isCorrect ? 'text-jade-500' : 'text-cinnabar-400'
                }`}
              >
                {isCorrect ? '+10 分' : '-5 分'}
              </motion.p>

              {!isCorrect && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 p-4 bg-ink-50 rounded-xl"
                >
                  <p className="text-ink-600 text-sm mb-2">正确答案：</p>
                  <p className="text-ink-800 font-serif-sc font-semibold">
                    {correctAnswer.phenology.join('、')}
                  </p>
                </motion.div>
              )}

              {!isCorrect && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={onNext}
                  className="mt-8 px-8 py-3 bg-ink-700 hover:bg-ink-800 text-white rounded-xl font-serif-sc font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  {isLastQuestion ? '查看最终成绩' : '下一题 →'}
                </motion.button>
              )}

              {isCorrect && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 text-ink-400 text-sm"
                >
                  自动进入{isLastQuestion ? '最终成绩' : '下一题'}...
                </motion.p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
