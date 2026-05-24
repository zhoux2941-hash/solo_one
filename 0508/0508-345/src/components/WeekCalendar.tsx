import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { RADIATION_SOURCES } from '../../shared/types';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);
const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function WeekCalendar() {
  const { applications, rooms, escorts, setSelectedApplication, setShowEditModal } =
    useAppStore();
  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    return new Date(now.setDate(diff));
  });

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const getSourceName = (sourceType: string) => {
    return RADIATION_SOURCES.find((s) => s.id === sourceType)?.name || sourceType;
  };

  const getRoomName = (roomId: string) => {
    return rooms.find((r) => r.id === roomId)?.name || roomId;
  };

  const getEscortNames = (escortIds: string[]) => {
    return escortIds
      .map((id) => escorts.find((e) => e.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 border-emerald-500 text-emerald-800';
      case 'pending':
        return 'bg-amber-100 border-amber-500 text-amber-800';
      case 'rejected':
        return 'bg-red-100 border-red-500 text-red-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getEventPosition = (app: { startTime: string; endTime: string }) => {
    const start = new Date(app.startTime);
    const end = new Date(app.endTime);
    const top = (start.getHours() - 7) * 60 + start.getMinutes();
    const height = (end.getTime() - start.getTime()) / 60000;
    return { top: `${top}px`, height: `${height}px` };
  };

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const handleEventClick = (app: any) => {
    setSelectedApplication(app);
    setShowEditModal(true);
  };

  const handleSlotClick = (date: Date, hour: number) => {
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(hour + 1, 30, 0, 0);
    
    setSelectedApplication({
      id: '',
      applicantId: 'current-user',
      applicantName: '当前用户',
      sourceType: '',
      roomId: '',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      escorts: [],
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    setShowEditModal(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">
            周历视图
          </h2>
          <span className="text-sm text-gray-500">
            {weekDays[0].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} -{' '}
            {weekDays[6].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const day = now.getDay();
              const diff = now.getDate() - day;
              setWeekStart(new Date(now.setDate(diff)));
            }}
            className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            本周
          </button>
          <button
            onClick={nextWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-gray-200">
            <div className="p-3 text-center text-sm font-medium text-gray-500 border-r border-gray-100">
              <Clock className="w-4 h-4 mx-auto" />
            </div>
            {weekDays.map((day, i) => {
              const isToday =
                day.toDateString() === new Date().toDateString();
              return (
                <div
                  key={i}
                  className={`p-3 text-center border-r border-gray-100 last:border-r-0 ${
                    isToday ? 'bg-teal-50' : ''
                  }`}
                >
                  <div className="text-xs text-gray-500">{DAY_NAMES[i]}</div>
                  <div
                    className={`text-lg font-semibold ${
                      isToday ? 'text-teal-600' : 'text-gray-800'
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-gray-50"
                style={{ height: '60px' }}
              >
                <div className="p-2 text-xs text-gray-400 text-right pr-3 border-r border-gray-100">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {weekDays.map((day, di) => (
                  <div
                    key={di}
                    className="border-r border-gray-50 last:border-r-0 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleSlotClick(day, hour)}
                  />
                ))}
              </div>
            ))}

            <div className="absolute inset-0 pointer-events-none" style={{ top: '0', left: '80px', right: '0' }}>
              <div className="grid grid-cols-7 h-full">
                {weekDays.map((day, di) => (
                  <div key={di} className="relative">
                    {applications
                      .filter((app) => {
                        const appDate = new Date(app.startTime).toDateString();
                        return appDate === day.toDateString();
                      })
                      .map((app) => {
                        const pos = getEventPosition(app);
                        return (
                          <div
                            key={app.id}
                            className={`absolute left-1 right-1 rounded border-l-4 p-2 cursor-pointer pointer-events-auto hover:shadow-md transition-shadow overflow-hidden ${getStatusStyle(
                              app.status
                            )}`}
                            style={{ top: pos.top, height: pos.height, minHeight: '40px' }}
                            onClick={() => handleEventClick(app)}
                          >
                            <div className="text-xs font-medium truncate">
                              {app.applicantName}
                            </div>
                            <div className="text-xs opacity-75 truncate">
                              {getSourceName(app.sourceType)} · {getRoomName(app.roomId)}
                            </div>
                            <div className="text-xs opacity-60 truncate">
                              {getEscortNames(app.escorts)}
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
  );
}
