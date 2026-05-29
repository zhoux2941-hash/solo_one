interface StatsPanelProps {
  charCount: number;
  convertedCount: number;
  unconvertedChars: string[];
}

export function StatsPanel({ charCount, convertedCount, unconvertedChars }: StatsPanelProps) {
  const progress = charCount > 0 ? Math.round((convertedCount / charCount) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">转换统计</h2>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>转换进度</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-800">{charCount}</p>
            <p className="text-sm text-gray-500">总字数</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{convertedCount}</p>
            <p className="text-sm text-gray-500">已转换</p>
          </div>
        </div>
        
        {unconvertedChars.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">未转换字符:</p>
            <div className="flex flex-wrap gap-1">
              {unconvertedChars.slice(0, 20).map((char, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm"
                >
                  {char}
                </span>
              ))}
              {unconvertedChars.length > 20 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                  +{unconvertedChars.length - 20}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}