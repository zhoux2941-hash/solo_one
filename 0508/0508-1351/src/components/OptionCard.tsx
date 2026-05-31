import { motion } from 'framer-motion';
import { SolarTerm } from '../models/solarTerm';

interface OptionCardProps {
  solarTerm: SolarTerm;
  index: number;
  isSelected: boolean;
  isCorrect: boolean | null;
  showResult: boolean;
  onClick: () => void;
}

export function OptionCard({
  solarTerm,
  index,
  isSelected,
  isCorrect,
  showResult,
  onClick,
}: OptionCardProps) {
  const getCardStyle = () => {
    if (!showResult) {
      return 'bg-parchment-50 hover:bg-parchment-100 cursor-pointer card-shadow-hover';
    }
    if (isSelected && isCorrect) {
      return 'bg-jade-50 border-jade-400 correct-glow';
    }
    if (isSelected && !isCorrect) {
      return 'bg-cinnabar-50 border-cinnabar-400 wrong-glow animate-shake';
    }
    if (!isSelected && isCorrect) {
      return 'bg-jade-50 border-jade-400 correct-glow';
    }
    return 'bg-parchment-50 opacity-50';
  };

  const getLabelStyle = () => {
    if (!showResult) return 'bg-ink-100 text-ink-700';
    if (isSelected && isCorrect) return 'bg-jade-500 text-white';
    if (isSelected && !isCorrect) return 'bg-cinnabar-500 text-white';
    if (!isSelected && isCorrect) return 'bg-jade-500 text-white';
    return 'bg-ink-100 text-ink-700';
  };

  const optionLabels = ['A', 'B', 'C'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.4 }}
      onClick={!showResult ? onClick : undefined}
      className={`
        relative rounded-2xl p-6 transition-all duration-300 transform
        ${!showResult ? 'hover:-translate-y-2 hover:scale-[1.02]' : ''}
        ${getCardStyle()}
        border-2 border-transparent
      `}
    >
      <div className="absolute top-4 left-4">
        <span
          className={`
            w-10 h-10 rounded-full flex items-center justify-center
            font-bold text-lg transition-colors duration-300
            ${getLabelStyle()}
          `}
        >
          {optionLabels[index]}
        </span>
      </div>

      <div className="pt-6">
        <div className="space-y-3">
          {solarTerm.phenology.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 + i * 0.1 }}
              className="phenology-item text-ink-700 font-serif-sc text-lg"
            >
              {item}
            </motion.div>
          ))}
        </div>
      </div>

      {showResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute top-4 right-4"
        >
          {isSelected && isCorrect && (
            <span className="text-3xl">✓</span>
          )}
          {isSelected && !isCorrect && (
            <span className="text-3xl">✗</span>
          )}
          {!isSelected && isCorrect && (
            <span className="text-jade-500 text-sm font-semibold">正确答案</span>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
