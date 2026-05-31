import { cn } from '@/lib/utils';

interface BracketInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function BracketInput({ value, onChange }: BracketInputProps) {
  return (
    <div className="relative group">
      <div className="absolute left-3 top-0 bottom-0 flex flex-col pt-4 pb-3 text-xs text-zinc-600 font-mono select-none gap-[1.2em]">
        <span>1</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="输入括号字符串，如 {[()]} 或 (([]))"
        spellCheck={false}
        rows={3}
        className={cn(
          'w-full bg-zinc-900/80 border border-zinc-700/50 rounded-lg pl-9 pr-4 py-3',
          'font-mono text-lg text-emerald-400 tracking-widest',
          'placeholder:text-zinc-600 placeholder:text-sm placeholder:tracking-normal placeholder:font-sans',
          'focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20',
          'transition-all duration-300 resize-none',
          'caret-emerald-400'
        )}
      />
      <div className="absolute right-3 bottom-2 text-[10px] text-zinc-600 font-mono">
        {value.length} chars
      </div>
    </div>
  );
}
