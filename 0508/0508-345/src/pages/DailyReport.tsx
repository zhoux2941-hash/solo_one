import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Calendar as CalendarIcon, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { reportApi } from '@/services/api';
import type { DailyReport as DailyReportType } from '../../shared/types';
import { Link } from 'react-router-dom';

export function DailyReportPage() {
  const { setIsLoading, setError } = useAppStore();
  const [report, setReport] = useState<DailyReportType | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    const loadReport = async () => {
      setIsLoading(true);
      try {
        const data = await reportApi.getDaily(selectedDate);
        setReport(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadReport();
  }, [selectedDate, setIsLoading, setError]);

  const handleExport = () => {
    if (!report) return;
    const csvContent = [
      ['日期', report.date].join(','),
      ['总申请数', report.totalApplications].join(','),
      ['已通过', report.approvedCount].join(','),
      ['待审批', report.pendingCount].join(','),
      ['已驳回', report.rejectedCount].join(','),
      ['冲突数量', report.conflictCount].join(','),
      '',
      ['机房利用率'],
      ...report.roomUtilization.map((r) => [r.roomName, `${r.utilization}%`].join(',')),
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `日报-${report.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const approvalRate = report?.totalApplications
    ? Math.round((report.approvedCount / report.totalApplications) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-800">日报汇总</h1>
                <p className="text-sm text-gray-500">放射治疗资源使用统计</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleExport}
                disabled={!report}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                导出
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {report ? (
          <>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">总申请数</span>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-gray-800">
                  {report.totalApplications}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">已通过</span>
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-3xl font-bold text-emerald-600">
                  {report.approvedCount}
                </div>
                <div className="text-xs text-gray-400 mt-1">通过率 {approvalRate}%</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">待审批</span>
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-3xl font-bold text-amber-600">
                  {report.pendingCount}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">已驳回</span>
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-3xl font-bold text-red-600">
                  {report.rejectedCount}
                </div>
                <div className="text-xs text-gray-400 mt-1">冲突 {report.conflictCount} 次</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">机房利用率</h2>
              <div className="space-y-4">
                {report.roomUtilization.map((room) => (
                  <div key={room.roomId}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {room.roomName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {room.utilization}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          room.utilization >= 80
                            ? 'bg-red-500'
                            : room.utilization >= 50
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${room.utilization}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">审批状态分布</h2>
              <div className="flex items-center justify-center py-8">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="12"
                    />
                    {report.approvedCount > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="12"
                        strokeDasharray={`${(report.approvedCount / report.totalApplications) * 251.2} 251.2`}
                        strokeLinecap="round"
                      />
                    )}
                    {report.pendingCount > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="12"
                        strokeDasharray={`${(report.pendingCount / report.totalApplications) * 251.2} 251.2`}
                        strokeDashoffset={`${-(report.approvedCount / report.totalApplications) * 251.2}`}
                        strokeLinecap="round"
                      />
                    )}
                    {report.rejectedCount > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="12"
                        strokeDasharray={`${(report.rejectedCount / report.totalApplications) * 251.2} 251.2`}
                        strokeDashoffset={`${-((report.approvedCount + report.pendingCount) / report.totalApplications) * 251.2}`}
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-gray-800">
                      {report.totalApplications}
                    </div>
                    <div className="text-xs text-gray-500">总申请</div>
                  </div>
                </div>
                <div className="ml-8 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm text-gray-600">已通过 ({report.approvedCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm text-gray-600">待审批 ({report.pendingCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm text-gray-600">已驳回 ({report.rejectedCount})</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
          </div>
        )}
      </main>
    </div>
  );
}
