interface ControlPanelProps {
  onSpeak: () => void;
  onExportText: () => void;
  onExportPrint: () => void;
  isSpeaking: boolean;
}

export function ControlPanel({ onSpeak, onExportText, onExportPrint, isSpeaking }: ControlPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">操作面板</h2>
      <div className="flex gap-3">
        <button
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            isSpeaking
              ? 'bg-red-500 text-white'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
          onClick={onSpeak}
        >
          <span>{isSpeaking ? '⏹ 停止' : '🔊 朗读'}</span>
        </button>
        <button
          className="flex-1 py-3 px-4 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
          onClick={onExportText}
        >
          <span>📄 导出文本</span>
        </button>
        <button
          className="flex-1 py-3 px-4 rounded-lg font-medium bg-purple-500 text-white hover:bg-purple-600 transition-all flex items-center justify-center gap-2"
          onClick={onExportPrint}
        >
          <span>🖨 打印格式</span>
        </button>
      </div>
    </div>
  );
}