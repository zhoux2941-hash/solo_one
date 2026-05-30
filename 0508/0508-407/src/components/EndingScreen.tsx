import React from 'react';
import { EndingType, HistoryRecord, Debuff } from '../types/game';
import { getEndingInfo, getDebuffSummary } from '../utils/gameLogic';

interface EndingScreenProps {
  ending: EndingType;
  finalSatiety: number;
  finalHealth: number;
  debuffs: Debuff[];
  timeRemaining: number;
  maxTime: number;
  history: HistoryRecord[];
  onRestart: () => void;
}

const EndingScreen: React.FC<EndingScreenProps> = ({ ending, finalSatiety, finalHealth, debuffs, timeRemaining, maxTime, history, onRestart }) => {
  const endingInfo = getEndingInfo(ending);
  const summary = getDebuffSummary(debuffs, finalSatiety);
  
  const totalPoisonEvents = history.reduce((sum, r) => sum + r.debuffChanges.filter(d => d.type === 'poison' && d.action === 'add').length, 0);
  const totalInjuryEvents = history.reduce((sum, r) => sum + r.debuffChanges.filter(d => d.type === 'injury' && d.action === 'add').length, 0);
  const totalHungerEvents = history.reduce((sum, r) => sum + r.debuffChanges.filter(d => d.type === 'hunger' && d.action === 'tick').length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="game-panel p-8 max-w-2xl w-full mx-4 animate-bounce-in max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 animate-bounce-in">{endingInfo.icon}</div>
          <h1 className={`text-4xl font-bold mb-4 font-display ${endingInfo.color}`}>
            {endingInfo.title}
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-lg mx-auto">
            {endingInfo.description}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">🍖</div>
            <div className="text-white/50 text-sm mb-1">最终饱腹度</div>
            <div className={`text-2xl font-bold ${
              finalSatiety >= 60 ? 'text-emerald-400' :
              finalSatiety >= 30 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {finalSatiety}%
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">❤️</div>
            <div className="text-white/50 text-sm mb-1">最终健康值</div>
            <div className={`text-2xl font-bold ${
              finalHealth >= 70 ? 'text-emerald-400' :
              finalHealth >= 40 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {finalHealth}%
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">⏱️</div>
            <div className="text-white/50 text-sm mb-1">时间使用</div>
            <div className="text-2xl font-bold text-cyan-400">
              {maxTime - timeRemaining}h
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4 text-center">⚡ 负面状态统计</h3>
          <div className="bg-white/5 rounded-2xl p-5">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {totalPoisonEvents}
                </div>
                <div className="text-white/50 text-sm">☠️ 中毒次数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">
                  {totalInjuryEvents}
                </div>
                <div className="text-white/50 text-sm">🩸 受伤次数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">
                  {totalHungerEvents}
                </div>
                <div className="text-white/50 text-sm">🫠 饥饿回合</div>
              </div>
            </div>
            {summary.poisonLevel > 0 && (
              <div className="mt-4 pt-3 border-t border-white/10 text-sm text-center">
                <span className="text-purple-400">残留毒性 {summary.poisonLevel}</span>
                {' | '}
                <span className="text-orange-400">残留伤势 {summary.injuryLevel}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4 text-center">📊 生存统计</h3>
          <div className="bg-white/5 rounded-2xl p-5">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className={`text-2xl font-bold ${history.reduce((s, r) => s + r.satietyChange, 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {history.reduce((s, r) => s + r.satietyChange, 0) >= 0 ? '+' : ''}{history.reduce((s, r) => s + r.satietyChange, 0)}
                </div>
                <div className="text-white/50 text-sm">饱腹净变化</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${history.reduce((s, r) => s + r.healthChange, 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {history.reduce((s, r) => s + r.healthChange, 0) >= 0 ? '+' : ''}{history.reduce((s, r) => s + r.healthChange, 0)}
                </div>
                <div className="text-white/50 text-sm">健康净变化</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-survival-orange">
                  {history.filter(r => r.riskEvent).length}
                </div>
                <div className="text-white/50 text-sm">风险事件</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4 text-center">🗓️ 每日记录</h3>
          <div className="flex justify-center gap-2">
            {history.map((record, index) => (
              <div
                key={index}
                className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-default"
                title={`第${record.round}天: ${record.foodName}${record.riskEvent ? ' (' + record.riskEvent + ')' : ''}`}
              >
                {record.foodIcon}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={onRestart}
            className="btn-primary text-lg"
          >
            🔄 再来一次
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndingScreen;
