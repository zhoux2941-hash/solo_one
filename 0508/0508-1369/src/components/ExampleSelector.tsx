import { exampleTexts } from "@/utils/examples";
import { useReadabilityStore } from "@/store/useReadabilityStore";

export default function ExampleSelector() {
  const { selectedExampleId, selectExample } = useReadabilityStore();

  return (
    <div className="space-y-2">
      <label className="text-xs font-mono uppercase tracking-widest text-ink-300">
        示例文本
      </label>
      <div className="flex flex-wrap gap-2">
        {exampleTexts.map((ex) => (
          <button
            key={ex.id}
            onClick={() => selectExample(ex.id, ex.content)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-body transition-all duration-200
              border cursor-pointer
              ${
                selectedExampleId === ex.id
                  ? "bg-gold/15 border-gold/40 text-gold-light shadow-[0_0_12px_rgba(226,183,20,0.15)]"
                  : "bg-ink-800/60 border-ink-700/50 text-ink-300 hover:border-ink-600 hover:text-ink-200"
              }
            `}
          >
            <span className="mr-1">{ex.icon}</span>
            {ex.title}
          </button>
        ))}
      </div>
    </div>
  );
}
