import { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import type { KeyboardEvent } from 'react';

interface WordInputProps {
  onAnalyze: (word: string) => void;
}

export const WordInput: React.FC<WordInputProps> = ({ onAnalyze }) => {
  const [word, setWord] = useState('');

  const handleSubmit = () => {
    if (word.trim()) {
      onAnalyze(word.trim());
      setWord('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入英文单词，如 computer..."
          className="w-full pl-12 pr-32 py-4 text-lg bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
        />
        <button
          onClick={handleSubmit}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
        >
          切分
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
