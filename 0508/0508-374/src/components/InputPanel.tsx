interface InputPanelProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  mode: 'encode' | 'decode';
}

export function InputPanel({ value, onChange, placeholder, mode }: InputPanelProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value;
    
    if (mode === 'decode') {
      newValue = newValue.replace(/[^.\-/\\s]/g, '');
    }
    
    onChange(newValue);
  };

  return (
    <div className="bg-morse-bg/50 rounded-xl p-6 border border-morse-primary/10">
      <label className="block text-sm font-medium text-morse-text/70 mb-3">
        {mode === 'encode' ? '输入文本' : '输入摩尔斯电码'}
      </label>
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full h-32 bg-morse-bg/50 border border-morse-primary/20 rounded-lg p-4 text-morse-text font-mono text-lg resize-none focus:outline-none focus:border-morse-primary/50 transition-colors"
        spellCheck={false}
      />
      {mode === 'decode' && (
        <p className="mt-2 text-xs text-morse-text/50">
          提示: 使用 . (点) 和 - (划)，字符间用空格，单词间用 /
        </p>
      )}
    </div>
  );
}
