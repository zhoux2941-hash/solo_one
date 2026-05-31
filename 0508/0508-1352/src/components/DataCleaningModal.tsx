import React, { useState, useMemo } from 'react';
import { AlertTriangle, X, Wrench, Trash2, Check, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import type { AnomalyRecord, AnomalyAction } from '@/types';
import { formatNumber, cn } from '@/utils';

interface DataCleaningModalProps {
  isOpen: boolean;
  anomalies: AnomalyRecord[];
  onConfirm: (actions: Map<string, AnomalyAction>) => void;
  onCancel: () => void;
}

const anomalyTypeLabels: Record<AnomalyRecord['type'], string> = {
  quantity_too_high: '份数过高',
  quantity_negative: '份数为负',
  price_anomaly: '价格异常',
};

export const DataCleaningModal: React.FC<DataCleaningModalProps> = ({
  isOpen,
  anomalies,
  onConfirm,
  onCancel,
}) => {
  const [selectedActions, setSelectedActions] = useState<Map<string, AnomalyAction>>(new Map());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [batchAction, setBatchAction] = useState<'fix' | 'delete' | 'keep' | ''>('');

  const stats = useMemo(() => {
    const fixCount = Array.from(selectedActions.values()).filter(a => a === 'fix').length;
    const deleteCount = Array.from(selectedActions.values()).filter(a => a === 'delete').length;
    const keepCount = Array.from(selectedActions.values()).filter(a => a === 'keep').length;
    const pendingCount = anomalies.length - fixCount - deleteCount - keepCount;
    return { fixCount, deleteCount, keepCount, pendingCount };
  }, [selectedActions, anomalies.length]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSelectedActions(new Map());
      setExpandedIds(new Set());
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  const handleAction = (anomalyId: string, action: AnomalyAction) => {
    setSelectedActions(prev => {
      const next = new Map(prev);
      next.set(anomalyId, action);
      return next;
    });
  };

  const handleBatchAction = (action: 'fix' | 'delete' | 'keep') => {
    const newActions = new Map(selectedActions);
    anomalies.forEach(anomaly => {
      newActions.set(anomaly.id, action);
    });
    setSelectedActions(newActions);
    setBatchAction(action);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedActions);
  };

  const isAllProcessed = stats.pendingCount === 0;

  if (!isOpen || anomalies.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden bg-white rounded-2xl shadow-2xl animate-slide-up flex flex-col">
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">异常数据检测</h2>
              <p className="text-sm text-gray-500">检测到 {anomalies.length} 条异常记录</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <p className="text-sm text-gray-600 mb-3">
            系统检测到以下记录存在异常，请选择处理方式：
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">批量处理：</span>
            <button
              onClick={() => handleBatchAction('fix')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                batchAction === 'fix'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-primary-700 border border-primary-200 hover:bg-primary-50'
              )}
            >
              <Wrench className="w-4 h-4" />
              全部修正为均值
            </button>
            <button
              onClick={() => handleBatchAction('delete')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                batchAction === 'delete'
                  ? 'bg-accent-600 text-white'
                  : 'bg-white text-accent-700 border border-accent-200 hover:bg-accent-50'
              )}
            >
              <Trash2 className="w-4 h-4" />
              全部删除
            </button>
            <button
              onClick={() => handleBatchAction('keep')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                batchAction === 'keep'
                  ? 'bg-gray-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              )}
            >
              <Check className="w-4 h-4" />
              全部保留
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {anomalies.map((anomaly) => {
              const action = selectedActions.get(anomaly.id);
              const isExpanded = expandedIds.has(anomaly.id);

              return (
                <div
                  key={anomaly.id}
                  className={cn(
                    'border rounded-xl overflow-hidden transition-all',
                    action === 'fix' && 'border-primary-300 bg-primary-50/50',
                    action === 'delete' && 'border-accent-300 bg-accent-50/50',
                    action === 'keep' && 'border-gray-300 bg-gray-50/50',
                    !action && 'border-amber-200 bg-amber-50/30'
                  )}
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => toggleExpand(anomaly.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                        !action && 'bg-amber-200 text-amber-700',
                        action === 'fix' && 'bg-primary-200 text-primary-700',
                        action === 'delete' && 'bg-accent-200 text-accent-700',
                        action === 'keep' && 'bg-gray-200 text-gray-700'
                      )}>
                        {anomaly.rowIndex}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{anomaly.dishName}</p>
                        <p className="text-sm text-gray-500">{anomaly.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {action && (
                        <span className={cn(
                          'text-xs px-2 py-1 rounded-full font-medium',
                          action === 'fix' && 'bg-primary-100 text-primary-700',
                          action === 'delete' && 'bg-accent-100 text-accent-700',
                          action === 'keep' && 'bg-gray-100 text-gray-700'
                        )}>
                          {action === 'fix' && '修正'}
                          {action === 'delete' && '删除'}
                          {action === 'keep' && '保留'}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100/50">
                      <div className="pt-4">
                        <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-6">
                            <div>
                              <p className="text-xs text-gray-500">原始值</p>
                              <p className={cn(
                                'text-lg font-bold',
                                anomaly.type === 'quantity_negative' ? 'text-accent-600' : 'text-amber-600'
                              )}>
                                {formatNumber(anomaly.originalValue)} 份
                              </p>
                            </div>
                            <div className="text-gray-300">→</div>
                            <div>
                              <p className="text-xs text-gray-500">建议值（均值）</p>
                              <p className="text-lg font-bold text-primary-600">
                                {formatNumber(anomaly.expectedValue)} 份
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleAction(anomaly.id, 'fix')}
                            className={cn(
                              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
                              action === 'fix'
                                ? 'bg-primary-600 text-white'
                                : 'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100'
                            )}
                          >
                            <Wrench className="w-4 h-4" />
                            修正为均值
                          </button>
                          <button
                            onClick={() => handleAction(anomaly.id, 'delete')}
                            className={cn(
                              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
                              action === 'delete'
                                ? 'bg-accent-600 text-white'
                                : 'bg-accent-50 text-accent-700 border border-accent-200 hover:bg-accent-100'
                            )}
                          >
                            <Trash2 className="w-4 h-4" />
                            删除该行
                          </button>
                          <button
                            onClick={() => handleAction(anomaly.id, 'keep')}
                            className={cn(
                              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
                              action === 'keep'
                                ? 'bg-gray-600 text-white'
                                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                            )}
                          >
                            <Check className="w-4 h-4" />
                            保留
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="sticky bottom-0 z-10 p-6 bg-white border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className={cn(
                'flex items-center gap-1',
                stats.fixCount > 0 ? 'text-primary-600' : 'text-gray-400'
              )}>
                <Wrench className="w-4 h-4" />
                修正 {stats.fixCount} 条
              </span>
              <span className={cn(
                'flex items-center gap-1',
                stats.deleteCount > 0 ? 'text-accent-600' : 'text-gray-400'
              )}>
                <Trash2 className="w-4 h-4" />
                删除 {stats.deleteCount} 条
              </span>
              <span className={cn(
                'flex items-center gap-1',
                stats.keepCount > 0 ? 'text-gray-600' : 'text-gray-400'
              )}>
                <Check className="w-4 h-4" />
                保留 {stats.keepCount} 条
              </span>
              <span className={cn(
                'flex items-center gap-1',
                stats.pendingCount > 0 ? 'text-amber-600' : 'text-gray-400'
              )}>
                <RefreshCw className={cn('w-4 h-4', stats.pendingCount > 0 && 'animate-spin')} />
                待处理 {stats.pendingCount} 条
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isAllProcessed}
                className={cn(
                  'px-5 py-2.5 text-sm font-medium rounded-lg transition-all',
                  isAllProcessed
                    ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/25'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                确认处理
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
