import React from 'react';
import { Debuff } from '../types/game';
import { getDebuffSummary } from '../utils/gameLogic';

interface StatusPanelProps {
  round: number;
  maxRounds: number;
  satiety: number;
  health: number;
  debuffs: Debuff[];
  timeRemaining: number;
  maxTime: number;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ round, maxRounds, satiety, health, debuffs, timeRemaining, maxTime }) => {
  const summary = getDebuffSummary(debuffs, satiety);

  const getSatietyColor = () => {
    if (satiety >= 60) return 'bg-emerald-500';
    if (satiety >= 30) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getHealthColor = () => {
    if (health >= 70) return 'bg-emerald-500';
    if (health >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTimeColor = () => {
    const ratio = timeRemaining / maxTime;
    if (ratio > 0.5) return 'bg-cyan-500';
    if (ratio > 0.25) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTimeTextColor = () => {
    const ratio = timeRemaining / maxTime;
    if (ratio > 0.5) return 'text-cyan-400';
    if (ratio > 0.25) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="game-panel p-6 animate-fade-in">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="text-2xl">📊</span> 生存状态
      </h2>
      
      <div className="mb-6 text-center">
        <div className="text-sm text-white/60 mb-1">当前进度</div>
        <div className="text-4xl font-bold text-survival-orange font-display">
          第 {round} 天
        </div>
        <div className="text-sm text-white/60">共 {maxRounds} 天</div>
        <div className="mt-3 flex justify-center gap-1">
          {Array.from({ length: maxRounds }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i < round ? 'bg-survival-orange' : 
                i === round - 1 ? 'bg-survival-orange animate-pulse' : 
                'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/80 flex items-center gap-2">
              <span className="text-xl">🍖</span> 饱腹度
            </span>
            <span className={`font-bold text-lg ${
              satiety >= 60 ? 'text-emerald-400' :
              satiety >= 30 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {satiety}%
            </span>
          </div>
          <div className="stat-bar">
            <div 
              className={`stat-fill ${getSatietyColor()}`}
              style={{ width: `${satiety}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/80 flex items-center gap-2">
              <span className="text-xl">❤️</span> 健康值
            </span>
            <span className={`font-bold text-lg ${
              health >= 70 ? 'text-emerald-400' :
              health >= 40 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {health}%
            </span>
          </div>
          <div className="stat-bar">
            <div 
              className={`stat-fill ${getHealthColor()}`}
              style={{ width: `${health}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/80 flex items-center gap-2">
              <span className="text-xl">⏱️</span> 剩余时间
            </span>
            <span className={`font-bold text-lg ${getTimeTextColor()}`}>
              {timeRemaining}h
            </span>
          </div>
          <div className="stat-bar">
            <div 
              className={`stat-fill ${getTimeColor()}`}
              style={{ width: `${(timeRemaining / maxTime) * 100}%` }}
            />
          </div>
          {timeRemaining <= 12 && timeRemaining > 0 && (
            <p className="text-xs text-red-400 mt-1">
              ⚠️ 时间紧迫！注意选择耗时短的食物
            </p>
          )}
        </div>
      </div>

      {summary.totalDmg > 0 && (
        <div className="mt-5 p-4 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-sm font-bold text-white/70 mb-3 flex items-center gap-2">
            <span>⚡</span> 活跃负面状态
          </h3>
          <div className="space-y-3">
            {summary.poisonLevel > 0 && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-purple-400 text-sm flex items-center gap-1">
                    ☠️ 中毒 <span className="text-white/40 text-xs">(指数衰减)</span>
                  </span>
                  <span className="text-purple-400 text-sm font-bold">强度 {summary.poisonLevel}</span>
                </div>
                <div className="stat-bar h-2">
                  <div 
                    className="stat-fill bg-purple-500"
                    style={{ width: `${Math.min(100, summary.poisonLevel * 1.5)}%` }}
                  />
                </div>
                <p className="text-xs text-purple-400/70 mt-1">
                  本回合毒素伤害 -{summary.poisonDmg} · 每回合消退 25%
                </p>
              </div>
            )}

            {summary.injuryLevel > 0 && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-orange-400 text-sm flex items-center gap-1">
                    🩸 受伤 <span className="text-white/40 text-xs">(线性衰减)</span>
                  </span>
                  <span className="text-orange-400 text-sm font-bold">强度 {summary.injuryLevel}</span>
                </div>
                <div className="stat-bar h-2">
                  <div 
                    className="stat-fill bg-orange-500"
                    style={{ width: `${Math.min(100, summary.injuryLevel * 1.5)}%` }}
                  />
                </div>
                <p className="text-xs text-orange-400/70 mt-1">
                  本回合伤口疼痛 -{summary.injuryDmg} · 每回合愈合 50%
                </p>
              </div>
            )}

            {summary.hungerIntensity > 0 && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-red-400 text-sm flex items-center gap-1">
                    🫠 {summary.hungerLevel} <span className="text-white/40 text-xs">(阶梯衰减)</span>
                  </span>
                  <span className="text-red-400 text-sm font-bold">
                    {['', '轻度', '严重', '极度'][summary.hungerIntensity]}
                  </span>
                </div>
                <div className="stat-bar h-2">
                  <div 
                    className="stat-fill bg-red-500"
                    style={{ width: `${summary.hungerIntensity * 33}%` }}
                  />
                </div>
                <p className="text-xs text-red-400/70 mt-1">
                  本回合饥饿伤害 -{summary.hungerDmg} · 需饱腹≥35%解除
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 text-center">
            <span className="text-xs text-white/50">
              本回合总负面伤害：<span className="text-red-400 font-bold">-{summary.totalDmg}</span> 健康
            </span>
          </div>
        </div>
      )}

      <div className="mt-5 p-4 bg-white/5 rounded-xl border border-white/10">
        <p className="text-white/60 text-sm text-center">
          💡 总时间上限 <span className="text-cyan-400">48小时</span>，每次选择消耗时间<br/>
          <span className="text-emerald-400">饱腹≥60% 且 健康≥70%</span> 即可获救！
        </p>
      </div>
    </div>
  );
};

export default StatusPanel;
