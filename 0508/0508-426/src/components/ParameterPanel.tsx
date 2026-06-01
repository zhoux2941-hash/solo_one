import { useSimulationStore } from "@/store/useSimulationStore";
import { RotateCcw } from "lucide-react";

interface SliderConfig {
  label: string;
  symbol: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  setter: (v: number) => void;
}

export default function ParameterPanel() {
  const {
    d, a, N, lambda,
    setD, setA, setN, setLambda,
    resetDefaults,
  } = useSimulationStore();

  const sliders: SliderConfig[] = [
    { label: "光栅常数", symbol: "d", value: d, min: 0.5, max: 20, step: 0.1, unit: "μm", setter: setD },
    { label: "缝宽", symbol: "a", value: a, min: 0.1, max: 10, step: 0.1, unit: "μm", setter: setA },
    { label: "缝数", symbol: "N", value: N, min: 1, max: 10, step: 1, unit: "", setter: setN },
    { label: "波长", symbol: "λ", value: lambda, min: 380, max: 780, step: 1, unit: "nm", setter: setLambda },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          参数设置
        </h2>
        <button
          onClick={resetDefaults}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
        >
          <RotateCcw size={12} />
          重置
        </button>
      </div>

      {sliders.map((s) => (
        <div key={s.symbol} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label className="text-xs text-slate-400">
              <span className="font-mono text-sm text-cyan-400">{s.symbol}</span>{" "}
              {s.label}
            </label>
            <div className="flex items-baseline gap-0.5">
              <input
                type="number"
                value={s.value}
                step={s.step}
                min={s.min}
                max={s.max}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v >= s.min && v <= s.max) s.setter(v);
                }}
                className="w-16 rounded bg-slate-700/50 px-1.5 py-0.5 text-right font-mono text-xs text-slate-200 outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
              <span className="text-[10px] text-slate-500">{s.unit}</span>
            </div>
          </div>
          <input
            type="range"
            min={s.min}
            max={s.max}
            step={s.step}
            value={s.value}
            onChange={(e) => s.setter(parseFloat(e.target.value))}
            className="h-1.5 cursor-pointer appearance-none rounded-full bg-slate-700 accent-cyan-500"
          />
        </div>
      ))}

      <div className="mt-1 rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          光栅参数比
        </h3>
        <div className="font-mono text-xs text-slate-300">
          <span className="text-cyan-400">d/a</span> = {d > 0 && a > 0 ? (d / a).toFixed(2) : "—"}
        </div>
        <div className="mt-1 font-mono text-xs text-slate-300">
          <span className="text-amber-400">d/λ</span> ={" "}
          {d > 0 ? (d / (lambda / 1000)).toFixed(2) : "—"}
        </div>
      </div>
    </div>
  );
}
