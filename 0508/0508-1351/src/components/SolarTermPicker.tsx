import { motion } from 'framer-motion';
import { SOLAR_TERMS } from '../data/solarTerms';
import { PracticeRecords } from '../models/solarTerm';

interface SolarTermPickerProps {
  onSelect: (solarTermId: string) => void;
  onBack: () => void;
  records: PracticeRecords;
}

export function SolarTermPicker({ onSelect, onBack, records }: SolarTermPickerProps) {
  return (
    <div className="min-h-screen bg-texture py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-calligraphy text-4xl md:text-5xl text-ink-800 mb-3">
            选择节气
          </h1>
          <p className="text-ink-500 font-serif-sc">
            点击任意节气开始练习，不计分，可反复作答
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {SOLAR_TERMS.map((term, index) => {
            const record = records[term.id];
            const practiceCount = record?.practiceCount ?? 0;
            const correctCount = record?.correctCount ?? 0;
            const accuracy = practiceCount > 0 ? Math.round((correctCount / practiceCount) * 100) : null;

            return (
              <motion.button
                key={term.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                onClick={() => onSelect(term.id)}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                className="group relative bg-parchment-50 rounded-2xl p-5 card-shadow card-shadow-hover transition-all duration-300 text-center"
              >
                {accuracy !== null && (
                  <div className="absolute -top-2 -right-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        accuracy >= 80
                          ? 'bg-jade-500 text-white'
                          : accuracy >= 50
                          ? 'bg-gold-500 text-white'
                          : 'bg-cinnabar-400 text-white'
                      }`}
                    >
                      {accuracy}%
                    </span>
                  </div>
                )}

                <div className="font-calligraphy text-3xl md:text-4xl text-ink-800 mb-2 group-hover:text-ink-600 transition-colors">
                  {term.name}
                </div>

                {practiceCount > 0 ? (
                  <div className="text-ink-400 text-xs font-serif-sc">
                    练习 {practiceCount} 次
                  </div>
                ) : (
                  <div className="text-ink-300 text-xs font-serif-sc">
                    未练习
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {Object.keys(records).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-parchment-100 rounded-2xl p-6 card-shadow mb-8"
          >
            <h3 className="text-ink-700 font-serif-sc font-semibold mb-4 text-center">
              📊 练习统计总览
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="font-calligraphy text-3xl text-ink-800">
                  {Object.values(records).reduce((sum, r) => sum + r.practiceCount, 0)}
                </div>
                <div className="text-ink-500 text-sm font-serif-sc">总练习次数</div>
              </div>
              <div>
                <div className="font-calligraphy text-3xl text-jade-600">
                  {Object.values(records).reduce((sum, r) => sum + r.correctCount, 0)}
                </div>
                <div className="text-ink-500 text-sm font-serif-sc">总正确次数</div>
              </div>
              <div>
                <div className="font-calligraphy text-3xl text-gold-500">
                  {(() => {
                    const totalPractice = Object.values(records).reduce((s, r) => s + r.practiceCount, 0);
                    const totalCorrect = Object.values(records).reduce((s, r) => s + r.correctCount, 0);
                    return totalPractice > 0 ? Math.round((totalCorrect / totalPractice) * 100) + '%' : '--';
                  })()}
                </div>
                <div className="text-ink-500 text-sm font-serif-sc">总正确率</div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <button
            onClick={onBack}
            className="px-8 py-3 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-xl font-serif-sc font-semibold transition-all duration-300 hover:scale-105"
          >
            ← 返回首页
          </button>
        </motion.div>
      </div>
    </div>
  );
}
