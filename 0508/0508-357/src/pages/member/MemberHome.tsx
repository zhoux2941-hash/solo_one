import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import Navbar from '../../components/Navbar';
import { CreditCard, Calendar, Clock, ChevronRight, BookOpen, AlertTriangle, Clock3 } from 'lucide-react';
import * as api from '../../lib/api';
import { Booking, Package, ExpirationReminder } from '../../../shared/types';
import { formatDate } from '../../lib/time';

export default function MemberHome() {
  const { memberProfile, refreshMemberProfile } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [expirationReminder, setExpirationReminder] = useState<ExpirationReminder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bookingsData, packagesData, reminderData] = await Promise.all([
        api.getMemberBookings(),
        api.getPackages(),
        api.getExpirationReminders().catch(() => null),
      ]);
      setBookings(bookingsData);
      setPackages(packagesData);
      if (reminderData) {
        setExpirationReminder(reminderData);
      }
      refreshMemberProfile();
    } finally {
      setLoading(false);
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const completedBookings = bookings.filter((b) => b.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar role="member" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-gray-200 rounded-2xl" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="member" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-600 rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <p className="text-blue-200 text-sm mb-1">我的课时</p>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-6xl font-bold">{memberProfile?.remainingClasses || 0}</span>
              <span className="text-blue-200 text-lg mb-2">节</span>
            </div>
            
            <div className="flex gap-8 text-sm">
              <div>
                <span className="text-blue-200">已购买</span>
                <p className="text-2xl font-semibold">{memberProfile?.totalPurchased || 0}节</p>
              </div>
              <div>
                <span className="text-blue-200">已使用</span>
                <p className="text-2xl font-semibold">{memberProfile?.totalUsed || 0}节</p>
              </div>
            </div>
          </div>
        </div>

        {expirationReminder && expirationReminder.packages.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 text-lg mb-2">
                  课时即将过期提醒
                </h3>
                <p className="text-amber-700 mb-4">
                  您有 <span className="font-bold">{expirationReminder.totalExpiringClasses}</span> 节课时即将过期，请及时使用！
                </p>
                <div className="space-y-3">
                  {expirationReminder.packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="flex items-center justify-between bg-white rounded-lg px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Clock3 className={`w-5 h-5 ${pkg.isExpired ? 'text-red-500' : 'text-amber-500'}`} />
                        <div>
                          <p className="font-medium text-gray-900">{pkg.packageName}</p>
                          <p className="text-sm text-gray-500">
                            剩余 {pkg.remainingClasses} 节课时
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {pkg.isExpired ? (
                          <span className="text-red-600 font-medium">已过期</span>
                        ) : (
                          <span className={`font-medium ${
                            pkg.daysRemaining <= 3 ? 'text-red-600' : 'text-amber-600'
                          }`}>
                            {pkg.daysRemaining}天后过期
                          </span>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          有效期至 {formatDate(pkg.expireDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  to="/member/booking"
                  className="inline-flex items-center gap-2 mt-4 text-amber-700 hover:text-amber-800 font-medium"
                >
                  立即预约使用 →
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            to="/member/packages"
            className="card group hover:border-blue-300 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">购买课时</h3>
                  <p className="text-sm text-gray-500">多种套餐可选</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            to="/member/booking"
            className="card group hover:border-blue-300 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center text-white">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">预约课程</h3>
                  <p className="text-sm text-gray-500">选择教练和时间</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            to="/member/records"
            className="card group hover:border-blue-300 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">预约记录</h3>
                  <p className="text-sm text-gray-500">查看历史记录</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">待上课</h2>
              <span className="status-badge status-pending">{pendingBookings.length}节</span>
            </div>
            
            {pendingBookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">暂无待上课预约</p>
                <Link
                  to="/member/booking"
                  className="inline-block mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  立即预约 →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingBookings.slice(0, 3).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{booking.coachName}</p>
                        <p className="text-sm text-gray-500">
                          {booking.date} {booking.startTime}-{booking.endTime}
                        </p>
                      </div>
                    </div>
                    <span className="status-badge status-pending">待上课</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">已完成</h2>
              <span className="status-badge status-completed">{completedBookings.length}节</span>
            </div>
            
            {completedBookings.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">暂无已完成课程</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedBookings.slice(0, 3).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{booking.coachName}</p>
                        <p className="text-sm text-gray-500">
                          {booking.date} {booking.startTime}-{booking.endTime}
                        </p>
                      </div>
                    </div>
                    <span className="status-badge status-completed">已完成</span>
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
