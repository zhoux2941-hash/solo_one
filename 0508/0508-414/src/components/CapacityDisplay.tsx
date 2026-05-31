import React from 'react';
import { Database, HardDrive } from 'lucide-react';
import { CapacityInfo } from '../utils/steganography';

interface CapacityDisplayProps {
  capacity: CapacityInfo;
  usedChars: number;
}

export default function CapacityDisplay({ capacity, usedChars }: CapacityDisplayProps) {
  const percentage = capacity.maxChars > 0 
    ? Math.min((usedChars / capacity.maxChars) * 100, 100) 
    : 0;
  
  const isWarning = percentage > 80;
  const isDanger = percentage > 95;

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <HardDrive className="w-4 h-4 text-accent-400" />
        <span className="text-sm font-medium text-slate-200">嵌入容量</span>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">已使用</span>
          <span className={isDanger ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-accent-400'}>
            {usedChars} / {capacity.maxChars} 字符
          </span>
        </div>
        
        <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isDanger ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'progress-bar'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Database className="w-3 h-3 text-slate-500" />
            <span className="text-slate-500">总位数: {capacity.totalBits.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-3 h-3 text-slate-500" />
            <span className="text-slate-500">可用字节: {capacity.maxChars.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
