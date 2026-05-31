import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SolarTerm } from '../models/solarTerm';

interface HintPanelProps {
  solarTerm: SolarTerm;
}

export function HintPanel({ solarTerm }: HintPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="w-full max-w-3xl mx-auto mt-8"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-ink-50 hover:bg-ink-100 rounded-xl p-4 card-shadow transition-all duration-300"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <span className="text-ink-700 font-serif-sc font-semibold">
              查看农谚与习俗提示
            </span>
          </div>
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-ink-500 text-xl"
          >
            ▼
          </motion.span>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 bg-parchment-100 rounded-xl p-6 card-shadow">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🌾</span>
                    <h3 className="text-ink-700 font-serif-sc font-semibold text-lg">
                      农谚
                    </h3>
                  </div>
                  <p className="text-ink-600 font-serif-sc leading-relaxed pl-8">
                    "{solarTerm.farmerProverb}"
                  </p>
                </div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-ink-300 to-transparent" />

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🎊</span>
                    <h3 className="text-ink-700 font-serif-sc font-semibold text-lg">
                      习俗
                    </h3>
                  </div>
                  <p className="text-ink-600 font-serif-sc leading-relaxed pl-8">
                    {solarTerm.customs}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
