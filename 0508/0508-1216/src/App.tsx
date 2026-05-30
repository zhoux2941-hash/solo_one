import { useDiff } from './hooks/useDiff';
import { TextEditor } from './components/TextEditor';
import { DiffDisplay } from './components/DiffDisplay';
import { ControlBar } from './components/ControlBar';
import type { CompareMode } from './types';

function App() {
  const {
    leftText,
    rightText,
    options,
    diffs,
    setLeftText,
    setRightText,
    setMode,
    setIgnoreWhitespace,
    swapTexts,
    clearAll,
    reset,
    handleFileUpload,
    handleExport,
  } = useDiff();

  const handleModeChange = (newMode: CompareMode) => {
    setMode(newMode);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <ControlBar
        mode={options.mode}
        ignoreWhitespace={options.ignoreWhitespace}
        onModeChange={handleModeChange}
        onIgnoreWhitespaceChange={setIgnoreWhitespace}
        onSwap={swapTexts}
        onClear={clearAll}
        onReset={reset}
        onExport={handleExport}
      />
      
      <div className="flex-1 p-6 overflow-hidden">
        <div className="grid grid-cols-3 gap-6 h-full">
          <div className="h-full">
            <TextEditor
              value={leftText}
              onChange={setLeftText}
              title="原始文本"
              placeholder="在此输入原始文本..."
              onFileUpload={(file) => handleFileUpload(file, 'left')}
            />
          </div>
          
          <div className="h-full">
            <DiffDisplay diffs={diffs} mode={options.mode} />
          </div>
          
          <div className="h-full">
            <TextEditor
              value={rightText}
              onChange={setRightText}
              title="对比文本"
              placeholder="在此输入对比文本..."
              onFileUpload={(file) => handleFileUpload(file, 'right')}
            />
          </div>
        </div>
      </div>
      
      <div className="px-6 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-green-100"></span>
            <span className="text-gray-600">新增</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-red-100"></span>
            <span className="text-gray-600">删除</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-yellow-100"></span>
            <span className="text-gray-600">修改</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
