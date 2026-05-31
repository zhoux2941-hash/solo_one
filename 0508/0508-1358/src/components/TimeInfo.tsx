import { Clock } from 'lucide-react';
import { formatDateTime } from '@/utils/petUtils';

interface TimeInfoProps {
  lastFed: string;
  lastCleaned: string;
  lastPlayed: string;
}

const TimeInfo = ({ lastFed, lastCleaned, lastPlayed }: TimeInfoProps) => {
  return (
    <div className="bg-gray-100 rounded-sm border-2 border-gray-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-gray-600" />
        <span className="text-xs font-bold text-gray-700 pixel-text">活动记录</span>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🍖</span>
            <span className="text-gray-600 pixel-text">上次喂食</span>
          </div>
          <span className="text-gray-800 pixel-text font-medium">
            {formatDateTime(lastFed)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🛁</span>
            <span className="text-gray-600 pixel-text">上次洗澡</span>
          </div>
          <span className="text-gray-800 pixel-text font-medium">
            {formatDateTime(lastCleaned)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🎾</span>
            <span className="text-gray-600 pixel-text">上次玩耍</span>
          </div>
          <span className="text-gray-800 pixel-text font-medium">
            {formatDateTime(lastPlayed)}
          </span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-300">
        <p className="text-[10px] text-gray-500 pixel-text text-center">
          💡 数值每小时自动下降 5 点
        </p>
      </div>
    </div>
  );
};

export default TimeInfo;
