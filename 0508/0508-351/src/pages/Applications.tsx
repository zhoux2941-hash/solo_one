import React, { useState } from 'react';
import { FileText, Plus, Search, Filter, Wrench, Recycle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useScheduleStore } from '../store/useScheduleStore';
import { format } from 'date-fns';
import { ScheduleType } from '../types';
import { cn } from '../lib/utils';

type ApplicationType = 'sensor-replace' | 'recovery';

interface Application {
  id: string;
  type: ApplicationType;
  title: string;
  workpoint: string;
  applicant: string;
  applyTime: Date;
  status: 'pending' | 'approved' | 'rejected';
  description: string;
}

const mockApplications: Application[] = [
  {
    id: 'app1',
    type: 'sensor-replace',
    title: 'A站温度传感器更换',
    workpoint: 'A站',
    applicant: '张工',
    applyTime: new Date(),
    status: 'approved',
    description: '传感器老化，读数不准确，需要更换'
  },
  {
    id: 'app2',
    type: 'recovery',
    title: 'C站旧件回收申请',
    workpoint: 'C站',
    applicant: '李工',
    applyTime: new Date(),
    status: 'pending',
    description: '更换下来的3个传感器需要回收入库'
  },
  {
    id: 'app3',
    type: 'sensor-replace',
    title: 'B站速度传感器更换',
    workpoint: 'B站',
    applicant: '王工',
    applyTime: new Date(Date.now() - 86400000),
    status: 'pending',
    description: '传感器故障，影响列车测速精度'
  }
];

export const Applications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>(mockApplications);
  const [filterType, setFilterType] = useState<'all' | ApplicationType>('all');
  const [showModal, setShowModal] = useState(false);
  const [newApp, setNewApp] = useState({
    type: 'sensor-replace' as ApplicationType,
    title: '',
    workpoint: '',
    description: ''
  });

  const filteredApps = applications.filter(
    app => filterType === 'all' || app.type === filterType
  );

  const handleSubmit = () => {
    if (newApp.title && newApp.workpoint) {
      const app: Application = {
        id: `app${Date.now()}`,
        type: newApp.type,
        title: newApp.title,
        workpoint: newApp.workpoint,
        applicant: '调度员',
        applyTime: new Date(),
        status: 'pending',
        description: newApp.description
      };
      setApplications([app, ...applications]);
      setShowModal(false);
      setNewApp({ type: 'sensor-replace', title: '', workpoint: '', description: '' });
    }
  };

  const statusConfig = {
    pending: { label: '待审批', color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={12} /> },
    approved: { label: '已通过', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} /> },
    rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700', icon: <XCircle size={12} /> }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="text-blue-600" size={24} />
            <div>
              <h1 className="text-xl font-bold text-gray-800">申请管理</h1>
              <p className="text-sm text-gray-500">传感器更换申请和旧件回收申请</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            新建申请
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部类型</option>
                  <option value="sensor-replace">传感器更换</option>
                  <option value="recovery">旧件回收</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder="搜索申请..."
                className="border rounded px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="divide-y">
            {filteredApps.map(app => (
              <div key={app.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      app.type === 'sensor-replace' ? 'bg-blue-100' : 'bg-purple-100'
                    )}>
                      {app.type === 'sensor-replace' ? (
                        <Wrench size={18} className="text-blue-600" />
                      ) : (
                        <Recycle size={18} className="text-purple-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{app.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>工点：{app.workpoint}</span>
                        <span>申请人：{app.applicant}</span>
                        <span>申请时间：{format(app.applyTime, 'MM-dd HH:mm')}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{app.description}</p>
                    </div>
                  </div>
                  <span className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                    statusConfig[app.status].color
                  )}>
                    {statusConfig[app.status].icon}
                    {statusConfig[app.status].label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px] shadow-xl">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">新建申请</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">申请类型</label>
                <select
                  value={newApp.type}
                  onChange={(e) => setNewApp({ ...newApp, type: e.target.value as ApplicationType })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sensor-replace">传感器更换申请</option>
                  <option value="recovery">旧件回收申请</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">申请标题</label>
                <input
                  type="text"
                  value={newApp.title}
                  onChange={(e) => setNewApp({ ...newApp, title: e.target.value })}
                  placeholder="请输入申请标题"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">工点</label>
                <input
                  type="text"
                  value={newApp.workpoint}
                  onChange={(e) => setNewApp({ ...newApp, workpoint: e.target.value })}
                  placeholder="请选择工点"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">申请说明</label>
                <textarea
                  value={newApp.description}
                  onChange={(e) => setNewApp({ ...newApp, description: e.target.value })}
                  placeholder="请详细说明申请原因"
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
