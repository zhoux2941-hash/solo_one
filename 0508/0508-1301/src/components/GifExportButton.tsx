import { useState } from "react";
import { Film } from "lucide-react";
import GifExportDialog from "./GifExportDialog";

export default function GifExportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-mono text-xs text-[#8b949e] border border-[#1a2332] hover:bg-[#1a2332]/50 hover:text-[#c9d1d9] hover:border-[#c9d1d9]/20 transition-all duration-200"
      >
        <Film size={12} />
        导出 GIF 动画
      </button>
      <GifExportDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
