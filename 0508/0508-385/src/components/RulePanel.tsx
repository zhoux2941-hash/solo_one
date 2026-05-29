import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

export const RulePanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const rules = [
    {
      title: '开音节 (Open Syllable)',
      description: '以元音字母结尾的音节，元音发音为长音。',
      examples: ['me', 'go', 'be', 'she', 'so', 'he'],
      pattern: '元音字母结尾'
    },
    {
      title: '闭音节 (Closed Syllable)',
      description: '以辅音字母结尾的音节，元音发音为短音。',
      examples: ['cat', 'dog', 'pen', 'box', 'sit', 'run'],
      pattern: '辅音字母结尾'
    },
    {
      title: '元音+辅音+e',
      description: '结尾的"e"不发音，前面的元音发长音。',
      examples: ['cake', 'bike', 'home', 'use', 'tube', 'hope'],
      pattern: 'V + C + e'
    },
    {
      title: '元音组合',
      description: '两个元音字母组合在一起，通常发一个音。',
      examples: ['rain', 'tea', 'see', 'boat', 'coin', 'day'],
      pattern: '元音组合'
    },
    {
      title: '辅音连缀',
      description: '两个或多个辅音连在一起，不分开。',
      examples: ['stop', 'street', 'spring', 'splash', 'thunder'],
      pattern: '辅音连缀'
    },
    {
      title: '双辅音拆分',
      description: '两个相同辅音字母中间拆分。',
      examples: ['but-ter', 'let-ter', 'hap-py', 'lit-tle', 'mid-dle'],
      pattern: '双辅音中间拆分'
    }
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 transition-all duration-300 hover:bg-white/15 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-blue-400" />
          <span className="text-xl font-semibold text-white">音节规则说明</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-6 w-6 text-gray-400" />
        ) : (
          <ChevronDown className="h-6 w-6 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4 animate-fadeIn">
          {rules.map((rule, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm font-medium rounded-full">
                  {rule.pattern}
                </span>
                <h4 className="text-lg font-semibold text-white">{rule.title}</h4>
              </div>
              <p className="text-gray-300 mb-3">{rule.description}</p>
              <div className="flex flex-wrap gap-2">
                {rule.examples.map((example, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-white/10 text-gray-200 text-sm rounded-full"
                  >
                    {example}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
