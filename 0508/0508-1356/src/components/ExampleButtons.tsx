interface ExampleButtonsProps {
  onSelect: (example: string) => void;
}

const EXAMPLES = [
  { label: '{[()]}', value: '{[()]}' },
  { label: '(([]))', value: '(([]))' },
  { label: '({)}', value: '({)}' },
  { label: '[({})]', value: '[({})]' },
  { label: '{ [ ( ) ] }', value: '{ [ ( ) ] }' },
  { label: '{[()()]}', value: '{[()()]}' },
];

export default function ExampleButtons({ onSelect }: ExampleButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-zinc-500 text-xs self-center mr-1">示例：</span>
      {EXAMPLES.map((ex) => (
        <button
          key={ex.value}
          onClick={() => onSelect(ex.value)}
          className="px-2.5 py-1 text-xs font-mono text-zinc-400 bg-zinc-800/60 border border-zinc-700/40 rounded-md hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-zinc-800 transition-all duration-200"
        >
          {ex.label}
        </button>
      ))}
    </div>
  );
}
