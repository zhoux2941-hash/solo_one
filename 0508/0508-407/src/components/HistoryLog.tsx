import React from 'react';
import { HistoryRecord } from '../types/game';

interface HistoryLogProps {
  records: HistoryRecord[];
}

const HistoryLog: React.FC<HistoryLogProps> = ({ records }) => {
  return (
    <div className="game-panel p-6 animate-fade-in">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="text-2xl">📜</span> 生存日志
      </h2>
      
      {records.length === 0 ? (
        <div className="text-center py-8 text-white/40">
          <span className="text-4xl block mb-2">📝</span>
          <p>还没有记录</p>
          <p className="text-sm">选择食物后会显示在这里</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {records.map((record, index) => (
            <div
              key={index}
              className="history-item animate-slide-up bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{record.foodIcon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">第 {record.round} 天 - {record.foodName}</span>
                    <span className="text-xs text-white/40">耗时 {record.timeCost}h</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className={record.satietyChange >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      🍖 {record.satietyChange >= 0 ? '+' : ''}{record.satietyChange}
                    </span>
                    <span className={record.healthChange >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      ❤️ {record.healthChange >= 0 ? '+' : ''}{record.healthChange}
                    </span>
                  </div>
                  
                  {record.riskEvent && (
                    <div className="mt-2 px-3 py-1 bg-red-500/20 rounded-lg text-red-400 text-sm inline-block">
                      ⚠️ {record.riskEvent}
                    </div>
                  )}

                  {record.debuffChanges.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {record.debuffChanges.map((dc, i) => (
                        <p key={i} className={`text-xs ${
                          dc.type === 'poison' ? 'text-purple-400/70' :
                          dc.type === 'injury' ? 'text-orange-400/70' :
                          'text-red-400/70'
                        }`}>
                          {dc.type === 'poison' ? '☠️' : dc.type === 'injury' ? '🩸' : '🫠'} {dc.detail}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {records.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-sm text-white/50 text-center">
            饱腹变化: <span className={`font-bold ${records.reduce((s, r) => s + r.satietyChange, 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {records.reduce((s, r) => s + r.satietyChange, 0) >= 0 ? '+' : ''}{records.reduce((s, r) => s + r.satietyChange, 0)}
            </span>
            {' | '}
            健康变化: <span className={`font-bold ${records.reduce((s, r) => s + r.healthChange, 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {records.reduce((s, r) => s + r.healthChange, 0) >= 0 ? '+' : ''}{records.reduce((s, r) => s + r.healthChange, 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryLog;
