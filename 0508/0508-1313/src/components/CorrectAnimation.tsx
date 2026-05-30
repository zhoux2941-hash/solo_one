import { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface CorrectAnimationProps {
  show: boolean;
  onComplete?: () => void;
}

export const CorrectAnimation = ({ show, onComplete }: CorrectAnimationProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="relative animate-bounce">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 bg-amber-400/30 rounded-full animate-ping" />
        </div>
        <div className="relative bg-gradient-to-br from-amber-500 to-yellow-500 p-8 rounded-3xl shadow-2xl">
          <CheckCircle2 className="w-24 h-24 text-white" />
          <Sparkles className="absolute top-2 right-2 w-8 h-8 text-yellow-200 animate-pulse" />
          <Sparkles className="absolute bottom-2 left-2 w-6 h-6 text-yellow-200 animate-pulse" />
        </div>
        <div className="text-center mt-6">
          <div className="text-4xl font-bold text-amber-300 drop-shadow-lg">正确！</div>
          <div className="text-lg text-amber-200/80 mt-2">太棒了！</div>
        </div>
      </div>
    </div>
  );
};
