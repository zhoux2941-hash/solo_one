import React, { useState } from 'react';
import { RotateCcw, Plus, Download, Upload, Lightbulb, Save, History } from 'lucide-react';

interface ControlPanelProps {
  onNewGame: () => void;
  onUndo: () => void;
  onExportSGF: () => void;
  onImportSGF: (file: File) => void;
  onToggleSuggestions: () => void;
  onSaveGame: () => void;
  onShowHistory: () => void;
  canUndo: boolean;
  showSuggestions: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onNewGame,
  onUndo,
  onExportSGF,
  onImportSGF,
  onToggleSuggestions,
  onSaveGame,
  onShowHistory,
  canUndo,
  showSuggestions,
}) => {
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportSGF(file);
      setIsImporting(false);
    }
  };

  const buttonClass = `
    flex items-center gap-2 px-4 py-2 rounded-lg font-medium
    transition-all duration-200
    bg-gradient-to-b from-amber-700 to-amber-900
    text-amber-100
    hover:from-amber-600 hover:to-amber-800
    active:scale-95
    shadow-md hover:shadow-lg
    border border-amber-950
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const activeButtonClass = `
    flex items-center gap-2 px-4 py-2 rounded-lg font-medium
    transition-all duration-200
    bg-gradient-to-b from-green-600 to-green-800
    text-white
    hover:from-green-500 hover:to-green-700
    active:scale-95
    shadow-md hover:shadow-lg
    border border-green-900
  `;

  return (
    <div className="bg-gradient-to-b from-amber-100 to-amber-200 rounded-xl p-4 shadow-lg border border-amber-300">
      <h3 className="text-lg font-bold text-amber-900 mb-4 text-center" style={{ fontFamily: '"Ma Shan Zheng", serif' }}>
        控制面板
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        <button className={buttonClass} onClick={onNewGame}>
          <Plus size={18} />
          新对局
        </button>
        
        <button className={buttonClass} onClick={onUndo} disabled={!canUndo}>
          <RotateCcw size={18} />
          悔棋
        </button>
        
        <button className={buttonClass} onClick={onExportSGF}>
          <Download size={18} />
          导出SGF
        </button>
        
        <label className={`${buttonClass} cursor-pointer flex items-center justify-center`}>
          <Upload size={18} />
          导入SGF
          <input
            type="file"
            accept=".sgf"
            className="hidden"
            onChange={handleFileChange}
            onClick={() => setIsImporting(true)}
          />
        </label>
        
        <button
          className={showSuggestions ? activeButtonClass : buttonClass}
          onClick={onToggleSuggestions}
        >
          <Lightbulb size={18} />
          AI提示
        </button>
        
        <button className={buttonClass} onClick={onSaveGame}>
          <Save size={18} />
          保存对局
        </button>
      </div>
      
      <button className={`${buttonClass} w-full mt-3`} onClick={onShowHistory}>
        <History size={18} />
        对局历史
      </button>
    </div>
  );
};
