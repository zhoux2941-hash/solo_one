import React, { useState } from 'react';
import { Link2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { getRhymeSuggestions, getRhymeGroupByWord, getAllRhymeCategories } from '../utils/poemGenerator';
import type { RhymeGroup } from '../data/rhyme';

interface RhymePanelProps {
  lastChar: string;
  inputChars?: string[];
}

export const RhymePanel: React.FC<RhymePanelProps> = ({ lastChar }) => {
  const rhymes = getRhymeSuggestions(lastChar);
  const currentGroup = getRhymeGroupByWord(lastChar);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const allGroups = getAllRhymeCategories();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mt-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg">
          <Link2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800">押韵辅助</h3>
          <p className="text-sm text-gray-500">推荐与「{lastChar}」押韵的字</p>
        </div>
      </div>

      {currentGroup && (
        <div className="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-indigo-700">{currentGroup.name}</span>
            <span className="text-sm text-indigo-500">{currentGroup.description}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentGroup.words.slice(0, 10).map((char, index) => (
              <span
                key={index}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  char === lastChar
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-indigo-600'
                }`}
              >
                {char}
              </span>
            ))}
            {currentGroup.words.length > 10 && (
              <span className="px-3 py-1 text-sm text-indigo-400">
                +{currentGroup.words.length - 10}
              </span>
            )}
          </div>
        </div>
      )}

      {rhymes.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {rhymes.map((char, index) => (
            <button
              key={index}
              className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-600 rounded-full hover:from-indigo-200 hover:to-blue-200 transition-colors font-medium"
            >
              {char}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm mb-4">暂无可推荐的押韵字</p>
      )}

      <button
        onClick={() => setShowAllGroups(!showAllGroups)}
        className="w-full flex items-center justify-between py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span>查看所有韵部</span>
        {showAllGroups ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {showAllGroups && (
        <div className="mt-4 grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
          {allGroups.map((group: RhymeGroup) => (
            <button
              key={group.name}
              className={`p-3 rounded-lg text-left transition-colors ${
                currentGroup?.name === group.name
                  ? 'bg-indigo-100 border-2 border-indigo-300'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="font-semibold text-gray-800">{group.name}</div>
              <div className="text-xs text-gray-500">{group.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
