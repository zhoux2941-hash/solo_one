import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { Booking } from '../../../shared/types';
import * as api from '../../lib/api';
import { formatDateTime } from '../../lib/time';
import { Clock, Calendar, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

type FilterType = 'all' | 'pending' | 'completed' | 'cancelled';

export default function MemberRecords() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await api.getMemberBookings();
      setBookings(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (booking: Booking) => {
    if (!window.confirm(`确定要取消 ${booking.date} ${booking.startTime}-${booking.endTime} 的预约吗？`)) {
      return;
    }

    setCancellingId(booking.id);
    try {
      await api.cancelBooking(booking.id);
      loadBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || '取消失败，请重试');
    } finally {
      setCancellingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string; icon: any }> = {
      pending: {
        label: '待上课',
        className: 'status-pending',
        icon: Clock,
      },
      'in-progress': {
        label: '进行中',
        className: 'status-in-progress',
        icon: Calendar,
      },
      completed: {
        label: '已完成',
        className: 'status-completed',
        icon: CheckCircle,
      },
      cancelled: {
        label: '已取消',
        className: 'status-cancelled',
        icon: XCircle,
      },
    };
    return configs[status] || configs.pending;
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待上课' },
    { key: 'completed', label: '已完成' },
    { key: 'cancelled', label: '已取消' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar role="member" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded-lg w-64" />
            <div className="h-10 bg-gray-200 rounded-lg w-full max-w-md" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="member" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">预约记录</h1>
          <p className="text-gray-600">查看您的所有预约历史记录</p>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无预约记录</h3>
            <p className="text-gray-500 mb-6">快去预约您的第一节课吧</p>
            <a
              href="/member/booking"
              className="inline-block btn-primary"
            >
              立即预约
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const statusConfig = getStatusConfig(booking.status);
              const StatusIcon = statusConfig.icon;
              return (
                <div
                  key={booking.id}
                  className="card hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          booking.status === 'completed'
                            ? 'bg-emerald-100'
                            : booking.status === 'cancelled'
                            ? 'bg-gray-100'
                            : 'bg-blue-100'
                        }`}
                      >
                        <StatusIcon
                          className={`w-6 h-6 ${
                            booking.status === 'completed'
                              ? 'text-emerald-600'
                              : booking.status === 'cancelled'
                              ? 'text-gray-500'
                              : 'text-blue-600'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {booking.coachName}
                          </h3>
                          <span className={`status-badge ${statusConfig.className}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
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

                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(booking)}
                        disabled={cancellingId === booking.id}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancellingId === booking.id ? (
                          <>
                            <Loader2 className="w-4 h-4 inline mr-1 animate-spin" />
                            取消中
                          </>
                        ) : (
                          '取消预约'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 mb-1">取消预约须知</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• 课程开始前24小时可免费取消，课时将原路返还</li>
                <li>• 逾期取消将扣除1课时</li>
                <li>• 如需改期，请先取消再重新预约</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
