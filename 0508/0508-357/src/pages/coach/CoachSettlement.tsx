import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Navbar from '../../components/Navbar';
import { Earning, Settlement } from '../../../shared/types';
import * as api from '../../lib/api';
import { formatDateTime } from '../../lib/time';
import { Calendar, Clock, DollarSign, TrendingUp, CheckCircle, Clock3 } from 'lucide-react';

type TabType = 'earnings' | 'settlements';

export default function CoachSettlement() {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('earnings');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [earningsData, settlementsData] = await Promise.all([
        api.getEarnings(),
        api.getSettlements(),
      ]);
      setEarnings(earningsData);
      setSettlements(settlementsData);
    } finally {
      setLoading(false);
    }
  };

  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
  const pendingEarnings = earnings.filter((e) => !e.settlementId).reduce((sum, e) => sum + e.amount, 0);
  const settledEarnings = earnings.filter((e) => e.settlementId).reduce((sum, e) => sum + e.amount, 0);
  
  const thisMonthEarnings = earnings.filter((e) => {
    const monthStr = dayjs().format('YYYY-MM');
    return e.classDate.startsWith(monthStr);
  });
  
  const thisMonthTotal = thisMonthEarnings.reduce((sum, e) => sum + e.amount, 0);
  const thisMonthClasses = thisMonthEarnings.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar role="coach" />
        <div className="max-w-6xl mx-auto px-4 py-8">
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
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">结算中心</h1>
          <p className="text-gray-600">查看您的课时费收入和结算记录</p>
        </div>

        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-500 rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-200 text-sm mb-1">本月收入</p>
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-bold">¥{thisMonthTotal.toFixed(0)}</span>
                  <span className="text-emerald-200 text-lg mb-2">
                    / {thisMonthClasses} 节课
                  </span>
                </div>
              </div>
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-10 h-10" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">¥{totalEarnings.toFixed(0)}</p>
            <p className="text-sm text-gray-500">累计收入</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock3 className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-600">¥{pendingEarnings.toFixed(0)}</p>
            <p className="text-sm text-gray-500">待结算</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-600">¥{settledEarnings.toFixed(0)}</p>
            <p className="text-sm text-gray-500">已结算</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{settlements.length}</p>
            <p className="text-sm text-gray-500">结算次数</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('earnings')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'earnings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              课时费明细
              <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {earnings.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('settlements')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'settlements'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              结算记录
              <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {settlements.length}
              </span>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'earnings' && (
              <>
                {earnings.length === 0 ? (
                  <div className="text-center py-16">
                    <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">暂无收入记录</h3>
                    <p className="text-gray-500">完成课程后会自动生成课时费记录</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">日期</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">会员</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">时间段</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">金额</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {earnings.map((earning) => (
                          <tr key={earning.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-900">{earning.classDate}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-gray-900">{earning.memberName}</span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{earning.startTime} - {earning.endTime}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="text-lg font-bold text-emerald-600">+¥{earning.amount}</span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span
                                className={`status-badge ${
                                  earning.settlementId ? 'status-completed' : 'status-pending'
                                }`}
                              >
                                {earning.settlementId ? '已结算' : '待结算'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeTab === 'settlements' && (
              <>
                {settlements.length === 0 ? (
                  <div className="text-center py-16">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">暂无结算记录</h3>
                    <p className="text-gray-500">每月1号自动生成上月结算单</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {settlements.map((settlement) => (
                      <div
                        key={settlement.id}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {settlement.month} 结算单
                            </h3>
                            <p className="text-sm text-gray-500">
                              结算周期：{settlement.startDate} 至 {settlement.endDate}
                            </p>
                          </div>
                          <span
                            className={`status-badge ${
                              settlement.status === 'paid' ? 'status-completed' : 'status-pending'
                            }`}
                          >
                            {settlement.status === 'paid' ? '已发放' : '待发放'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">课时数</p>
                            <p className="text-2xl font-bold text-gray-900">{settlement.totalClasses}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">结算金额</p>
                            <p className="text-2xl font-bold text-emerald-600">¥{settlement.totalAmount.toFixed(0)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500 mb-1">生成时间</p>
                            <p className="text-sm text-gray-700">
                              {formatDateTime(settlement.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Clock3 className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 mb-1">结算说明</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• 每完成1节课，课时费50元，系统自动记录</li>
                <li>• 每月1号00:00自动汇总上月所有课时费，生成月度结算单</li>
                <li>• 结算单生成后由管理员审核发放，请耐心等待</li>
                <li>• 如有疑问请联系系统管理员</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
