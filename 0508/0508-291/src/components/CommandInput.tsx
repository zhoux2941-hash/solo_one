import { useState, KeyboardEvent } from 'react';

interface CommandInputProps {
  onCommand: (command: string) => void;
  disabled?: boolean;
}

export function CommandInput({ onCommand, disabled }: CommandInputProps) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim() && !disabled) {
      onCommand(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex items-center p-4 border-t border-terminal-border">
      <span className="text-terminal-prompt mr-2">{'>>>'}</span>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="flex-1 bg-transparent text-terminal-text outline-none font-mono"
        placeholder={disabled ? '请先加入游戏...' : '输入命令...'}
        autoFocus
      />
    </div>
  );
}
