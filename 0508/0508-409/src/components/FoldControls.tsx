import { ArrowRightLeft, ArrowUpDown, Scissors, RotateCcw, Check } from 'lucide-react';
import { usePaperCuttingStore } from '../store/usePaperCuttingStore';
import { FOLD_ACTIONS } from '../types';

export function FoldControls() {
  const { currentFoldStep, fold, reset, isAnimating, isUnfolding, showFinalResult } = usePaperCuttingStore();

  const isDisabled = isAnimating || isUnfolding || showFinalResult;

  const getFoldIcon = (index: number) => {
    switch (index) {
      case 0:
        return <ArrowRightLeft className="w-5 h-5" />;
      case 1:
        return <ArrowUpDown className="w-5 h-5" />;
      case 2:
        return <Scissors className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getStepStatus = (index: number) => {
    if (currentFoldStep > index) return 'completed';
    if (currentFoldStep === index) return 'current';
    return 'pending';
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-chinese-gold/20">
      <h3 className="text-xl font-kai text-chinese-brown text-center border-b border-chinese-gold/30 pb-3 mb-2">
        折叠步骤
      </h3>

      <div className="flex flex-col gap-3">
        {FOLD_ACTIONS.map((action, index) => {
          const status = getStepStatus(index);
          const isButtonDisabled = isDisabled || currentFoldStep !== index;

          return (
            <div key={action.type} className="relative">
              <button
                onClick={fold}
                disabled={isButtonDisabled}
                className={`w-full flex items-center gap-3 p-4 rounded-lg transition-all duration-300 ${
                  status === 'completed'
                    ? 'bg-green-50 border-2 border-green-400 text-green-700'
                    : status === 'current'
                    ? 'btn-chinese cursor-pointer'
                    : 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    status === 'completed'
                      ? 'bg-green-500 text-white'
                      : status === 'current'
                      ? 'bg-chinese-gold/30 text-paper'
                      : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  {status === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-lg font-bold">{index + 1}</span>
                  )}
                </div>

                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    {status !== 'completed' && getFoldIcon(index)}
                    <span className="font-kai text-lg">{action.label}</span>
                  </div>
                  <p className={`text-xs mt-1 ${status === 'current' ? 'text-paper/80' : 'text-gray-500'}`}>
                    {action.description}
                  </p>
                </div>

                {status === 'current' && (
                  <div className="w-2 h-2 rounded-full bg-chinese-gold animate-ping" />
                )}
              </button>

              {index < FOLD_ACTIONS.length - 1 && (
                <div className="absolute left-6 -bottom-2 w-0.5 h-4 bg-gradient-to-b from-chinese-gold/50 to-transparent z-0" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-chinese-gold/30">
        <div className="flex items-center justify-between text-sm text-chinese-brown/70 mb-3">
          <span>当前进度</span>
          <span className="font-bold">{currentFoldStep} / 3</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-chinese-red to-chinese-gold transition-all duration-500 rounded-full"
            style={{ width: `${(currentFoldStep / 3) * 100}%` }}
          />
        </div>
      </div>

      <button
        onClick={reset}
        disabled={isAnimating && !showFinalResult}
        className="flex items-center justify-center gap-2 w-full mt-2 p-3 rounded-lg border-2 border-chinese-brown/30 text-chinese-brown hover:bg-chinese-brown/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RotateCcw className="w-4 h-4" />
        <span className="font-song">重新开始</span>
      </button>
    </div>
  );
}
