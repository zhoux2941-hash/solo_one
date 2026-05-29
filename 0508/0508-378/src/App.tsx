import { useState, useCallback } from 'react';
import { Feather, BookOpen } from 'lucide-react';
import { InputPanel } from './components/InputPanel';
import { PoemDisplay } from './components/PoemDisplay';
import { PingzePanel } from './components/PingzePanel';
import { RhymePanel } from './components/RhymePanel';
import { ExportPanel } from './components/ExportPanel';
import { generatePoem } from './utils/poemGenerator';
import type { GeneratedPoem } from './utils/poemGenerator';
import './App.css';

const defaultPoem: GeneratedPoem = {
  lines: [],
  sources: []
};

function App() {
  const [currentPoem, setCurrentPoem] = useState<GeneratedPoem>(defaultPoem);
  const [inputChars, setInputChars] = useState<string[]>([]);

  const handleGenerate = useCallback((chars: string[]) => {
    const poem = generatePoem(chars);
    setCurrentPoem(poem);
    setInputChars(chars);
  }, []);

  const handleRegenerate = useCallback(() => {
    if (inputChars.length > 0) {
      const poem = generatePoem(inputChars);
      setCurrentPoem(poem);
    }
  }, [inputChars]);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg mb-4">
            <Feather className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 text-shadow">藏头诗生成器</h1>
          <p className="text-white/80 flex items-center justify-center gap-2">
            <BookOpen className="w-4 h-4" />
            古韵新词，诗意盎然
          </p>
        </header>

        <InputPanel onGenerate={handleGenerate} />

        {currentPoem.lines.length > 0 && (
          <>
            <PoemDisplay poem={currentPoem} onRegenerate={handleRegenerate} />
            
            <PingzePanel poem={currentPoem.lines} />
            
            {currentPoem.lines.length > 0 && (
              <RhymePanel lastChar={currentPoem.lines[currentPoem.lines.length - 1].slice(-1)} />
            )}
            
            <ExportPanel poem={currentPoem.lines} />
          </>
        )}

        {currentPoem.lines.length === 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Feather className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">等待灵感降临</h3>
            <p className="text-gray-500">输入藏头字，开启诗意之旅</p>
          </div>
        )}

        <footer className="mt-8 text-center text-white/60 text-sm">
          <p>传承中华诗词文化，感受古韵之美</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
