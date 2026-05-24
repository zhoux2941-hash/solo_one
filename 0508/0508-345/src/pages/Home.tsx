import { useEffect } from 'react';
import { Plus, BarChart3, Calendar, Radio, Layers } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { applicationApi, roomApi, escortApi, reportApi } from '@/services/api';
import { WeekCalendar } from '@/components/WeekCalendar';
import { ResourcePanel } from '@/components/ResourcePanel';
import { ConflictAlert } from '@/components/ConflictAlert';
import { ApplicationModal } from '@/components/ApplicationModal';
import { Link } from 'react-router-dom';

export function Home() {
  const {
    setApplications,
    setRooms,
    setEscorts,
    setDailyReport,
    setIsLoading,
    setError,
    setShowEditModal,
    setSelectedApplication,
    currentConflict,
    error,
  } = useAppStore();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [apps, roomsData, escortsData, report] = await Promise.all([
          applicationApi.getAll(),
          roomApi.getAll(),
          escortApi.getAll(),
          reportApi.getDaily(),
        ]);
        setApplications(apps);
        setRooms(roomsData);
        setEscorts(escortsData);
        setDailyReport(report);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [setApplications, setRooms, setEscorts, setDailyReport, setIsLoading, setError]);

  const handleNewApplication = () => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const endTime = new Date(now);
    endTime.setHours(now.getHours() + 1, 30);

    setSelectedApplication({
      id: '',
      applicantId: 'current-user',
      applicantName: '',
      sourceType: '',
      roomId: '',
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
      escorts: [],
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    setShowEditModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Radio className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">放疗科领用预审台</h1>
                <p className="text-teal-100 text-sm">
                  放射源申请 · 机房管理 · 人员排班 · 冲突预警
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/schedule"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Layers className="w-5 h-5" />
                资源排布
              </Link>
              <Link
                to="/daily-report"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                日报汇总
              </Link>
              <button
                onClick={handleNewApplication}
                className="flex items-center gap-2 px-4 py-2 bg-white text-teal-700 rounded-lg hover:bg-teal-50 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                新建申请
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {currentConflict && <ConflictAlert />}

        <ResourcePanel />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-gray-800">申请时间轴</h2>
            <span className="text-sm text-gray-500 ml-2">
              点击空白时段创建新申请，点击已有申请进行编辑
            </span>
          </div>
          <WeekCalendar />
        </div>
      </main>

      <ApplicationModal />
    </div>
  );
}
