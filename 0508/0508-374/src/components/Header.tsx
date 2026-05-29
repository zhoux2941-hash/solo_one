interface HeaderProps {
  mode: string;
  onModeChange: (mode: 'encode' | 'decode' | 'train') => void;
}

export function Header({ mode, onModeChange }: HeaderProps) {
  const modes = [
    { id: 'encode', label: '编码', icon: '→' },
    { id: 'decode', label: '解码', icon: '←' },
    { id: 'train', label: '训练', icon: '⚡' },
  ];

  return (
    <header className="bg-morse-bg/80 backdrop-blur-md border-b border-morse-primary/20 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-morse-primary/20 flex items-center justify-center">
              <span className="text-morse-primary font-display font-bold text-xl">●</span>
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-morse-text">摩尔斯电码工具</h1>
              <p className="text-xs text-morse-text/60">Morse Code Tool</p>
            </div>
          </div>
          
          <nav className="flex bg-morse-bg/50 rounded-lg p-1">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => onModeChange(m.id as 'encode' | 'decode' | 'train')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  mode === m.id
                    ? 'bg-morse-primary text-morse-bg'
                    : 'text-morse-text/70 hover:text-morse-text hover:bg-morse-primary/10'
                }`}
              >
                <span className="mr-1">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
