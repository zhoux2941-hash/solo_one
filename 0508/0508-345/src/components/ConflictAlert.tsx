import { AlertTriangle, Users, X, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ConflictDetail } from '../../shared/types';

export function ConflictAlert() {
  const { currentConflict, setCurrentConflict } = useAppStore();

  if (!currentConflict || !currentConflict.hasConflict) {
    return null;
  }

  const roomConflicts = currentConflict.details.filter(
    (d: ConflictDetail) => d.type === 'room'
  );
  const escortConflicts = currentConflict.details.filter(
    (d: ConflictDetail) => d.type === 'escort'
  );

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 mb-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-red-800 text-base">
              检测到资源冲突
            </h3>
            <p className="text-sm text-red-600">
              请调整时段或更换资源
            </p>
          </div>
        </div>
        <button
          onClick={() => setCurrentConflict(null)}
          className="text-red-400 hover:text-red-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {roomConflicts.length > 0 && (
          <div className="flex items-start gap-2 bg-red-100 p-2 rounded">
            <div className="bg-red-200 p-1 rounded">
              <ChevronDown className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <span className="text-sm font-medium text-red-700">
                机房冲突 ({roomConflicts.length})
              </span>
              <div className="text-xs text-red-600">
                {roomConflicts.map((c, i) => (
                  <div key={i}>{c.message}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {escortConflicts.length > 0 && (
          <div className="flex items-start gap-2 bg-amber-100 p-2 rounded">
            <div className="bg-amber-200 p-1 rounded">
              <Users className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <span className="text-sm font-medium text-amber-700">
                陪同人员冲突 ({escortConflicts.length})
              </span>
              <div className="text-xs text-amber-600">
                {escortConflicts.map((c, i) => (
                  <div key={i}>{c.message}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
