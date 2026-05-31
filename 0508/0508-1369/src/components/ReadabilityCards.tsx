import { useReadabilityStore } from "@/store/useReadabilityStore";
import IndexCard from "./IndexCard";

export default function ReadabilityCards() {
  const { readability } = useReadabilityStore();

  if (!readability) {
    return (
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-ink-300">
          可读性指数
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-ink-800/20 border border-ink-700/20 p-5 h-[140px] flex items-center justify-center"
            >
              <span className="text-ink-500/40 text-xs font-mono">
                等待输入...
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-mono uppercase tracking-widest text-ink-300">
        可读性指数
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <IndexCard
          title="Flesch Reading Ease"
          shortTitle="FRE"
          value={readability.fleschReadingEase}
          label={readability.fleschReadingEaseLabel}
          description={readability.fleschReadingEaseDesc}
          delay={0}
        />
        <IndexCard
          title="Flesch-Kincaid Grade Level"
          shortTitle="FKGL"
          value={readability.fleschKincaidGrade}
          label={readability.fleschKincaidGradeLabel}
          description={readability.fleschKincaidGradeDesc}
          delay={100}
        />
        <IndexCard
          title="Gunning Fog Index"
          shortTitle="FOG"
          value={readability.gunningFogIndex}
          label={readability.gunningFogLabel}
          description={readability.gunningFogDesc}
          delay={200}
        />
        <IndexCard
          title="SMOG Index"
          shortTitle="SMOG"
          value={readability.smogIndex}
          label={readability.smogLabel}
          description={readability.smogDesc}
          delay={300}
        />
      </div>
    </div>
  );
}
