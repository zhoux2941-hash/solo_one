import { useReadabilityStore } from "@/store/useReadabilityStore";
import { countSyllables } from "@/utils/readability";
import { Eye } from "lucide-react";

export default function SyllableHighlight() {
  const { text } = useReadabilityStore();

  if (!text.trim()) {
    return (
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-ink-300">
          多音节词高亮
        </h2>
        <div className="rounded-xl bg-ink-800/20 border border-ink-700/20 p-5 min-h-[120px] flex items-center justify-center">
          <span className="text-ink-500/40 text-xs font-mono">
            输入文本后，多音节词（3个音节以上）将以金色高亮显示
          </span>
        </div>
      </div>
    );
  }

  const tokens = text.split(/(\s+|[.!?;:,'"()\-—])/);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono uppercase tracking-widest text-ink-300">
          多音节词高亮
        </h2>
        <div className="flex items-center gap-1.5 text-[10px] text-ink-400">
          <Eye className="w-3 h-3" />
          <span className="font-mono">3+ 音节 = 金色标注</span>
        </div>
      </div>
      <div className="rounded-xl bg-ink-950/60 border border-ink-700/30 p-4 max-h-[200px] overflow-y-auto">
        <p className="font-body text-sm leading-relaxed text-ink-200">
          {tokens.map((token, i) => {
            const cleanWord = token.replace(/[^a-zA-Z'-]/g, "");
            if (cleanWord.length > 0) {
              const syllables = countSyllables(cleanWord);
              if (syllables >= 3) {
                return (
                  <span
                    key={i}
                    className="bg-gold/15 text-gold-light px-0.5 rounded-sm border-b border-gold/40"
                    title={`${syllables} syllables`}
                  >
                    {token}
                  </span>
                );
              }
            }
            return <span key={i}>{token}</span>;
          })}
        </p>
      </div>
    </div>
  );
}
