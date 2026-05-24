import { AlertTriangle, X, Check, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { DiffRecord } from '../../shared/types';
import { formatPosition } from '../utils/format';

interface DiffAlertProps {
  diff: DiffRecord | null;
  onDismiss: () => void;
  onResolve: () => void;
  onApprove?: () => void;
}

export default function DiffAlert({ diff, onDismiss, onResolve, onApprove }: DiffAlertProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (diff) {
      setIsVisible(true);
    }
  }, [diff]);

  if (!diff || !isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in">
      <div className="card p-5 border-l-4 border-amber-500 w-96 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-museum-900">柜位差异警告</h3>
            <p className="text-sm text-museum-600 mt-1">
              标本位置与原柜布局不一致
            </p>

            <div className="mt-3 p-3 bg-museum-50 rounded-lg">
              <p className="text-sm font-medium text-museum-900">{diff.specimenName}</p>
              <p className="text-xs text-museum-500">{diff.specimenCode}</p>
              
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-museum-500">原位置：</span>
                  <span className="font-medium text-forest-600">
                    {formatPosition(diff.expectedPosition)}
                  </span>
                </div>
                <div>
                  <span className="text-museum-500">当前：</span>
                  <span className="font-medium text-amber-600">
                    {formatPosition(diff.actualPosition)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={onResolve}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-museum-600 text-white rounded-lg text-sm font-medium hover:bg-museum-700 transition-colors"
              >
                <Info className="w-4 h-4" />
                记录差异
              </button>
              {onApprove && (
                <button
                  onClick={onApprove}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-forest-600 text-white rounded-lg text-sm font-medium hover:bg-forest-700 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  批准调整
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="p-2 hover:bg-museum-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-museum-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
