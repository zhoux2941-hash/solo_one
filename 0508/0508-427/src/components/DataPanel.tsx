import { useCircuitStore } from '@/store/circuitStore';
import { useAnimatedTransition } from '@/hooks/useAnimatedTransition';
import { calculateAll, formatTime, formatVoltage } from '@/utils/calculations';
import { easeOutQuart } from '@/utils/easing';
import { Timer, TrendingUp, TrendingDown } from 'lucide-react';
import type { CircuitParams } from '@/types';

export default function DataPanel() {
  const { params } = useCircuitStore();

  const displayParams = useAnimatedTransition<CircuitParams>(params, {
    duration: 400,
    easing: easeOutQuart,
  });

  const result = calculateAll(displayParams);
  const { tau, keyPoints } = result;
  const v0 = displayParams.voltage;

  const rows = [
    {
      label: 'τ',
      time: keyPoints.tau1.time,
      chargeV: keyPoints.tau1.chargeV,
      dischargeV: keyPoints.tau1.dischargeV,
      chargePercent: ((keyPoints.tau1.chargeV / v0) * 100).toFixed(1),
      dischargePercent: ((keyPoints.tau1.dischargeV / v0) * 100).toFixed(1),
    },
    {
      label: '2τ',
      time: keyPoints.tau2.time,
      chargeV: keyPoints.tau2.chargeV,
      dischargeV: keyPoints.tau2.dischargeV,
      chargePercent: ((keyPoints.tau2.chargeV / v0) * 100).toFixed(1),
      dischargePercent: ((keyPoints.tau2.dischargeV / v0) * 100).toFixed(1),
    },
    {
      label: '3τ',
      time: keyPoints.tau3.time,
      chargeV: keyPoints.tau3.chargeV,
      dischargeV: keyPoints.tau3.dischargeV,
      chargePercent: ((keyPoints.tau3.chargeV / v0) * 100).toFixed(1),
      dischargePercent: ((keyPoints.tau3.dischargeV / v0) * 100).toFixed(1),
    },
    {
      label: '5τ',
      time: keyPoints.tau5.time,
      chargeV: keyPoints.tau5.chargeV,
      dischargeV: keyPoints.tau5.dischargeV,
      chargePercent: ((keyPoints.tau5.chargeV / v0) * 100).toFixed(1),
      dischargePercent: ((keyPoints.tau5.dischargeV / v0) * 100).toFixed(1),
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="glass-card p-5 glass-card-hover transition-all duration-300">
        <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-glow-pulse" />
          关键时间点数据
        </h2>

        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-navy-900/60 border border-cyan-400/20">
          <Timer size={20} className="text-cyan-400" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">时间常数</div>
            <div className="text-xl font-bold text-cyan-400 glow-text font-display">
              τ = {formatTime(tau)}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">RC =</div>
            <div className="text-sm font-mono text-cyan-400/80">
              {displayParams.resistance.toFixed(1)}kΩ × {displayParams.capacitance.toFixed(1)}μF
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-navy-500/50">
                <th className="py-2 px-2 text-left text-slate-500 font-medium">时间点</th>
                <th className="py-2 px-2 text-left text-slate-500 font-medium">时刻</th>
                <th className="py-2 px-2 text-center text-charge font-medium">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp size={10} /> 充电电压
                  </div>
                </th>
                <th className="py-2 px-2 text-center text-charge font-medium">占比</th>
                <th className="py-2 px-2 text-center text-discharge font-medium">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingDown size={10} /> 放电电压
                  </div>
                </th>
                <th className="py-2 px-2 text-center text-discharge font-medium">占比</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={row.label}
                  className={`border-b border-navy-500/20 ${idx === 0 ? 'bg-cyan-400/5' : ''}`}
                >
                  <td className="py-2.5 px-2 font-bold text-cyan-400 font-display">
                    {row.label}
                  </td>
                  <td className="py-2.5 px-2 text-slate-300 font-mono">
                    {formatTime(row.time)}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="text-charge font-mono font-medium">
                      {formatVoltage(row.chargeV)}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-12 h-1.5 rounded-full bg-navy-600 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-charge/60 transition-all duration-100"
                          style={{ width: `${row.chargePercent}%` }}
                        />
                      </div>
                      <span className="text-charge/70 font-mono">{row.chargePercent}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="text-discharge font-mono font-medium">
                      {formatVoltage(row.dischargeV)}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-12 h-1.5 rounded-full bg-navy-600 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-discharge/60 transition-all duration-100"
                          style={{ width: `${row.dischargePercent}%` }}
                        />
                      </div>
                      <span className="text-discharge/70 font-mono">{row.dischargePercent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-navy-900/40 border border-navy-500/30">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">理论值参考</div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-charge" />
              <span className="text-slate-400">τ: 63.2%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-discharge" />
              <span className="text-slate-400">τ: 36.8%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-charge" />
              <span className="text-slate-400">3τ: 95.0%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-discharge" />
              <span className="text-slate-400">3τ: 5.0%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
