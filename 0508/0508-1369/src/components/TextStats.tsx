import { useReadabilityStore } from "@/store/useReadabilityStore";
import { AlignLeft, Type, Hash, Ruler, BarChart3 } from "lucide-react";

export default function TextStats() {
  const { analysis } = useReadabilityStore();

  if (!analysis) {
    return (
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-ink-300">
          文本统计
        </h2>
        <div className="flex flex-wrap gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-lg bg-ink-800/20 border border-ink-700/20 px-4 py-3 min-w-[100px]"
            >
              <span className="text-ink-500/30 text-xs font-mono">—</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      icon: AlignLeft,
      label: "句子数",
      value: analysis.sentenceCount,
    },
    {
      icon: Type,
      label: "单词数",
      value: analysis.wordCount,
    },
    {
      icon: Hash,
      label: "音节总数",
      value: analysis.syllableCount,
    },
    {
      icon: Ruler,
      label: "平均词长",
      value: analysis.avgWordLength.toFixed(1),
    },
    {
      icon: BarChart3,
      label: "多音节词比例",
      value: (analysis.polysyllableRatio * 100).toFixed(1) + "%",
    },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-mono uppercase tracking-widest text-ink-300">
        文本统计
      </h2>
      <div className="flex flex-wrap gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg bg-ink-800/40 border border-ink-700/30 px-4 py-3 min-w-[110px]
              hover:border-gold/15 transition-all duration-200"
          >
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className="w-3 h-3 text-gold/60" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-400">
                {stat.label}
              </span>
            </div>
            <span className="font-mono text-lg font-semibold text-ink-50">
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
