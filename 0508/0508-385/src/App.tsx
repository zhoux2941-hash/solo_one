import { useState } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { WordInput } from './components/WordInput';
import { BatchInput } from './components/BatchInput';
import { SyllableResult } from './components/SyllableResult';
import { RulePanel } from './components/RulePanel';
import type { SyllableResult as SyllableResultType } from './types';
import { analyzeWord, analyzeWords } from './utils/syllableRules';

function App() {
  const [results, setResults] = useState<SyllableResultType[]>([]);
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');

  const handleSingleAnalyze = (word: string) => {
    const result = analyzeWord(word);
    setResults([result]);
  };

  const handleBatchAnalyze = (words: string) => {
    const resultsList = analyzeWords(words);
    setResults(resultsList);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            英文单词音节切分
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            输入英文单词，自动切分音节、标注重音位置，支持批量处理
          </p>
        </header>

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'single'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            单单词查询
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'batch'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            批量处理
          </button>
        </div>

        <div className="mb-8">
          {activeTab === 'single' ? (
            <WordInput onAnalyze={handleSingleAnalyze} />
          ) : (
            <BatchInput onBatchAnalyze={handleBatchAnalyze} />
          )}
        </div>

        {results.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">分析结果</h2>
              <span className="px-2 py-0.5 bg-white/10 text-gray-400 text-sm rounded-full">
                {results.length} 个单词
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {results.map((result, index) => (
                <SyllableResult key={`${result.word}-${index}`} result={result} />
              ))}
            </div>
          </div>
        )}

        <RulePanel />

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>使用预置词库（约400+常用词）和规则引擎进行音节切分</p>
          <p className="mt-1">支持 Web Speech API 发音</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
