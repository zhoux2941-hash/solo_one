import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Monitor,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { scheduleApi } from '@/services/scheduleApi';
import type {
  ScheduleViewData,
  ConflictRollbackRecord,
  ConflictAnalysis,
  ScheduleItem,
} from '../../shared/types';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

export function SchedulePage() {
  const [viewType, setViewType] = useState<'room' | 'escort'>('room');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [scheduleData, setScheduleData] = useState<ScheduleViewData | null>(null);
  const [conflictRecords, setConflictRecords] = useState<ConflictRollbackRecord[]>([]);
  const [conflictAnalysis, setConflictAnalysis] = useState<ConflictAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [view, records, analysis] = await Promise.all([
        scheduleApi.getView(viewType, selectedDate),
        scheduleApi.getRecentConflicts(3),
        scheduleApi.getConflictAnalysis(3),
      ]);
      setScheduleData(view);
      setConflictRecords(records);
      setConflictAnalysis(analysis);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [viewType, selectedDate]);

  const getResourceNames = () => {
    if (!scheduleData) return [];
    return [...new Set(scheduleData.items.map((item) => ({
      id: item.resourceId,
      name: item.resourceName,
    })))];
  };

  const getResourceItems = (resourceId: string) => {
    if (!scheduleData) return [];
    return scheduleData.items.filter((item) => item.resourceId === resourceId);
  };

  const getItemPosition = (item: ScheduleItem) => {
    const start = new Date(item.startTime);
    const end = new Date(item.endTime);
    const top = ((start.getHours() - 7) * 60 + start.getMinutes());
    const height = (end.getTime() - start.getTime()) / 60000;
    return { top: `${top}px`, height: `${height}px` };
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 border-l-4 border-emerald-500 text-emerald-800';
      case 'pending':
        return 'bg-amber-100 border-l-4 border-amber-500 text-amber-800';
      default:
        return 'bg-gray-100 border-l-4 border-gray-400 text-gray-800';
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const resources = getResourceNames();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-800">资源排布总览</h1>
                <p className="text-sm text-gray-500">
                  按机房/人员双视角查看排班
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 inline-flex gap-2">
              <button
                onClick={() => setViewType('room')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  viewType === 'room'
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Monitor className="w-4 h-4" />
                按机房视角
              </button>
              <button
                onClick={() => setViewType('escort')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  viewType === 'escort'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4" />
                按陪同人视角
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <div style={{ minWidth: `${Math.max(200, resources.length * 180)}px` }}>
                  <div className="grid border-b border-gray-200 bg-gray-50" style={{ gridTemplateColumns: `80px repeat(${resources.length}, 1fr)` }}>
                    <div className="p-3 text-center text-sm font-medium text-gray-500 border-r border-gray-200">
                      <Clock className="w-4 h-4 mx-auto" />
                    </div>
                    {resources.map((res) => (
                      <div
                        key={res.id}
                        className="p-3 text-center border-r border-gray-200 last:border-r-0"
                      >
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {res.name}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="relative">
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: `80px repeat(${resources.length}, 1fr)`,
                        height: `${HOURS.length * 50}px`,
                      }}
                    >
                      <div className="border-r border-gray-200">
                        {HOURS.map((hour) => (
                          <div
                            key={hour}
                            className="h-[50px] border-b border-gray-100 flex items-start justify-end pr-2 pt-1"
                          >
                            <span className="text-xs text-gray-400">
                              {hour.toString().padStart(2, '0')}:00
                            </span>
                          </div>
                        ))}
                      </div>

                      {resources.map((res, idx) => (
                        <div
                          key={res.id}
                          className="relative border-r border-gray-200 last:border-r-0"
                        >
                          {HOURS.map((hour) => (
                            <div
                              key={hour}
                              className="h-[50px] border-b border-gray-50 hover:bg-gray-50 transition-colors"
                            />
                          ))}

                          {getResourceItems(res.id).map((item) => {
                            const pos = getItemPosition(item);
                            return (
                              <div
                                key={item.id}
                                className={`absolute left-1 right-1 rounded p-1.5 text-xs overflow-hidden shadow-sm ${getStatusStyle(
                                  item.status
                                )}`}
                                style={{
                                  top: pos.top,
                                  height: pos.height,
                                  minHeight: '32px',
                                }}
                              >
                                <div className="font-medium truncate">
                                  {item.applicantName}
                                </div>
                                <div className="opacity-75 truncate">
                                  {item.sourceType}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-80 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h3 className="font-semibold text-gray-800">
                      近三天冲突回退记录
                    </h3>
                  </div>
                  <span className="text-xs text-gray-500">
                    {conflictRecords.length} 条
                  </span>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {conflictRecords.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    暂无冲突记录
                  </div>
                ) : (
                  conflictRecords.map((record) => (
                    <div
                      key={record.id}
                      className={`p-3 border-b border-gray-100 last:border-b-0 ${
                        record.resolved ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 text-xs rounded ${
                                record.type === 'room'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {record.type === 'room' ? '机房冲突' : '人员冲突'}
                            </span>
                            {record.resolved && (
                              <span className="flex items-center gap-1 text-xs text-emerald-600">
                                <CheckCircle2 className="w-3 h-3" />
                                已解决
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-sm font-medium text-gray-800">
                            {record.type === 'room'
                              ? record.roomName
                              : record.escortName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {record.applicantName} · {formatTime(record.startTime)}-{formatTime(record.endTime)}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            检测于 {formatDate(record.detectedAt)}
                          </div>
                          {record.resolution && (
                            <div className="mt-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                              处理：{record.resolution}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {conflictAnalysis && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-teal-500" />
                    <h3 className="font-semibold text-gray-800">冲突分析</h3>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-xl font-bold text-gray-800">
                        {conflictAnalysis.totalConflicts}
                      </div>
                      <div className="text-xs text-gray-500">总冲突</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded-lg">
                      <div className="text-xl font-bold text-red-600">
                        {conflictAnalysis.roomConflicts}
                      </div>
                      <div className="text-xs text-red-600">机房冲突</div>
                    </div>
                    <div className="text-center p-2 bg-amber-50 rounded-lg">
                      <div className="text-xl font-bold text-amber-600">
                        {conflictAnalysis.escortConflicts}
                      </div>
                      <div className="text-xs text-amber-600">人员冲突</div>
                    </div>
                  </div>

                  {conflictAnalysis.topConflictRooms.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-red-500" />
                        高频冲突机房
                      </div>
                      <div className="space-y-2">
                        {conflictAnalysis.topConflictRooms.map((room, idx) => (
                          <div key={room.roomId} className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-4">#{idx + 1}</span>
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-700">{room.roomName}</span>
                                <span className="text-red-600 font-medium">{room.count}次</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-red-400 rounded-full"
                                  style={{ width: `${Math.min(100, room.count * 20)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {conflictAnalysis.topConflictEscorts.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-amber-500" />
                        高频冲突人员
                      </div>
                      <div className="space-y-2">
                        {conflictAnalysis.topConflictEscorts.map((escort, idx) => (
                          <div key={escort.escortId} className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-4">#{idx + 1}</span>
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-700">{escort.escortName}</span>
                                <span className="text-amber-600 font-medium">{escort.count}次</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 rounded-full"
                                  style={{ width: `${Math.min(100, escort.count * 20)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {conflictAnalysis.recurringPatterns.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-teal-500" />
                        重复出现模式
                      </div>
                      <div className="space-y-1">
                        {conflictAnalysis.recurringPatterns.map((pattern, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded"
                          >
                            <span className="text-gray-700">{pattern.pattern}</span>
                            <span className="font-medium text-teal-600">{pattern.count}次</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
