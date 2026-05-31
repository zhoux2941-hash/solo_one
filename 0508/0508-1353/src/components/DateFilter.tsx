import React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatDate, getStartOfWeek, getStartOfMonth, getEndOfDay } from '../utils/dateUtils';

export const DateFilter: React.FC = () => {
  const { dateRange, setDateRange, records } = useAppStore();

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateRange({
      ...dateRange,
      start: value ? new Date(value) : null,
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateRange({
      ...dateRange,
      end: value ? new Date(value) : null,
    });
  };

  const handleQuickSelect = (type: 'week' | 'month' | 'all') => {
    if (type === 'all') {
      setDateRange({ start: null, end: null });
    } else if (type === 'week') {
      setDateRange({ start: getStartOfWeek(), end: getEndOfDay() });
    } else if (type === 'month') {
      setDateRange({ start: getStartOfMonth(), end: getEndOfDay() });
    }
  };

  const handleReset = () => {
    setDateRange({ start: null, end: null });
  };

  if (records.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" />
          <span className="font-medium text-gray-700">日期范围</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start ? formatDate(dateRange.start) : ''}
              onChange={handleStartDateChange}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <span className="text-gray-400">至</span>
            <input
              type="date"
              value={dateRange.end ? formatDate(dateRange.end) : ''}
              onChange={handleEndDateChange}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleQuickSelect('week')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                dateRange.start && 
                dateRange.end && 
                Math.abs(dateRange.start.getTime() - getStartOfWeek().getTime()) < 86400000
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              本周
            </button>
            <button
              onClick={() => handleQuickSelect('month')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                dateRange.start && 
                dateRange.end && 
                Math.abs(dateRange.start.getTime() - getStartOfMonth().getTime()) < 86400000
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              本月
            </button>
            <button
              onClick={() => handleQuickSelect('all')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                !dateRange.start && !dateRange.end
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
          </div>
          
          <button
            onClick={handleReset}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="重置"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
