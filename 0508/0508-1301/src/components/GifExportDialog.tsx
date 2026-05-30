import { useState, useRef, useEffect } from "react";
import { Film, X, Loader2 } from "lucide-react";
import useGameStore from "@/hooks/useGameStore";
import { exportToGif, downloadBlob } from "@/utils/gifExporter";

interface GifExportDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function GifExportDialog({ open, onClose }: GifExportDialogProps) {
  const initialGrid = useGameStore((s) => s.grid);
  const rows = useGameStore((s) => s.rows);
  const cols = useGameStore((s) => s.cols);
  const boundaryMode = useGameStore((s) => s.boundaryMode);
  const showGridLines = useGameStore((s) => s.showGridLines);
  const speed = useGameStore((s) => s.speed);

  const [frameCount, setFrameCount] = useState(50);
  const [frameDelay, setFrameDelay] = useState(100);
  const [cellSize, setCellSize] = useState(8);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setFrameDelay(speed);
      setProgress(0);
      setError(null);
    }
  }, [open, speed]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const handleExport = async () => {
    setExporting(true);
    setProgress(0);
    setError(null);

    try {
      const blob = await exportToGif({
        initialGrid,
        rows,
        cols,
        boundaryMode,
        frameCount,
        frameDelay,
        showGridLines,
        cellSize,
        onProgress: (p) => setProgress(p),
      });

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
      downloadBlob(blob, `game-of-life-${timestamp}.gif`);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "导出失败");
    } finally {
      setExporting(false);
    }
  };

  if (!open) return null;

  const estimatedSize = Math.ceil((rows * cellSize * cols * cellSize * frameCount) / 1024 / 100);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        ref={dialogRef}
        className="bg-[#0d1117] border border-[#1a2332] rounded-xl shadow-2xl w-full max-w-md p-6 animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Film size={18} className="text-[#00ff88]" />
            <h2 className="text-[#e6edf3] font-mono text-sm font-bold">导出 GIF 动画</h2>
          </div>
          <button
            onClick={onClose}
            disabled={exporting}
            className="p-1 rounded-md text-[#484f58] hover:text-[#c9d1d9] hover:bg-[#1a2332] transition-colors disabled:opacity-30"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[#8b949e] text-xs font-mono">演化帧数</label>
              <span className="text-[#4ecca3] text-xs font-mono">{frameCount} 帧</span>
            </div>
            <input
              type="range"
              min={10}
              max={200}
              step={10}
              value={frameCount}
              onChange={(e) => setFrameCount(Number(e.target.value))}
              disabled={exporting}
              className="w-full accent-[#00ff88] h-1.5 bg-[#1a2332] rounded-full appearance-none cursor-pointer disabled:opacity-30"
            />
            <div className="flex justify-between text-[10px] text-[#484f58] font-mono">
              <span>10</span>
              <span>200</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[#8b949e] text-xs font-mono">帧间隔</label>
              <span className="text-[#4ecca3] text-xs font-mono">{frameDelay}ms</span>
            </div>
            <input
              type="range"
              min={30}
              max={500}
              step={10}
              value={frameDelay}
              onChange={(e) => setFrameDelay(Number(e.target.value))}
              disabled={exporting}
              className="w-full accent-[#00ff88] h-1.5 bg-[#1a2332] rounded-full appearance-none cursor-pointer disabled:opacity-30"
            />
            <div className="flex justify-between text-[10px] text-[#484f58] font-mono">
              <span>快</span>
              <span>慢</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[#8b949e] text-xs font-mono">细胞像素</label>
              <span className="text-[#4ecca3] text-xs font-mono">{cellSize}px</span>
            </div>
            <input
              type="range"
              min={4}
              max={16}
              step={1}
              value={cellSize}
              onChange={(e) => setCellSize(Number(e.target.value))}
              disabled={exporting}
              className="w-full accent-[#4ecca3] h-1.5 bg-[#1a2332] rounded-full appearance-none cursor-pointer disabled:opacity-30"
            />
            <div className="flex justify-between text-[10px] text-[#484f58] font-mono">
              <span>4px ({cols * cellSize}px)</span>
              <span>16px ({cols * 16}px)</span>
            </div>
          </div>

          <div className="text-[10px] text-[#484f58] font-mono px-3 py-2 bg-[#1a2332]/50 rounded-lg">
            输出尺寸: {cols * cellSize} × {rows * cellSize} px · 约 ~{estimatedSize} KB
          </div>

          {error && (
            <div className="text-[11px] text-[#ff6b6b] font-mono px-3 py-2 bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-lg">
              错误: {error}
            </div>
          )}

          {exporting && (
            <div className="space-y-2">
              <div className="h-1.5 bg-[#1a2332] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00ff88] transition-all duration-200"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-[#4ecca3] font-mono text-center">
                正在渲染... {Math.round(progress * 100)}%
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              disabled={exporting}
              className="flex-1 px-4 py-2 rounded-lg font-mono text-xs text-[#8b949e] border border-[#1a2332] hover:bg-[#1a2332]/50 hover:text-[#c9d1d9] transition-all disabled:opacity-30"
            >
              取消
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-mono text-xs text-[#0d1117] bg-[#00ff88] hover:bg-[#00cc6a] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  导出中
                </>
              ) : (
                <>
                  <Film size={12} />
                  开始导出
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
