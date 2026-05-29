import React, { useState } from 'react';
import { PenTool, Sparkles } from 'lucide-react';

interface InputPanelProps {
  onGenerate: (chars: string[]) => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({ onGenerate }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chars = inputValue
      .replace(/\s/g, '')
      .split('')
      .filter(char => char.length > 0);
    
    if (chars.length >= 1 && chars.length <= 8) {
      onGenerate(chars);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
          <PenTool className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">输入藏头字</h2>
          <p className="text-sm text-gray-500">请输入1-8个汉字，每字为一句首字</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="例如：春夏秋冬"
            className="w-full px-6 py-4 text-xl text-center font-medium bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
            maxLength={8}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            {inputValue.length}/8
          </div>
        </div>
        
        <button
          type="submit"
          disabled={inputValue.replace(/\s/g, '').length < 1}
          className="w-full mt-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          <Sparkles className="w-5 h-5" />
          生成藏头诗
        </button>
      </form>
      
      <div className="mt-4 text-center text-sm text-gray-400">
        支持1-8个藏头字，按字数生成对应句数的诗，优先匹配诗词库
      </div>
    </div>
  );
};
