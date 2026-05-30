import { Download } from "lucide-react";
import useGameStore from "@/hooks/useGameStore";
import { exportToRLE } from "@/utils/rleExporter";

export default function RleExportButton() {
  const grid = useGameStore((s) => s.grid);
  const rows = useGameStore((s) => s.rows);
  const cols = useGameStore((s) => s.cols);

  const handleExport = () => {
    const rle = exportToRLE(grid, rows, cols);
    navigator.clipboard.writeText(rle).then(() => {
      const blob = new Blob([rle], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "game-of-life.rle";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <button
      onClick={handleExport}
      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-mono text-xs text-[#8b949e] border border-[#1a2332] hover:bg-[#1a2332]/50 hover:text-[#c9d1d9] hover:border-[#c9d1d9]/20 transition-all duration-200"
    >
      <Download size={12} />
      导出 RLE
    </button>
  );
}
