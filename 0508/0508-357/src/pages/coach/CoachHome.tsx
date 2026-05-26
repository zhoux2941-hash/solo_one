import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import Navbar from '../../components/Navbar';
import { Booking, Earning, Settlement } from '../../../shared/types';
import * as api from '../../lib/api';
import { Calendar, Clock, DollarSign, Users, ChevronRight, Play, CheckCircle } from 'lucide-react';

export default function CoachHome() {
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const [bookingsData, earningsData, settlementsData] = await Promise.all([
        api.getCoachBookings(today),
        api.getEarnings(),
        api.getSettlements(),
      ]);
      setTodayBookings(bookingsData);
      setEarnings(earningsData);
      setSettlements(settlementsData);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = todayBookings.filter((b) => b.status === 'pending').length;
  const inProgressCount = todayBookings.filter((b) => b.status === 'in-progress').length;
  const completedCount = todayBookings.filter((b) => b.status === 'completed').length;
  
  const thisMonthEarnings = earnings.filter((e) => {
    const monthStr = dayjs().format('YYYY-MM');
    return e.classDate.startsWith(monthStr);
  });
  
  const totalEarningsAmount = thisMonthEarnings.reduce((sum, e) => sum + e.amount, 0);
  const pendingSettlement = settlements.find((s) => s.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar role="coach" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-gray-200 rounded-2xl" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-xl" />
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="coach" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-500 rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <p className="text-emerald-200 text-sm mb-1">本月收入</p>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-6xl font-bold">¥{totalEarningsAmount.toFixed(0)}</span>
              <span className="text-emerald-200 text-lg mb-2">
                / {thisMonthEarnings.length} 节课
              </span>
            </div>
            
            {pendingSettlement && (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">
                  待结算：¥{pendingSettlement.totalAmount.toFixed(0)} / {pendingSettlement.totalClasses}节课
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{todayBookings.length}</span>
            </div>
            <p className="text-sm text-gray-500">今日预约</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-2xl font-bold text-yellow-600">{pendingCount}</span>
            </div>
            <p className="text-sm text-gray-500">待上课</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-blue-600">{inProgressCount}</span>
            </div>
            <p className="text-sm text-gray-500">进行中</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-emerald-600">{completedCount}</span>
            </div>
            <p className="text-sm text-gray-500">已完成</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">今日预约</h2>
              <Link
                to="/coach/bookings"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            {todayBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">今日暂无预约</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayBookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{booking.memberName}</p>
                        <p className="text-sm text-gray-500">
                          {booking.startTime} - {booking.endTime}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`status-badge ${
                        booking.status === 'pending'
                          ? 'status-pending'
                          : booking.status === 'in-progress'
                          ? 'status-in-progress'
                          : 'status-completed'
                      }`}
                    >
                      {booking.status === 'pending'
                        ? '待上课'
                        : booking.status === 'in-progress'
                        ? '进行中'
                        : '已完成'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">最近收入</h2>
              <Link
                to="/coach/settlement"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            {earnings.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">暂无收入记录</p>
              </div>
            ) : (
              <div className="space-y-4">
                {earnings.slice(0, 5).map((earning) => (
                  <div
                    key={earning.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{earning.memberName}</p>
                        <p className="text-sm text-gray-500">{earning.classDate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">+¥{earning.amount}</p>
                      <p className="text-xs text-gray-400">
                        {earning.settlementId ? '已结算' : '待结算'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
