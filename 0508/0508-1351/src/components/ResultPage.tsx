import { motion } from 'framer-motion';
import { CORRECT_SCORE, TOTAL_QUESTIONS } from '../data/solarTerms';

interface ResultPageProps {
  score: number;
  onRestart: () => void;
}

export function ResultPage({ score, onRestart }: ResultPageProps) {
  const maxScore = CORRECT_SCORE * TOTAL_QUESTIONS;
  const percentage = Math.max(0, Math.min(100, (score / maxScore) * 100));

  const getGrade = () => {
    if (percentage >= 90) return { text: '博学多才', emoji: '🏆', color: 'text-gold-500' };
    if (percentage >= 70) return { text: '学有所成', emoji: '🌟', color: 'text-jade-500' };
    if (percentage >= 50) return { text: '初窥门径', emoji: '📚', color: 'text-ink-600' };
    return { text: '继续努力', emoji: '💪', color: 'text-ink-500' };
  };

  const grade = getGrade();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center p-4 bg-texture"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="relative bg-parchment-50 rounded-3xl p-10 max-w-lg w-full card-shadow text-center"
      >
        <div className="cloud-decoration cloud-decoration-top font-calligraphy text-ink-600">
          韵
        </div>
        <div className="cloud-decoration cloud-decoration-bottom font-calligraphy text-ink-600">
          味
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="text-8xl mb-6"
        >
          {grade.emoji}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-calligraphy text-5xl text-ink-800 mb-4"
        >
          练习完成
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`text-2xl font-serif-sc font-semibold mb-8 ${grade.color}`}
        >
          {grade.text}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="bg-gradient-to-br from-ink-50 to-ink-100 rounded-2xl p-8 mb-8"
        >
          <div className="text-ink-500 text-sm mb-2">最终得分</div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7, type: 'spring' }}
            className="font-calligraphy text-7xl text-ink-800 mb-2"
          >
            {score}
          </motion.div>
          <div className="text-ink-400 text-sm">满分 {maxScore} 分</div>

          <div className="mt-6 w-full h-4 bg-ink-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-ink-500 via-ink-600 to-gold-500 rounded-full"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-ink-500 text-sm mb-8 font-serif-sc"
        >
          共完成 {TOTAL_QUESTIONS} 道题目
          <br />
          答对 +10 分，答错 -5 分
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          onClick={onRestart}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-10 py-4 bg-gradient-to-r from-ink-700 to-ink-800 hover:from-ink-800 hover:to-ink-900 text-white rounded-2xl font-serif-sc font-semibold text-lg transition-all duration-300 card-shadow hover:shadow-lg"
        >
          🔄 重新开始
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
