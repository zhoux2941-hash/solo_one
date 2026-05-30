import { useState } from 'react';
import { Lock, Unlock, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import type { HeritageContent } from '@/types';

interface HeritageCardProps {
  content: HeritageContent;
  isUnlocked: boolean;
  currentScore: number;
}

export const HeritageCard = ({ content, isUnlocked, currentScore }: HeritageCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const progress = Math.min(100, (currentScore / content.unlockRequirement) * 100);
  const remaining = Math.max(0, content.unlockRequirement - currentScore);

  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-all duration-300 ${
      isUnlocked
        ? 'bg-white border-primary-300 shadow-md hover:shadow-lg'
        : 'bg-gray-50 border-gray-200'
    }`}>
      <button
        onClick={() => isUnlocked && setIsExpanded(!isExpanded)}
        className={`w-full p-6 text-left ${isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
        disabled={!isUnlocked}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className={`p-3 rounded-xl ${
              isUnlocked ? 'bg-primary-100' : 'bg-gray-200'
            }`}>
              {isUnlocked ? (
                <Unlock size={24} className="text-primary-600" />
              ) : (
                <Lock size={24} className="text-gray-400" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  isUnlocked ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                }`}>
                  {isUnlocked ? '已解锁' : `需${content.unlockRequirement}正确`}
                </span>
              </div>

              <h4 className={`text-xl font-display font-bold mb-2 ${
                isUnlocked ? 'text-primary-700' : 'text-gray-400'
              }`}>
                {content.title}
              </h4>

              {!isUnlocked && (
                <div className="space-y-2">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-400 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    再答对 <span className="font-bold text-primary-600">{remaining}</span> 题即可解锁
                  </p>
                </div>
              )}

              {isUnlocked && !isExpanded && (
                <p className="text-gray-600 line-clamp-2">{content.content}</p>
              )}
            </div>
          </div>

          {isUnlocked && (
            <div className="text-gray-400 ml-4">
              {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
          )}
        </div>
      </button>

      {isUnlocked && isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} className="text-primary-600" />
            <span className="text-sm font-medium text-primary-600">详细内容</span>
          </div>
          <p className="text-gray-700 leading-relaxed">
            {content.content}
          </p>
        </div>
      )}
    </div>
  );
};
