import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Navbar from '../../components/Navbar';
import { Coach, TimeSlot } from '../../../shared/types';
import * as api from '../../lib/api';
import { Star, Clock, CheckCircle, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export default function MemberBooking() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { memberProfile, refreshMemberProfile } = useAuthStore();

  useEffect(() => {
    setSelectedDate(dayjs().format('YYYY-MM-DD'));
    loadCoaches();
  }, []);

  useEffect(() => {
    if (selectedCoach && selectedDate) {
      loadTimeSlots();
    }
  }, [selectedCoach, selectedDate]);

  const loadCoaches = async () => {
    try {
      const data = await api.getCoaches();
      setCoaches(data);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeSlots = async () => {
    if (!selectedCoach) return;
    try {
      const data = await api.getCoachAvailableSlots(selectedCoach.id, selectedDate);
      setTimeSlots(data);
      setSelectedSlot(null);
    } catch (err) {
      console.error('Failed to load time slots:', err);
    }
  };

  const getDateOptions = () => {
    const dates = [];
    const today = dayjs();
    for (let i = 0; i < 7; i++) {
      const date = today.add(i, 'day');
      dates.push({
        value: date.format('YYYY-MM-DD'),
        label: date.locale('zh-cn').format('M月D日 ddd'),
        isToday: i === 0,
      });
    }
    return dates;
  };

  const handleDateChange = (direction: number) => {
    const dates = getDateOptions();
    const currentIndex = dates.findIndex((d) => d.value === selectedDate);
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < dates.length) {
      setSelectedDate(dates[newIndex].value);
    }
  };

  const handleBooking = async () => {
    if (!selectedCoach || !selectedSlot) return;

    if ((memberProfile?.remainingClasses || 0) <= 0) {
      setError('剩余课时不足，请先购买课时包');
      return;
    }

    if (!window.confirm(`确认预约 ${selectedCoach.name} 的课程吗？\n时间：${selectedSlot.date} ${selectedSlot.startTime}-${selectedSlot.endTime}`)) {
      return;
    }

    setBooking(true);
    setError('');

    try {
      await api.createBooking({
        coachId: selectedCoach.id,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });
      setSuccess(true);
      refreshMemberProfile();
      setTimeout(() => {
        navigate('/member/records');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || '预约失败，请重试');
      loadTimeSlots();
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar role="member" />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded-lg w-64" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-xl" />
                ))}
              </div>
              <div className="h-96 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="member" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">预约课程</h1>
          <p className="text-gray-600">选择教练和时间段，开启您的训练之旅</p>
        </div>

        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-xl flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            预约成功！正在跳转到预约记录...
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">选择教练</h2>
              <div className="space-y-4">
                {coaches.map((coach) => (
                  <div
                    key={coach.id}
                    onClick={() => setSelectedCoach(coach)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedCoach?.id === coach.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={coach.avatar}
                        alt={coach.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{coach.name}</h3>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            {coach.specialty}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{coach.bio}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="font-medium">{coach.rating}</span>
                          </div>
                          <div className="text-gray-500">
                            已授课 {coach.totalClasses} 节
                          </div>
                        </div>
                      </div>
                      {selectedCoach?.id === coach.id && (
                        <CheckCircle className="w-6 h-6 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedCoach && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">选择日期</h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleDateChange(-1)}
                    disabled={getDateOptions().findIndex((d) => d.value === selectedDate) === 0}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex-1 overflow-x-auto">
                    <div className="flex gap-2 min-w-max">
                      {getDateOptions().map((date) => (
                        <button
                          key={date.value}
                          onClick={() => setSelectedDate(date.value)}
                          className={`px-4 py-3 rounded-xl text-center min-w-[80px] transition-all duration-200 ${
                            selectedDate === date.value
                              ? 'bg-blue-500 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <div className="text-xs font-medium opacity-80">
                            {date.isToday ? '今天' : date.label.split(' ')[2]}
                          </div>
                          <div className="text-lg font-bold">
                            {date.label.split(' ')[1]}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDateChange(1)}
                    disabled={getDateOptions().findIndex((d) => d.value === selectedDate) === 6}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {selectedCoach && timeSlots.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">选择时间段</h2>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {timeSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => slot.isAvailable && setSelectedSlot(slot)}
                      disabled={!slot.isAvailable}
                      className={`p-3 rounded-xl text-center transition-all duration-200 ${
                        !slot.isAvailable
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : selectedSlot?.startTime === slot.startTime
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Clock className={`w-4 h-4 mx-auto mb-1 ${
                        !slot.isAvailable ? 'text-gray-300' : ''
                      }`} />
                      <div className="text-sm font-medium">
                        {slot.startTime}
                      </div>
                      <div className="text-xs opacity-70">
                        {slot.endTime}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">预约确认</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">剩余课时</span>
                  <span className="font-semibold text-blue-600">{memberProfile?.remainingClasses || 0} 节</span>
                </div>
                
                {selectedCoach && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">教练</span>
                    <span className="font-medium text-gray-900">{selectedCoach.name}</span>
                  </div>
                )}
                
                {selectedDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">日期</span>
                    <span className="font-medium text-gray-900">{selectedDate}</span>
                  </div>
                )}
                
                {selectedSlot && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">时间</span>
                    <span className="font-medium text-gray-900">
                      {selectedSlot.startTime} - {selectedSlot.endTime}
                    </span>
                  </div>
                )}
                
                <div className="border-t border-gray-100 pt-4 flex justify-between">
                  <span className="text-gray-700 font-medium">扣除课时</span>
                  <span className="text-xl font-bold text-blue-600">1 节</span>
                </div>
              </div>

              <button
                onClick={handleBooking}
                disabled={!selectedCoach || !selectedSlot || booking || success}
                className="w-full btn-primary flex items-center justify-center"
              >
                {booking ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    预约中...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    预约成功
                  </>
                ) : (
                  '确认预约'
                )}
              </button>

              {!selectedCoach && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  请先选择教练
                </p>
              )}
              {selectedCoach && !selectedSlot && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  请选择时间段
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
