import { Link } from "react-router-dom";
import { ArrowLeft, Layers } from "lucide-react";
import SodiumDemo from "@/components/SodiumDemo";

export default function SodiumPage() {
  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-200">
      <header className="flex items-center gap-3 border-b border-slate-800 px-6 py-3">
        <Link
          to="/"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
        >
          <ArrowLeft size={14} />
          返回
        </Link>
        <div className="h-4 w-px bg-slate-700" />
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10">
            <Layers size={14} className="text-rose-400" />
          </div>
          <span className="text-sm font-semibold text-slate-200">钠光双线演示</span>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6">
        <SodiumDemo />
      </main>
    </div>
  );
}
