import { useSimulationStore } from "@/store/useSimulationStore";
import ParameterPanel from "@/components/ParameterPanel";
import IntensityChart from "@/components/IntensityChart";
import MissingOrderPanel from "@/components/MissingOrderPanel";
import { Link } from "react-router-dom";
import { FlaskConical, Eye, EyeOff, Layers } from "lucide-react";

export default function HomePage() {
  const {
    showEnvelope,
    showEnvelopeOnly,
    setShowEnvelope,
    setShowEnvelopeOnly,
  } = useSimulationStore();

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-200">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
            <Layers size={18} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-100">
              光栅衍射模拟器
            </h1>
            <p className="text-[10px] text-slate-500">多缝干涉与单缝衍射叠加效应</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEnvelope(!showEnvelope)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
              showEnvelope
                ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30"
                : "bg-slate-800 text-slate-400 hover:text-slate-300"
            }`}
          >
            {showEnvelope ? <Eye size={12} /> : <EyeOff size={12} />}
            包络线
          </button>
          <button
            onClick={() => setShowEnvelopeOnly(!showEnvelopeOnly)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
              showEnvelopeOnly
                ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30"
                : "bg-slate-800 text-slate-400 hover:text-slate-300"
            }`}
          >
            {showEnvelopeOnly ? <Eye size={12} /> : <EyeOff size={12} />}
            仅包络线
          </button>
          <Link
            to="/sodium"
            className="flex items-center gap-1.5 rounded-md bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400 ring-1 ring-rose-500/30 transition-colors hover:bg-rose-500/20"
          >
            <FlaskConical size={12} />
            钠光双线
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 shrink-0 border-r border-slate-800 p-4 overflow-y-auto">
          <ParameterPanel />
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 p-4">
            <IntensityChart />
          </div>
        </main>

        <aside className="w-72 shrink-0 border-l border-slate-800 p-4 overflow-y-auto">
          <MissingOrderPanel />
        </aside>
      </div>
    </div>
  );
}
