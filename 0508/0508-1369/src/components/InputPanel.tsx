import { useReadabilityStore } from "@/store/useReadabilityStore";
import ExampleSelector from "./ExampleSelector";
import { X, FileText } from "lucide-react";

export default function InputPanel() {
  const { text, setText, clearText } = useReadabilityStore();

  return (
    <div className="space-y-4 h-full flex flex-col">
      <ExampleSelector />

      <div className="relative flex-1 min-h-0">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="在此输入或粘贴英文文本，系统将自动计算可读性指数..."
          className="w-full h-full min-h-[320px] resize-none rounded-xl bg-ink-950/60 border border-ink-700/40 
            px-5 py-4 text-ink-50 font-body text-sm leading-relaxed
            placeholder:text-ink-500/60 placeholder:font-body
            focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/10
            transition-all duration-300"
          spellCheck={false}
        />
        {text && (
          <button
            onClick={clearText}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-ink-800/80 border border-ink-700/50 
              text-ink-400 hover:text-gold hover:border-gold/30 transition-all duration-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-ink-400 font-mono">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          <span>{text.length} characters</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gold/40 animate-pulse" />
          <span>实时分析</span>
        </div>
      </div>
    </div>
  );
}
