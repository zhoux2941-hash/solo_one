import { useState, useEffect, useCallback } from 'react';
import { InputArea } from './components/InputArea';
import { ConversionPanel } from './components/ConversionPanel';
import { BrailleDisplay } from './components/BrailleDisplay';
import { DotMatrixViewer } from './components/DotMatrixViewer';
import { ControlPanel } from './components/ControlPanel';
import { StatsPanel } from './components/StatsPanel';
import { BrailleTypeSelector } from './components/BrailleTypeSelector';
import {
  convertToBraille,
  speakText,
  exportAsText,
  exportForPrint,
} from './utils/brailleConverter';
import type { ConversionMode, BrailleResult } from './utils/brailleConverter';
import type { BrailleType } from './data/brailleTypes';

function App() {
  const [inputText, setInputText] = useState('');
  const [conversionMode, setConversionMode] = useState<ConversionMode>('pinyin');
  const [brailleType, setBrailleType] = useState<BrailleType>('current');
  const [brailleResult, setBrailleResult] = useState<BrailleResult>({
    brailleText: '',
    dotMatrixData: [],
    charCount: 0,
    convertedCount: 0,
    unconvertedChars: [],
  });
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleConvert = useCallback(() => {
    const result = convertToBraille(inputText, conversionMode, brailleType);
    setBrailleResult(result);
  }, [inputText, conversionMode, brailleType]);

  useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      if (inputText.trim()) {
        setIsSpeaking(true);
        speakText(inputText);
        
        const handleEnd = () => {
          setIsSpeaking(false);
          window.speechSynthesis.removeEventListener('voiceschanged', handleEnd);
        };
        window.speechSynthesis.addEventListener('voiceschanged', handleEnd);
      }
    }
  };

  const handleExportText = () => {
    if (brailleResult.brailleText) {
      exportAsText(brailleResult.brailleText, inputText);
    }
  };

  const handleExportPrint = () => {
    if (brailleResult.brailleText) {
      exportForPrint(brailleResult.brailleText, inputText);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">中文盲文转换工具</h1>
          <p className="text-sm text-gray-500 mt-1">支持拼音转盲文和字形转盲文，可视化显示六点阵图形</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <InputArea value={inputText} onChange={setInputText} />
            <ConversionPanel mode={conversionMode} onChange={setConversionMode} />
            <BrailleTypeSelector brailleType={brailleType} onChange={setBrailleType} />
            <ControlPanel
              onSpeak={handleSpeak}
              onExportText={handleExportText}
              onExportPrint={handleExportPrint}
              isSpeaking={isSpeaking}
            />
            <StatsPanel
              charCount={brailleResult.charCount}
              convertedCount={brailleResult.convertedCount}
              unconvertedChars={brailleResult.unconvertedChars}
            />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <BrailleDisplay text={brailleResult.brailleText} />
            <DotMatrixViewer
              dotMatrixData={brailleResult.dotMatrixData}
              originalText={inputText}
            />
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-8">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <p className="text-center text-sm text-gray-500">
            中文盲文转换工具 - 使用 Unicode 盲文块编码 (U+2800-U+28FF)
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;