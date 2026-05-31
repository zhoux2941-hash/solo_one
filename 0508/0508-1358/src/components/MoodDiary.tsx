import { ScrollText } from 'lucide-react';
import { LogEntry } from '@/types/pet';
import { formatTime, getMoodEmoji, getMoodText } from '@/utils/petUtils';

interface MoodDiaryProps {
  logs: LogEntry[];
}

const MoodDiary = ({ logs }: MoodDiaryProps) => {
  const getLogColor = (mood: string) => {
    switch (mood) {
      case 'happy':
        return 'border-l-green-400 bg-green-50';
      case 'sad':
        return 'border-l-red-400 bg-red-50';
      default:
        return 'border-l-gray-400 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg border-4 border-gray-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] overflow-hidden h-full flex flex-col">
      <div className="bg-gradient-to-r from-purple-400 to-pink-400 p-4 border-b-4 border-gray-900">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-white" />
          <h2 className="text-sm font-bold text-white pixel-text drop-shadow-md">
            📝 心情日记
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '500px' }}>
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📔</div>
            <p className="text-xs text-gray-500 pixel-text">还没有记录哦~</p>
            <p className="text-[10px] text-gray-400 pixel-text mt-1">
              喂食、洗澡、玩耍都会记录在这里
            </p>
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={log.id}
              className={`
                p-3 rounded-sm border-l-4 ${getLogColor(log.mood)}
                border-2 border-gray-200
                animate-fade-in
              `}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-[10px] text-gray-500 pixel-text font-mono">
                  {formatTime(log.timestamp)}
                </span>
                <span
                  className="text-[10px] pixel-text px-1.5 py-0.5 rounded-sm"
                  style={{
                    backgroundColor: log.mood === 'happy' ? '#86EFAC' : log.mood === 'sad' ? '#FCA5A5' : '#D1D5DB',
                    color: log.mood === 'happy' ? '#166534' : log.mood === 'sad' ? '#991B1B' : '#374151',
                  }}
                >
                  {getMoodEmoji(log.mood)} {getMoodText(log.mood)}
                </span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                {log.message}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="bg-gray-100 p-3 border-t-4 border-gray-900 text-center">
        <p className="text-[10px] text-gray-500 pixel-text">
          📊 共 {logs.length} 条记录 · 最多保存 50 条
        </p>
      </div>
    </div>
  );
};

export default MoodDiary;
