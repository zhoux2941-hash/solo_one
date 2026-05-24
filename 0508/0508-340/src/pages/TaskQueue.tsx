import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Play, Clock, CheckCircle, XCircle, Loader2, RefreshCw, MapPin, FileText, Download } from 'lucide-react';
import { taskApi, buoyApi, exportApi } from '../services/api';
import type { CorrectionTask, TaskStatus, SeaArea } from '../../shared/types';

const statusConfig: Record<TaskStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  pending: { label: '待处理', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Clock },
  processing: { label: '处理中', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Loader2 },
  completed: { label: '已完成', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: CheckCircle },
  failed: { label: '失败', color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle },
};

export const TaskQueue: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<CorrectionTask[]>([]);
  const [seaAreas, setSeaAreas] = useState<SeaArea[]>([]);
  const [stats, setStats] = useState({ pending: 0, processing: 0, completed: 0, failed: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedSeaArea, setSelectedSeaArea] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | ''>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mockBuoyCode, setMockBuoyCode] = useState('');
  const [selectedBuoyCodes, setSelectedBuoyCodes] = useState<string[]>([]);
  const [showBatchExport, setShowBatchExport] = useState(false);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [tasksData, statsData, seaAreasData] = await Promise.all([
        taskApi.getTasks(selectedStatus || undefined, undefined, selectedSeaArea || undefined),
        taskApi.getTaskStats(),
        buoyApi.getSeaAreas(),
      ]);
      setTasks(tasksData);
      setStats(statsData);
      setSeaAreas(seaAreasData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedStatus, selectedSeaArea]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const filteredTasks = tasks;

  const toggleBuoySelection = (buoyCode: string) => {
    setSelectedBuoyCodes((prev) =>
      prev.includes(buoyCode)
        ? prev.filter((code) => code !== buoyCode)
        : [...prev, buoyCode]
    );
  };

  const selectAllBuoys = () => {
    const completedBuoyCodes = tasks
      .filter((t) => t.status === 'completed')
      .map((t) => t.buoyCode);
    setSelectedBuoyCodes(completedBuoyCodes);
  };

  const clearSelection = () => {
    setSelectedBuoyCodes([]);
  };

  const handleBatchExport = (format: 'json' | 'csv') => {
    if (selectedBuoyCodes.length === 0) return;
    exportApi.exportBatchSummary(selectedBuoyCodes, format);
    setShowBatchExport(false);
    setSelectedBuoyCodes([]);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    try {
      await taskApi.uploadTelemetry(Array.from(files));
      await loadData();
    } catch (error) {
      console.error('上传失败:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateMock = async () => {
    if (!mockBuoyCode) return;
    
    setIsUploading(true);
    try {
      await taskApi.createMockData(mockBuoyCode, 7);
      setMockBuoyCode('');
      await loadData();
    } catch (error) {
      console.error('创建模拟数据失败:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = stats[status as keyof typeof stats];
          const Icon = config.icon;
          
          return (
            <div
              key={status}
              className={`p-4 rounded-xl ${config.bgColor} border border-slate-200 cursor-pointer transition-transform hover:scale-105`}
              onClick={() => setSelectedStatus(selectedStatus === status ? '' : (status as TaskStatus))}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{count}</p>
                </div>
                <div className={`p-3 rounded-lg ${config.color.replace('text-', 'bg-').replace('600', '100')}`}>
                  <Icon className={`w-6 h-6 ${config.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div
          className={`col-span-2 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            isDragging
              ? 'border-cyan-500 bg-cyan-50'
              : 'border-slate-300 bg-white hover:border-cyan-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept=".json,.csv"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
            id="file-upload"
            disabled={isUploading}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                isDragging ? 'bg-cyan-100' : 'bg-slate-100'
              }`}>
                <Upload className={`w-8 h-8 ${isDragging ? 'text-cyan-600' : 'text-slate-400'}`} />
              </div>
              <p className="text-slate-700 font-medium mb-1">
                {isUploading ? '上传处理中...' : '拖拽遥测包到此处，或点击上传'}
              </p>
              <p className="text-sm text-slate-400">支持 JSON、CSV 格式，批量上传</p>
            </div>
          </label>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">快速创建模拟数据</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="输入浮标编号"
              value={mockBuoyCode}
              onChange={(e) => setMockBuoyCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleCreateMock}
              disabled={!mockBuoyCode || isUploading}
              className="w-full py-2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg font-medium hover:from-cyan-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              生成7天模拟数据
            </button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-2 font-medium">按海域筛选</p>
            <select
              value={selectedSeaArea}
              onChange={(e) => setSelectedSeaArea(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
            >
              <option value="">全部海域</option>
              {seaAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name} ({area.buoyCount}个浮标)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-slate-800">校正任务列表</h3>
            {selectedBuoyCodes.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">
                  已选择 {selectedBuoyCodes.length} 个浮标
                </span>
                <button
                  onClick={() => setShowBatchExport(!showBatchExport)}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg text-sm font-medium hover:from-cyan-700 hover:to-teal-700 transition-all flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  批量导出
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-sm"
                >
                  清除选择
                </button>
              </div>
            )}
            {showBatchExport && (
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => handleBatchExport('json')}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors"
                >
                  JSON格式
                </button>
                <button
                  onClick={() => handleBatchExport('csv')}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors"
                >
                  CSV格式
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAllBuoys}
              className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              title="选择所有已完成的任务"
            >
              全选已完成
            </button>
            <button
              onClick={loadData}
              disabled={isRefreshing}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-10">
                  <input
                    type="checkbox"
                    checked={selectedBuoyCodes.length > 0 && filteredTasks.filter(t => t.status === 'completed').every(t => selectedBuoyCodes.includes(t.buoyCode))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        selectAllBuoys();
                      } else {
                        clearSelection();
                      }
                    }}
                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  任务ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  浮标
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  海域
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  漂移估计
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  上传时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    暂无任务数据
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const config = statusConfig[task.status];
                  const StatusIcon = config.icon;
                  const isChecked = selectedBuoyCodes.includes(task.buoyCode);
                  
                  return (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleBuoySelection(task.buoyCode)}
                          disabled={task.status !== 'completed'}
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 disabled:opacity-40"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-slate-600">
                          {task.id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-cyan-600" />
                          <span className="font-medium text-slate-800">
                            {task.buoyName || '未知'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {task.buoyCode}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          {(task as any).seaArea || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                          {task.status === 'processing' && (
                            <span className="ml-1">{task.progress}%</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.driftDistance !== undefined ? (
                          <div className="text-sm">
                            <span className="text-slate-700">
                              {task.driftDistance.toFixed(1)}m
                            </span>
                            <span className="text-slate-400 ml-2">
                              置信度 {((task.confidence || 0) * 100).toFixed(0)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(task.uploadedAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/buoy/${task.buoyId}`)}
                            disabled={task.status !== 'completed'}
                            className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="查看轨迹"
                          >
                            <MapPin className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/buoy/${task.buoyId}/verification`)}
                            disabled={task.status !== 'completed'}
                            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="补传核验"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => exportApi.exportSummary(task.buoyId, 'csv')}
                            disabled={task.status !== 'completed'}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="导出摘要"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
