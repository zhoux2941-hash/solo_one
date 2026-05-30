import { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import useGameStore from "@/hooks/useGameStore";
import { parseLife106, life106ToGrid, readFileAsText } from "@/utils/life106Importer";

type ImportStatus = "idle" | "success" | "error";

export default function Life106ImportButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rows = useGameStore((s) => s.rows);
  const cols = useGameStore((s) => s.cols);
  const loadGrid = useGameStore((s) => s.loadGrid);
  const pause = useGameStore((s) => s.pause);

  const [status, setStatus] = useState<ImportStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const showStatus = (type: ImportStatus, msg: string) => {
    setStatus(type);
    setMessage(msg);
    setTimeout(() => {
      setStatus("idle");
      setMessage(null);
    }, 3000);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      pause();
      const content = await readFileAsText(file);
      const data = parseLife106(content);
      const grid = life106ToGrid(data, rows, cols);
      loadGrid(grid);
      showStatus("success", `成功导入 ${data.cells.length} 个活细胞`);
    } catch (err) {
      showStatus("error", err instanceof Error ? err.message : "导入失败");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-1">
      <input
        ref={fileInputRef}
        type="file"
        accept=".lif,.life,.106,.txt,text/plain"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-mono text-xs text-[#8b949e] border border-[#1a2332] hover:bg-[#1a2332]/50 hover:text-[#c9d1d9] hover:border-[#c9d1d9]/20 transition-all duration-200"
      >
        <Upload size={12} />
        导入 Life 1.06
      </button>

      {message && (
        <div
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md font-mono text-[10px] ${
            status === "success"
              ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30"
              : "bg-[#ff6b6b]/10 text-[#ff6b6b] border border-[#ff6b6b]/30"
          }`}
        >
          {status === "success" ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
          {message}
        </div>
      )}
    </div>
  );
}
