import React, { useState } from 'react';
import { FileText, ArrowRight } from 'lucide-react';

interface BatchInputProps {
  onBatchAnalyze: (words: string) => void;
}

export const BatchInput: React.FC<BatchInputProps> = ({ onBatchAnalyze }) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onBatchAnalyze(text.trim());
      setText('');
    }
  };

  const wordCount = text.trim() ? text.trim().split(/[\s,，.。!！?？;；:：]+/).filter(w => w.trim()).length : 0;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative">
        <div className="absolute top-4 left-4 flex items-center pointer-events-none">
          <FileText className="h-5 w-5 text-gray-400" />
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="批量输入多个英文单词，用空格、逗号或换行分隔..."
          rows={4}
          className="w-full pl-12 pr-32 py-4 text-lg bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 resize-none"
        />
        <button
          onClick={handleSubmit}
          className="absolute right-2 bottom-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
        >
          批量切分 ({wordCount})
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
