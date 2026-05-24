import { Monitor, Users, Radio, Activity } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { RADIATION_SOURCES } from '../../shared/types';

export function ResourcePanel() {
  const { applications, rooms, escorts } = useAppStore();

  const getRoomStatus = (roomId: string) => {
    const now = new Date();
    const currentApp = applications.find(
      (a) =>
        a.roomId === roomId &&
        a.status !== 'rejected' &&
        new Date(a.startTime) <= now &&
        new Date(a.endTime) >= now
    );
    if (currentApp) {
      return { status: '使用中', color: 'text-amber-600', bg: 'bg-amber-100', app: currentApp };
    }
    return { status: '空闲', color: 'text-emerald-600', bg: 'bg-emerald-100', app: null };
  };

  const getEscortStatus = (escortId: string) => {
    const now = new Date();
    const currentApp = applications.find(
      (a) =>
        a.escorts.includes(escortId) &&
        a.status !== 'rejected' &&
        new Date(a.startTime) <= now &&
        new Date(a.endTime) >= now
    );
    if (currentApp) {
      return { status: '值班中', color: 'text-amber-600', bg: 'bg-amber-100' };
    }
    return { status: '空闲', color: 'text-emerald-600', bg: 'bg-emerald-100' };
  };

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const approvedCount = applications.filter((a) => a.status === 'approved').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-teal-100 p-2 rounded-lg">
            <Monitor className="w-5 h-5 text-teal-600" />
          </div>
          <h3 className="font-semibold text-gray-800">机房状态</h3>
        </div>
        <div className="space-y-3">
          {rooms.map((room) => {
            const roomStatus = getRoomStatus(room.id);
            return (
              <div
                key={room.id}
                className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800 text-sm">
                      {room.name}
                    </div>
                    <div className="text-xs text-gray-500">{room.type}</div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${roomStatus.bg} ${roomStatus.color}`}
                  >
                    {room.status === 'maintenance' ? '维护中' : roomStatus.status}
                  </span>
                </div>
                {roomStatus.app && (
                  <div className="mt-2 text-xs text-gray-500">
                    当前: {roomStatus.app.applicantName}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-800">陪同人员</h3>
        </div>
        <div className="space-y-2 max-h-[280px] overflow-y-auto">
          {escorts.map((escort) => {
            const escortStatus = getEscortStatus(escort.id);
            return (
              <div
                key={escort.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium">
                    {escort.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {escort.name}
                    </div>
                    <div className="text-xs text-gray-500">{escort.role}</div>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${escortStatus.bg} ${escortStatus.color}`}
                >
                  {escortStatus.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Radio className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-800">放射源类型</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {RADIATION_SOURCES.map((source) => (
              <div
                key={source.id}
                className="p-2 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div className="text-sm font-medium text-gray-800">
                  {source.name}
                </div>
                <div className="text-xs text-gray-500">{source.type}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800">今日统计</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 rounded-lg bg-amber-50">
              <div className="text-2xl font-bold text-amber-600">
                {pendingCount}
              </div>
              <div className="text-xs text-amber-700">待审批</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-emerald-50">
              <div className="text-2xl font-bold text-emerald-600">
                {approvedCount}
              </div>
              <div className="text-xs text-emerald-700">已通过</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-teal-50">
              <div className="text-2xl font-bold text-teal-600">
                {applications.length}
              </div>
              <div className="text-xs text-teal-700">总申请</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
