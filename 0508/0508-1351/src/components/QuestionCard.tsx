import { motion } from 'framer-motion';
import { SolarTerm } from '../models/solarTerm';

interface QuestionCardProps {
  solarTerm: SolarTerm;
}

export function QuestionCard({ solarTerm }: QuestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative mb-12"
    >
      <div className="cloud-decoration cloud-decoration-top font-calligraphy text-ink-600">
        云
      </div>
      <div className="cloud-decoration cloud-decoration-bottom font-calligraphy text-ink-600">
        气
      </div>

      <div className="bg-parchment-50 rounded-3xl p-10 card-shadow relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-ink-400 via-ink-600 to-ink-400 opacity-60" />
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-ink-400 via-ink-600 to-ink-400 opacity-60" />

        <div className="absolute top-4 left-4 w-16 h-16 border-l-4 border-t-4 border-ink-300 rounded-tl-3xl opacity-50" />
        <div className="absolute top-4 right-4 w-16 h-16 border-r-4 border-t-4 border-ink-300 rounded-tr-3xl opacity-50" />
        <div className="absolute bottom-4 left-4 w-16 h-16 border-l-4 border-b-4 border-ink-300 rounded-bl-3xl opacity-50" />
        <div className="absolute bottom-4 right-4 w-16 h-16 border-r-4 border-b-4 border-ink-300 rounded-br-3xl opacity-50" />

        <div className="text-center relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-ink-400 text-sm tracking-widest mb-4 font-serif-sc"
          >
            ━━━ 请选择以下哪个物候属于 ━━━
          </motion.div>

          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="font-calligraphy text-7xl md:text-8xl text-ink-800 mb-6 scroll-reveal"
          >
            {solarTerm.name}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-2 text-ink-500"
          >
            <span className="w-12 h-px bg-ink-300" />
            <span className="text-sm tracking-wider">二十四节气</span>
            <span className="w-12 h-px bg-ink-300" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
