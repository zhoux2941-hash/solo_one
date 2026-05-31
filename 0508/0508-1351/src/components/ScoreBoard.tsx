import { motion } from 'framer-motion';

interface ScoreBoardProps {
  score: number;
  currentQuestion: number;
  totalQuestions: number;
}

export function ScoreBoard({ score, currentQuestion, totalQuestions }: ScoreBoardProps) {
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto mb-8"
    >
      <div className="bg-parchment-100 rounded-2xl p-6 card-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-ink-600 font-serif-sc text-lg">题目进度</span>
            <span className="bg-ink-100 text-ink-700 px-4 py-2 rounded-full font-semibold">
              {currentQuestion + 1} / {totalQuestions}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-ink-600 font-serif-sc text-lg">当前得分</span>
            <motion.span
              key={score}
              initial={{ scale: 1.2, color: '#b8892f' }}
              animate={{ scale: 1, color: '#1a4d4d' }}
              transition={{ duration: 0.3 }}
              className="bg-gold-100 text-ink-800 px-4 py-2 rounded-full font-bold text-xl"
            >
              {score} 分
            </motion.span>
          </div>
        </div>
        <div className="w-full h-3 bg-ink-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-ink-500 to-ink-700 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
