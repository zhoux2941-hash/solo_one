import GameCanvas from "@/components/GameCanvas";
import StatusBar from "@/components/StatusBar";
import ControlPanel from "@/components/ControlPanel";
import PresetPanel, { GridLinesToggle, BoundaryModeToggle } from "@/components/PresetPanel";
import { SpeedSlider, GridSizeSlider, RandomizeControl } from "@/components/Sliders";
import RleExportButton from "@/components/RleExportButton";
import GifExportButton from "@/components/GifExportButton";
import Life106ImportButton from "@/components/Life106ImportButton";

export default function Home() {
  return (
    <div className="h-screen w-screen bg-[#0a0a0f] flex overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-3 border-b border-[#1a2332]">
          <div className="flex items-center gap-3">
            <h1 className="text-[#e6edf3] font-mono text-base font-bold tracking-tight">
              <span className="text-[#00ff88]">GAME</span> OF LIFE
            </h1>
            <span className="text-[#484f58] text-[10px] font-mono tracking-widest">CONWAY'S CELLULAR AUTOMATON</span>
          </div>
          <StatusBar />
        </header>
        <main className="flex-1 p-3 min-h-0">
          <div className="w-full h-full bg-[#0d1117] rounded-xl border border-[#1a2332] overflow-hidden shadow-[0_0_40px_rgba(0,255,136,0.03)]">
            <GameCanvas />
          </div>
        </main>
      </div>

      <aside className="w-64 flex-shrink-0 border-l border-[#1a2332] bg-[#0d1117]/50 backdrop-blur-sm flex flex-col overflow-y-auto">
        <div className="p-4 space-y-5">
          <section>
            <h2 className="text-[#484f58] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">演化控制</h2>
            <ControlPanel />
          </section>

          <div className="h-px bg-[#1a2332]" />

          <section className="space-y-4">
            <h2 className="text-[#484f58] text-[10px] font-mono uppercase tracking-[0.2em]">参数设置</h2>
            <SpeedSlider />
            <GridSizeSlider />
            <RandomizeControl />
          </section>

          <div className="h-px bg-[#1a2332]" />

          <section>
            <h2 className="text-[#484f58] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">显示选项</h2>
            <div className="space-y-3">
              <GridLinesToggle />
              <BoundaryModeToggle />
            </div>
          </section>

          <div className="h-px bg-[#1a2332]" />

          <section>
            <PresetPanel />
          </section>

          <div className="h-px bg-[#1a2332]" />

          <section>
            <h2 className="text-[#484f58] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">数据导入导出</h2>
            <div className="space-y-1.5">
              <Life106ImportButton />
              <RleExportButton />
              <GifExportButton />
            </div>
          </section>
        </div>

        <div className="mt-auto p-4 border-t border-[#1a2332]">
          <p className="text-[#30363d] text-[10px] font-mono leading-relaxed">
            B3/S23 规则：活细胞2或3邻居存活，死细胞3邻居新生。环形模式下边界环绕连通。
          </p>
        </div>
      </aside>
    </div>
  );
}
