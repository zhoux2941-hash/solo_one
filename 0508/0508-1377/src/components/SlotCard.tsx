import { SlotStatus, HashSlot } from "@/store/useHashTableStore";

interface SlotCardProps {
  slot: HashSlot;
  index: number;
  isInProbePath: boolean;
  isProbeFinal: boolean;
  isLastHighlighted: boolean;
}

export default function SlotCard({
  slot,
  index,
  isInProbePath,
  isProbeFinal,
  isLastHighlighted,
}: SlotCardProps) {
  const baseClasses =
    "relative flex flex-col items-center justify-center rounded-lg border-2 transition-all duration-300 min-h-[72px] font-mono select-none";

  let bgClass = "bg-zinc-800/50 border-zinc-700/50";
  let textClass = "text-zinc-500";
  let glowClass = "";
  let label = "空";

  if (slot.status === SlotStatus.OCCUPIED) {
    if (slot.isClustered) {
      bgClass = "bg-cyan-950/60 border-cyan-500/70";
      textClass = "text-cyan-300";
      glowClass = "shadow-[0_0_12px_rgba(6,182,212,0.3)]";
      label = String(slot.key);
    } else {
      bgClass = "bg-cyan-950/30 border-cyan-600/40";
      textClass = "text-cyan-400";
      glowClass = "";
      label = String(slot.key);
    }
  } else if (slot.status === SlotStatus.DELETED) {
    bgClass = "bg-amber-950/40 border-amber-500/50";
    textClass = "text-amber-400";
    glowClass = "shadow-[0_0_8px_rgba(245,158,11,0.2)]";
    label = "已删除";
  }

  if (isProbeFinal) {
    bgClass = "bg-emerald-950/60 border-emerald-400";
    glowClass = "shadow-[0_0_20px_rgba(52,211,153,0.5)] animate-pulse";
    textClass = "text-emerald-300";
  } else if (isInProbePath) {
    bgClass = "bg-violet-950/50 border-violet-400/70";
    glowClass = "shadow-[0_0_12px_rgba(139,92,246,0.3)]";
    textClass = "text-violet-300";
  }

  if (isLastHighlighted && !isInProbePath) {
    glowClass = "shadow-[0_0_16px_rgba(52,211,153,0.4)]";
  }

  return (
    <div className={`${baseClasses} ${bgClass} ${glowClass}`}>
      <div className="absolute top-0.5 left-1.5 text-[10px] text-zinc-600 font-mono">
        [{index}]
      </div>
      <div className={`text-base font-bold ${textClass} mt-1`}>{label}</div>
      {slot.status === SlotStatus.OCCUPIED && slot.hashValue !== null && (
        <div className="text-[10px] text-zinc-500 mt-0.5">
          h={slot.hashValue}
        </div>
      )}
      {slot.status === SlotStatus.DELETED && (
        <div className="text-[10px] text-amber-600 mt-0.5">墓碑</div>
      )}
      {slot.isClustered && slot.status === SlotStatus.OCCUPIED && !isInProbePath && !isProbeFinal && (
        <div className="absolute bottom-0.5 right-1 text-[9px] text-cyan-600">
          聚类
        </div>
      )}
    </div>
  );
}
