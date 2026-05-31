import type { WordCount } from '../types';

interface TopWordsProps {
  words: WordCount[];
}

export default function TopWords({ words }: TopWordsProps) {
  if (words.length === 0) return null;

  const maxCount = Math.max(...words.map((w) => w.count));

  const getRankStyle = (index: number) => {
    if (index === 0) return 'bg-yellow-500 text-white';
    if (index === 1) return 'bg-gray-400 text-white';
    if (index === 2) return 'bg-amber-600 text-white';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">
        Top 20 高频词
      </h3>
      <div className="space-y-3">
        {words.map((item, index) => (
          <div
            key={item.word}
            className="flex items-center gap-4 group hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getRankStyle(index)}`}
            >
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-800 truncate">
                  {item.word}
                </span>
                <span className="text-sm text-gray-500 ml-2 flex-shrink-0">
                  {item.count}次
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.count / maxCount) * 100}%`,
                    background: `linear-gradient(90deg, #FB7299, #FF8FA3)`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
