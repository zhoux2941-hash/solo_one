import React, { useState } from 'react';
import { Edit3, Check, X, RefreshCw } from 'lucide-react';
import type { GeneratedPoem } from '../utils/poemGenerator';

interface PoemDisplayProps {
  poem: GeneratedPoem;
  onRegenerate: () => void;
}

export const PoemDisplay: React.FC<PoemDisplayProps> = ({ poem, onRegenerate }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedLines, setEditedLines] = useState<string[]>([...poem.lines]);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
  };

  const handleSave = () => {
    setEditingIndex(null);
  };

  const handleCancel = () => {
    setEditedLines([...poem.lines]);
    setEditingIndex(null);
  };

  const handleLineChange = (index: number, value: string) => {
    const newLines = [...editedLines];
    newLines[index] = value;
    setEditedLines(newLines);
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">生成结果</h2>
        <button
          onClick={onRegenerate}
          className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          重新生成
        </button>
      </div>

      <div className="space-y-4">
        {editedLines.map((line, index) => (
          <div key={index} className="group">
            <div className="flex items-center gap-4">
              <span className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 rounded-full text-purple-600 font-bold">
                {index + 1}
              </span>
              
              {editingIndex === index ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={line}
                    onChange={(e) => handleLineChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500"
                    maxLength={7}
                  />
                  <button
                    onClick={handleSave}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-2 bg-gray-300 text-white rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-2xl font-medium text-gray-800 poem-text">
                    {line}
                  </span>
                  <button
                    onClick={() => handleEdit(index)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            {poem.sources[index] === 'library' && (
              <div className="ml-12 mt-1">
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">
                  诗词库匹配
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
