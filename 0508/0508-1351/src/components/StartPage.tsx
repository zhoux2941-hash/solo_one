import { motion } from 'framer-motion';
import { TOTAL_QUESTIONS, CORRECT_SCORE, WRONG_SCORE } from '../data/solarTerms';

interface StartPageProps {
  onStartExam: () => void;
  onStartPractice: () => void;
}

export function StartPage({ onStartExam, onStartPractice }: StartPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-texture">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="relative bg-parchment-50 rounded-3xl p-10 max-w-lg w-full card-shadow text-center"
      >
        <div className="cloud-decoration cloud-decoration-top font-calligraphy text-ink-600">
          春
        </div>
        <div className="cloud-decoration cloud-decoration-bottom font-calligraphy text-ink-600">
          秋
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="text-8xl mb-6"
        >
          🎋
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-calligraphy text-5xl md:text-6xl text-ink-800 mb-4"
        >
          节气物候
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="font-calligraphy text-3xl md:text-4xl text-ink-600 mb-8"
        >
          配对练习
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            onClick={onStartExam}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group relative overflow-hidden bg-gradient-to-br from-ink-700 to-ink-800 text-white rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-ink-600 to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
            <div className="text-3xl mb-3">📝</div>
            <h3 className="font-serif-sc font-bold text-xl mb-2">考试模式</h3>
            <p className="text-ink-200 text-sm leading-relaxed">
              {TOTAL_QUESTIONS}题限时作答
              <br />
              答对 +{CORRECT_SCORE} · 答错 {WRONG_SCORE}
              <br />
              最终看总分
            </p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            onClick={onStartPractice}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group relative overflow-hidden bg-gradient-to-br from-gold-500 to-gold-600 text-white rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gold-400 to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
            <div className="text-3xl mb-3">🌿</div>
            <h3 className="font-serif-sc font-bold text-xl mb-2">练习模式</h3>
            <p className="text-gold-100 text-sm leading-relaxed">
              自选节气反复练
              <br />
              不计分不扣分
              <br />
              记录练习次数与正确率
            </p>
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-ink-400 text-xs font-serif-sc"
        >
          二十四节气 · 中华传统文化
        </motion.div>
      </motion.div>
    </div>
  );
}
