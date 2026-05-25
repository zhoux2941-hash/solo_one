import React from 'react';
import { Users, User, Phone, Sun, Moon, Clock } from 'lucide-react';
import { useScheduleStore } from '../store/useScheduleStore';
import { cn } from '../lib/utils';

export const Teams: React.FC = () => {
  const { teams, schedules } = useScheduleStore();

  const getTeamSchedules = (teamId: string) => {
    return schedules.filter(s => s.teamId === teamId);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Users className="text-blue-600" size={24} />
          <div>
            <h1 className="text-xl font-bold text-gray-800">班组管理</h1>
            <p className="text-sm text-gray-500">检修班组人员配置和排班管理</p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-2 gap-6">
          {teams.map(team => (
            <div key={team.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className={cn(
                'p-4 border-b',
                team.shift === 'day' ? 'bg-amber-50' : 'bg-indigo-50'
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      team.shift === 'day' ? 'bg-amber-100' : 'bg-indigo-100'
                    )}>
                      <Users className={team.shift === 'day' ? 'text-amber-600' : 'text-indigo-600'} size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{team.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        {team.shift === 'day' ? (
                          <>
                            <Sun size={14} />
                            <span>白班</span>
                          </>
                        ) : (
                          <>
                            <Moon size={14} />
                            <span>夜班</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">{team.members.length}</div>
                    <div className="text-xs text-gray-500">成员数</div>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">班组长</h4>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                      {team.leader.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{team.leader}</p>
                      <p className="text-xs text-gray-500">工班长</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">班组成员</h4>
                  <div className="space-y-2">
                    {team.members.map((member, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium">
                          {member.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-700">{member}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t bg-gray-50">
                <h4 className="text-sm font-medium text-gray-500 mb-2">今日任务</h4>
                <div className="space-y-2">
                  {getTeamSchedules(team.id).slice(0, 3).map(schedule => (
                    <div key={schedule.id} className="flex items-center gap-2 text-sm">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-gray-700 truncate">{schedule.title}</span>
                    </div>
                  ))}
                  {getTeamSchedules(team.id).length === 0 && (
                    <p className="text-sm text-gray-400">今日暂无任务</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
