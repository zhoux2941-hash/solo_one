import { useDiffraction } from "@/hooks/useDiffraction";
import { singleSlitMinima } from "@/utils/diffraction";
import { XCircle, AlertTriangle, Info } from "lucide-react";

export default function MissingOrderPanel() {
  const { missing, maxima, maxOrder, params } = useDiffraction();

  const ratio = params.d / params.a;
  const ratioStr = ratio > 0 ? (Number.isInteger(ratio) ? ratio.toFixed(0) : ratio.toFixed(2)) : "—";
  const isSingleSlit = params.N <= 1;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
        {isSingleSlit ? "单缝衍射分析" : "缺级分析"}
      </h2>

      {isSingleSlit ? (
        <div className="rounded-lg border border-cyan-900/30 bg-cyan-950/20 p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Info size={14} className="text-cyan-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400">
              单缝衍射模式
            </span>
          </div>
          <p className="text-xs text-slate-400">
            N=1 时无多缝干涉效应，光强分布完全由单缝衍射决定：
          </p>
          <div className="mt-2 font-mono text-xs text-slate-300">
            I(θ) = (sinβ/β)²
          </div>
          <div className="mt-1 font-mono text-xs text-slate-400">
            其中 β = πa·sinθ/λ
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            光栅方程
          </div>
          <div className="font-mono text-xs text-slate-300">
            <span className="text-cyan-400">d</span>·sinθ = <span className="text-cyan-400">m</span>·λ
          </div>
          <div className="mt-1.5 font-mono text-xs text-slate-300">
            <span className="text-amber-400">a</span>·sinθ = <span className="text-amber-400">k</span>·λ
          </div>
          <div className="mt-2 border-t border-slate-700/50 pt-2 font-mono text-xs text-slate-300">
            缺级: <span className="text-rose-400">m</span> = <span className="text-amber-400">k</span> · (d/a) = <span className="text-rose-400">k</span> · {ratioStr}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          {isSingleSlit ? "单缝衍射参数" : "最大可观测级次"}
        </div>
        {isSingleSlit ? (
          <div className="font-mono text-sm text-cyan-400">
            缝宽 a = {params.a} μm
          </div>
        ) : (
          <div className="font-mono text-lg text-cyan-400">
            m<sub>max</sub> = {maxOrder}
          </div>
        )}
      </div>

      {isSingleSlit ? null : missing.length > 0 ? (
        <div className="rounded-lg border border-rose-900/30 bg-rose-950/20 p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <XCircle size={14} className="text-rose-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-rose-400">
              缺级级次
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((order) => (
              <span
                key={order}
                className="rounded-md bg-rose-900/30 px-2 py-0.5 font-mono text-xs text-rose-300 ring-1 ring-rose-800/50"
              >
                m = ±{order}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-xs text-slate-400">
              d/a 不为整数，无缺级
            </span>
          </div>
        </div>
      )}

      {isSingleSlit ? (
        <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            单缝衍射暗纹位置
          </div>
          <div className="max-h-36 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500">
                  <th className="px-1 py-0.5 text-left font-mono">k</th>
                  <th className="px-1 py-0.5 text-left font-mono">θ (°)</th>
                  <th className="px-1 py-0.5 text-left font-mono">说明</th>
                </tr>
              </thead>
              <tbody className="font-mono text-slate-300">
                {singleSlitMinima(params).map((m) => (
                  <tr key={m.order}>
                    <td className="px-1 py-0.5">{m.order}</td>
                    <td className="px-1 py-0.5">{m.thetaDeg.toFixed(2)}</td>
                    <td className="px-1 py-0.5">
                      {m.order === 0 ? "中央亮纹中心" : "暗纹"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            主极大位置
          </div>
          <div className="max-h-36 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500">
                  <th className="px-1 py-0.5 text-left font-mono">m</th>
                  <th className="px-1 py-0.5 text-left font-mono">θ (°)</th>
                  <th className="px-1 py-0.5 text-left font-mono">状态</th>
                </tr>
              </thead>
              <tbody className="font-mono text-slate-300">
                {maxima.filter((m) => m.order >= 0).map((m) => (
                  <tr
                    key={m.order}
                    className={m.isMissing ? "text-rose-400/70 line-through" : ""}
                  >
                    <td className="px-1 py-0.5">{m.order}</td>
                    <td className="px-1 py-0.5">{m.thetaDeg.toFixed(2)}</td>
                    <td className="px-1 py-0.5">
                      {m.isMissing ? "缺级" : m.order === 0 ? "中央极大" : "主极大"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
