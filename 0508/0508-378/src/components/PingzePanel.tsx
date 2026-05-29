import React, { useState } from 'react';
import { Music, ChevronDown, ChevronUp } from 'lucide-react';
import { analyzePingze } from '../utils/poemGenerator';

interface PingzePanelProps {
  poem: string[];
}

export const PingzePanel: React.FC<PingzePanelProps> = ({ poem }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const pingzeResult = analyzePingze(poem);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mt-6">
      <button
        onClick={toggleExpand}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-800">格律检查</h3>
            <p className="text-sm text-gray-500">平仄分析与建议</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-6 space-y-4 animate-fade-in">
          {poem.map((line, index) => (
            <div key={index} className="flex items-center gap-4">
              <span className="w-6 text-gray-400 font-medium">
                {index + 1}
              </span>
              <span className="flex-1 text-lg poem-text">
                {line}
              </span>
              <div className="flex gap-0.5">
                {pingzeResult[index].split('').map((char, charIndex) => (
                  <span
                    key={charIndex}
                    className={`px-2 py-1 text-sm font-medium rounded ${
                      char === '平'
                        ? 'bg-blue-100 text-blue-600'
                        : char === '仄'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-6 p-4 bg-amber-50 rounded-xl">
            <h4 className="font-medium text-amber-800 mb-2">七言诗常见格律</h4>
            <div className="text-sm text-amber-700 space-y-1">
              <p>平起首句入韵: 平平仄仄仄平平</p>
              <p>平起首句不入韵: 平平仄仄平平仄</p>
              <p>仄起首句入韵: 仄仄平平仄仄平</p>
              <p>仄起首句不入韵: 仄仄平平平仄仄</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
