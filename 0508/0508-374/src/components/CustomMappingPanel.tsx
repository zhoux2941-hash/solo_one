import { useState, useEffect } from 'react';
import { 
  getCustomMappings, 
  addCustomMapping, 
  removeCustomMapping, 
  clearCustomMappings,
  DEFAULT_MORSE_CODE 
} from '@/utils/morseCode';

export function CustomMappingPanel() {
  const [customMappings, setCustomMappings] = useState<Record<string, string>>({});
  const [newChar, setNewChar] = useState('');
  const [newCode, setNewCode] = useState('');
  const [showDefault, setShowDefault] = useState(false);

  useEffect(() => {
    setCustomMappings(getCustomMappings());
  }, []);

  const handleAddMapping = () => {
    if (newChar.trim() && newCode.trim()) {
      const char = newChar.length === 1 ? newChar.toUpperCase() : newChar;
      const isValidCode = /^[.\-·—]+$/.test(newCode);
      
      if (isValidCode) {
        addCustomMapping(char, newCode);
        setCustomMappings(getCustomMappings());
        setNewChar('');
        setNewCode('');
      }
    }
  };

  const handleRemoveMapping = (char: string) => {
    removeCustomMapping(char);
    setCustomMappings(getCustomMappings());
  };

  const handleClearAll = () => {
    clearCustomMappings();
    setCustomMappings({});
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddMapping();
    }
  };

  const asciiMappings = Object.entries(DEFAULT_MORSE_CODE).filter(
    ([char]) => char.length === 1 && char.charCodeAt(0) <= 127
  );

  return (
    <div className="bg-morse-bg/50 rounded-xl p-6 border border-morse-primary/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-morse-text/70">自定义映射</h3>
        {Object.keys(customMappings).length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-morse-error hover:text-morse-error/80 transition-colors"
          >
            清除全部
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newChar}
          onChange={(e) => setNewChar(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="字符"
          maxLength={1}
          className="flex-1 px-3 py-2 bg-morse-bg/50 border border-morse-primary/20 rounded-lg text-morse-text text-center focus:outline-none focus:border-morse-primary/50 transition-colors"
        />
        <span className="flex items-center text-morse-text/50">→</span>
        <input
          type="text"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value.replace(/[^.\-·—]/g, ''))}
          onKeyDown={handleKeyDown}
          placeholder="电码"
          className="flex-1 px-3 py-2 bg-morse-bg/50 border border-morse-primary/20 rounded-lg text-morse-secondary font-mono text-center focus:outline-none focus:border-morse-primary/50 transition-colors"
        />
        <button
          onClick={handleAddMapping}
          disabled={!newChar.trim() || !newCode.trim() || !/^[.\-·—]+$/.test(newCode)}
          className="px-4 py-2 bg-morse-primary/20 text-morse-primary font-medium rounded-lg border border-morse-primary/50 hover:bg-morse-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          添加
        </button>
      </div>

      {Object.keys(customMappings).length > 0 ? (
        <div className="space-y-2">
          {Object.entries(customMappings).map(([char, code]) => (
            <div
              key={char}
              className="flex items-center justify-between bg-morse-bg/50 rounded-lg px-4 py-2"
            >
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-morse-text w-8 text-center">
                  {char}
                </span>
                <span className="text-morse-secondary font-mono">
                  {code}
                </span>
              </div>
              <button
                onClick={() => handleRemoveMapping(char)}
                className="text-sm text-morse-error hover:text-morse-error/80 transition-colors"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-morse-text/50 text-center py-4">
          暂无自定义映射
        </p>
      )}

      <div className="mt-4 pt-4 border-t border-morse-primary/10">
        <button
          onClick={() => setShowDefault(!showDefault)}
          className="text-sm text-morse-text/70 hover:text-morse-text transition-colors"
        >
          {showDefault ? '隐藏' : '查看'} 默认映射表（ASCII）
        </button>
        
        {showDefault && (
          <div className="mt-4 max-h-60 overflow-auto">
            <div className="grid grid-cols-4 gap-2 text-sm">
              {asciiMappings.map(([char, code]) => (
                <div key={char} className="flex items-center justify-between bg-morse-bg/50 rounded px-2 py-1">
                  <span className="text-morse-text">{char}</span>
                  <span className="text-morse-secondary font-mono text-xs">{code}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
