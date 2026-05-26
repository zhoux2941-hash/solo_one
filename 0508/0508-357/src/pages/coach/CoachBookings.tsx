import { useEffect, useState, useRef } from 'react';
import dayjs from 'dayjs';
import Navbar from '../../components/Navbar';
import { Booking } from '../../../shared/types';
import * as api from '../../lib/api';
import { formatDateTime } from '../../lib/time';
import { Calendar, Clock, Play, CheckCircle, Loader2, Timer, Users, AlertTriangle, DollarSign } from 'lucide-react';

type FilterType = 'all' | 'pending' | 'in-progress' | 'completed' | 'cancelled';

export default function CoachBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSelectedDate(dayjs().format('YYYY-MM-DD'));
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadBookings();
    }
  }, [selectedDate]);

  useEffect(() => {
    const inProgressBooking = bookings.find((b) => b.status === 'in-progress');
    if (inProgressBooking && !activeBooking) {
      setActiveBooking(inProgressBooking);
      if (inProgressBooking.startedAt) {
        const startTime = dayjs(inProgressBooking.startedAt).valueOf();
        const elapsed = Math.floor((dayjs().valueOf() - startTime) / 1000);
        setElapsedTime(elapsed);
        startTimer();
      }
    }
  }, [bookings]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const loadBookings = async () => {
    try {
      const data = await api.getCoachBookings(selectedDate);
      setBookings(data);
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async (booking: Booking) => {
    if (!window.confirm(`确认开始 ${booking.memberName} 的课程吗？`)) {
      return;
    }

    setActionLoading(booking.id);
    try {
      await api.startBooking(booking.id);
      setActiveBooking(booking);
      setElapsedTime(0);
      startTimer();
      loadBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || '操作失败，请重试');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (booking: Booking) => {
    if (!window.confirm(`确认结束 ${booking.memberName} 的课程并消课吗？\n\n此操作将扣除会员1节课时，同时记录您的课时费50元。`)) {
      return;
    }

    setActionLoading(booking.id);
    try {
      await api.completeBooking(booking.id);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setActiveBooking(null);
      setElapsedTime(0);
      loadBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || '操作失败，请重试');
    } finally {
      setActionLoading(null);
    }
  };

  const getDateOptions = () => {
    const dates = [];
    const today = dayjs();
    for (let i = -3; i <= 3; i++) {
      const date = today.add(i, 'day');
      dates.push({
        value: date.format('YYYY-MM-DD'),
        label: date.locale('zh-cn').format('M月D日 ddd'),
        isToday: i === 0,
      });
    }
    return dates;
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      pending: { label: '待上课', className: 'status-pending' },
      'in-progress': { label: '进行中', className: 'status-in-progress' },
      completed: { label: '已完成', className: 'status-completed' },
      cancelled: { label: '已取消', className: 'status-cancelled' },
    };
    return configs[status] || configs.pending;
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待上课' },
    { key: 'in-progress', label: '进行中' },
    { key: 'completed', label: '已完成' },
    { key: 'cancelled', label: '已取消' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar role="coach" />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-40 bg-gray-200 rounded-2xl" />
            <div className="h-12 bg-gray-200 rounded-lg w-full max-w-md" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="coach" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">预约管理</h1>
          <p className="text-gray-600">查看和管理您的课程预约</p>
        </div>

        {activeBooking && (
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-600 rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-blue-200 font-medium">课程进行中</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <div>
                  <p className="text-blue-200 text-sm mb-1">会员</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{activeBooking.memberName}</p>
                      <p className="text-blue-200 text-sm">
                        {activeBooking.date} {activeBooking.startTime}-{activeBooking.endTime}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-blue-200 text-sm mb-1">已上课时长</p>
                  <div className="flex items-center justify-center gap-3">
                    <Timer className="w-8 h-8" />
                    <span className="text-5xl font-bold font-mono">{formatTime(elapsedTime)}</span>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={() => handleComplete(activeBooking)}
                    disabled={actionLoading === activeBooking.id}
                    className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading === activeBooking.id ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        消课中...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        结束消课
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-4">选择日期</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {getDateOptions().map((date) => (
              <button
                key={date.value}
                onClick={() => setSelectedDate(date.value)}
                className={`px-4 py-3 rounded-xl text-center min-w-[90px] transition-all duration-200 flex-shrink-0 ${
                  selectedDate === date.value
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="text-xs font-medium opacity-80">
                  {date.isToday ? '今天' : date.label.split(' ')[1]}
                </div>
                <div className="text-lg font-bold">
                  {date.label.split(' ')[0]}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                filter === f.key
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f.label}
              <span className="ml-1 opacity-70">
                ({bookings.filter((b) => (f.key === 'all' ? true : b.status === f.key)).length})
              </span>
            </button>
          ))}
        </div>

        {filteredBookings.length === 0 ? (
          <div className="card text-center py-16">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无预约</h3>
            <p className="text-gray-500">该日期没有预约记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const statusConfig = getStatusConfig(booking.status);
              return (
                <div
                  key={booking.id}
                  className={`card hover:shadow-md transition-shadow duration-200 ${
                    booking.status === 'in-progress' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          booking.status === 'completed'
                            ? 'bg-emerald-100'
                            : booking.status === 'cancelled'
                            ? 'bg-gray-100'
                            : booking.status === 'in-progress'
                            ? 'bg-blue-100'
                            : 'bg-yellow-100'
                        }`}
                      >
                        <Users
                          className={`w-7 h-7 ${
                            booking.status === 'completed'
                              ? 'text-emerald-600'
                              : booking.status === 'cancelled'
                              ? 'text-gray-500'
                              : booking.status === 'in-progress'
                              ? 'text-blue-600'
                              : 'text-yellow-600'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {booking.memberName}
                          </h3>
                          <span className={`status-badge ${statusConfig.className}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {booking.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {booking.startTime} - {booking.endTime}
                          </div>
                        </div>
                        {booking.startedAt && (
                          <p className="text-xs text-gray-400 mt-2">
                            开始时间：{formatDateTime(booking.startedAt)}
                          </p>
                        )}
                        {booking.completedAt && (
                          <p className="text-xs text-gray-400">
                            结束时间：{formatDateTime(booking.completedAt)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {booking.status === 'pending' && !activeBooking && (
                        <button
                          onClick={() => handleStart(booking)}
                          disabled={actionLoading === booking.id}
                          className="btn-success flex items-center gap-2"
                        >
                          {actionLoading === booking.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          开始上课
                        </button>
                      )}
                      {booking.status === 'pending' && activeBooking && (
                        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                          <AlertTriangle className="w-4 h-4" />
                          有进行中的课程
                        </div>
                      )}
                      {booking.status === 'completed' && (
                        <div className="text-emerald-600 font-medium flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          +¥50
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-1">操作说明</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 点击「开始上课」按钮启动计时器，系统将记录课程开始时间</li>
                <li>• 课程结束后点击「结束消课」，系统将自动扣除会员1课时</li>
                <li>• 每完成1节课，您将获得50元课时费，每月1号自动汇总结算</li>
                <li>• 同一时间只能有1节进行中的课程</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
