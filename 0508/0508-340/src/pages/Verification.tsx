import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle, XCircle, Clock, AlertCircle, User, Calendar, FileText, Download } from 'lucide-react';
import { buoyApi, verificationApi, exportApi } from '../services/api';
import type { Buoy, DataGap, GapStatus } from '../../shared/types';

const statusConfig: Record<GapStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  open: { label: '待补传', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: AlertCircle },
  backfilled: { label: '待核验', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Clock },
  verified: { label: '已确认', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: CheckCircle },
  rejected: { label: '已驳回', color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle },
};

export const Verification: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [buoy, setBuoy] = useState<Buoy | null>(null);
  const [gaps, setGaps] = useState<DataGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGap, setSelectedGap] = useState<string | null>(null);
  const [verifyComment, setVerifyComment] = useState('');
  const [backfillFile, setBackfillFile] = useState<File | null>(null);
  const [processingGap, setProcessingGap] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [buoyData, gapsData] = await Promise.all([
          buoyApi.getById(id),
          buoyApi.getGaps(id),
        ]);
        setBuoy(buoyData);
        setGaps(gapsData);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}天${hours % 24}小时`;
    }
    if (hours > 0) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟`;
  };

  const handleUploadBackfill = async (gapId: string) => {
    if (!backfillFile || !id) return;
    
    setProcessingGap(gapId);
    try {
      await buoyApi.uploadBackfill(id, gapId, backfillFile, '值班员');
      const gapsData = await buoyApi.getGaps(id);
      setGaps(gapsData);
      setBackfillFile(null);
      setSelectedGap(null);
    } catch (error) {
      console.error('上传补传数据失败:', error);
    } finally {
      setProcessingGap(null);
    }
  };

  const handleVerify = async (gapId: string, result: 'confirmed' | 'rejected') => {
    if (!id) return;
    
    setProcessingGap(gapId);
    try {
      if (result === 'confirmed') {
        await verificationApi.confirm(gapId, '值班员', verifyComment);
      } else {
        await verificationApi.reject(gapId, '值班员', verifyComment);
      }
      const gapsData = await buoyApi.getGaps(id);
      setGaps(gapsData);
      setVerifyComment('');
      setSelectedGap(null);
    } catch (error) {
      console.error('核验失败:', error);
    } finally {
      setProcessingGap(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  if (!buoy) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">浮标不存在</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-cyan-600 hover:text-cyan-700"
        >
          返回任务列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/buoy/${id}`)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">补传核验 - {buoy.name}</h1>
            <p className="text-sm text-slate-500">{buoy.code} · {buoy.seaArea}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/buoy/${id}`}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <FileText className="w-4 h-4" />
            查看轨迹
          </Link>
          <button
            onClick={() => exportApi.exportSummary(id!, 'csv', '值班员')}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出核验摘要
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = gaps.filter(g => g.status === status).length;
          const Icon = config.icon;
          
          return (
            <div key={status} className={`p-4 rounded-xl ${config.bgColor} border border-slate-200`}>
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

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">数据缺口列表</h3>
        </div>
        
        <div className="divide-y divide-slate-100">
          {gaps.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">
              暂无数据缺口
            </div>
          ) : (
            gaps.map((gap) => {
              const config = statusConfig[gap.status];
              const StatusIcon = config.icon;
              const isExpanded = selectedGap === gap.id;
              
              return (
                <div key={gap.id} className="transition-colors">
                  <div
                    className="px-6 py-4 cursor-pointer hover:bg-slate-50"
                    onClick={() => setSelectedGap(isExpanded ? null : gap.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${config.bgColor}`}>
                          <StatusIcon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800">
                              {new Date(gap.startTime).toLocaleString('zh-CN')}
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="font-medium text-slate-800">
                              {new Date(gap.endTime).toLocaleString('zh-CN')}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              断档 {formatDuration(gap.durationSeconds)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="px-6 pb-6 bg-slate-50">
                      <div className="pt-4 border-t border-slate-200 space-y-4">
                        {gap.backfillData && (
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-slate-500">补传数据：</span>
                            <span className="text-slate-700">
                              {gap.backfillData.pointCount} 个数据点
                            </span>
                            <span className="text-slate-400">|</span>
                            <span className="text-slate-500 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {gap.backfillData.uploadedBy}
                            </span>
                            <span className="text-slate-400">|</span>
                            <span className="text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(gap.backfillData.uploadedAt).toLocaleString('zh-CN')}
                            </span>
                          </div>
                        )}
                        
                        {gap.verification && (
                          <div className="p-4 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`font-medium ${gap.verification.result === 'confirmed' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {gap.verification.result === 'confirmed' ? '核验通过' : '核验驳回'}
                              </span>
                              <span className="text-sm text-slate-400">
                                {gap.verification.verifiedBy} · {new Date(gap.verification.verifiedAt).toLocaleString('zh-CN')}
                              </span>
                            </div>
                            {gap.verification.comment && (
                              <p className="text-sm text-slate-600">备注：{gap.verification.comment}</p>
                            )}
                          </div>
                        )}

                        {gap.status === 'open' && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-4">
                              <input
                                type="file"
                                accept=".json,.csv"
                                onChange={(e) => setBackfillFile(e.target.files?.[0] || null)}
                                className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                              />
                              {backfillFile && (
                                <span className="text-sm text-slate-600">{backfillFile.name}</span>
                              )}
                            </div>
                            <button
                              onClick={() => handleUploadBackfill(gap.id)}
                              disabled={!backfillFile || processingGap === gap.id}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Upload className="w-4 h-4" />
                              {processingGap === gap.id ? '上传中...' : '上传补传数据'}
                            </button>
                          </div>
                        )}

                        {gap.status === 'backfilled' && (
                          <div className="space-y-3">
                            <textarea
                              value={verifyComment}
                              onChange={(e) => setVerifyComment(e.target.value)}
                              placeholder="输入核验意见（可选）..."
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                              rows={2}
                            />
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleVerify(gap.id, 'confirmed')}
                                disabled={processingGap === gap.id}
                                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                              >
                                <CheckCircle className="w-4 h-4" />
                                确认通过
                              </button>
                              <button
                                onClick={() => handleVerify(gap.id, 'rejected')}
                                disabled={processingGap === gap.id}
                                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                <XCircle className="w-4 h-4" />
                                驳回
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">核验说明</h3>
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-amber-50 rounded">
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <span className="font-medium text-slate-700">待补传</span>
            </div>
            <p className="text-slate-500">系统检测到数据断档，需要上传补传数据填补缺口</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-50 rounded">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-medium text-slate-700">待核验</span>
            </div>
            <p className="text-slate-500">补传数据已上传，等待值班人员人工核验确认</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-50 rounded">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="font-medium text-slate-700">已确认</span>
            </div>
            <p className="text-slate-500">补传数据核验通过，数据已并入正式数据集</p>
          </div>
        </div>
      </div>
    </div>
  );
};
