import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, Popup, CircleMarker } from 'react-leaflet';
import { ArrowLeft, Navigation, Target, TrendingUp, FileText, Download, Calendar, MapPin as MapPinIcon, List } from 'lucide-react';
import { buoyApi, exportApi, taskApi } from '../services/api';
import type { Buoy, TrackPoint, CorrectionTask } from '../../shared/types';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export const BuoyTrack: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [buoy, setBuoy] = useState<Buoy | null>(null);
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
  const [driftStats, setDriftStats] = useState({ maxDrift: 0, avgDrift: 0, totalCorrections: 0 });
  const [loading, setLoading] = useState(true);
  const [showOriginal, setShowOriginal] = useState(true);
  const [showCorrected, setShowCorrected] = useState(true);
  const [sameAreaBuoys, setSameAreaBuoys] = useState<CorrectionTask[]>([]);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [trackData, statsData] = await Promise.all([
          buoyApi.getTrack(id),
          buoyApi.getDriftStatistics(id),
        ]);
        setBuoy(trackData.buoy);
        setTrackPoints(trackData.trackPoints);
        setDriftStats(statsData);

        const seaAreaTasks = await taskApi.getTasks('completed', undefined, trackData.buoy.seaArea);
        setSameAreaBuoys(seaAreaTasks.filter(t => t.buoyId !== id));
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

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

  const originalPath = trackPoints.map(p => [p.originalLat, p.originalLng] as [number, number]);
  const correctedPath = trackPoints
    .filter(p => p.correctedLat !== undefined && p.correctedLng !== undefined)
    .map(p => [p.correctedLat!, p.correctedLng!] as [number, number]);
  
  const center: [number, number] = trackPoints.length > 0
    ? [trackPoints[0].originalLat, trackPoints[0].originalLng]
    : [buoy.anchorLat, buoy.anchorLng];

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{buoy.name}</h1>
            <p className="text-sm text-slate-500">
              {buoy.code} · {buoy.seaArea}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/buoy/${id}/verification`}
            className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
          >
            <FileText className="w-4 h-4" />
            补传核验
          </Link>
          <button
            onClick={() => exportApi.exportSummary(id!, 'csv', '值班员')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出摘要
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-cyan-50 rounded-lg">
              <Navigation className="w-5 h-5 text-cyan-600" />
            </div>
            <span className="text-sm text-slate-500">最大漂移</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{driftStats.maxDrift}m</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-teal-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <span className="text-sm text-slate-500">平均漂移</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{driftStats.avgDrift}m</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Target className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm text-slate-500">校正点数</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{driftStats.totalCorrections}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <MapPinIcon className="w-5 h-5 text-slate-600" />
            </div>
            <span className="text-sm text-slate-500">数据点总数</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{trackPoints.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">轨迹地图</h3>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showOriginal}
                  onChange={(e) => setShowOriginal(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <span className="text-amber-600">原始轨迹</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showCorrected}
                  onChange={(e) => setShowCorrected(e.target.checked)}
                  className="rounded text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-cyan-600">校正后轨迹</span>
              </label>
            </div>
          </div>
          
          <div className="h-96">
            <MapContainer
              center={center}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <Marker position={[buoy.anchorLat, buoy.anchorLng]}>
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold">锚点位置</p>
                    <p className="text-xs text-slate-500">{buoy.anchorLat.toFixed(4)}, {buoy.anchorLng.toFixed(4)}</p>
                  </div>
                </Popup>
              </Marker>
              
              {showOriginal && originalPath.length > 1 && (
                <Polyline
                  positions={originalPath}
                  color="#f59e0b"
                  weight={3}
                  opacity={0.7}
                  dashArray="10, 10"
                />
              )}
              
              {showCorrected && correctedPath.length > 1 && (
                <Polyline
                  positions={correctedPath}
                  color="#06b6d4"
                  weight={3}
                  opacity={0.9}
                />
              )}
              
              {showCorrected && correctedPath.length > 0 && (
                <CircleMarker
                  center={correctedPath[correctedPath.length - 1]}
                  radius={6}
                  fillColor="#06b6d4"
                  color="#fff"
                  weight={2}
                  fillOpacity={1}
                >
                  <Popup>当前位置</Popup>
                </CircleMarker>
              )}
            </MapContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">浮标信息</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">浮标编号</span>
                <span className="font-mono text-slate-700">{buoy.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">所属海域</span>
                <span className="text-slate-700">{buoy.seaArea}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">锚点位置</span>
                <span className="font-mono text-sm text-slate-700">
                  {buoy.anchorLat.toFixed(4)}, {buoy.anchorLng.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">布放日期</span>
                <span className="text-slate-700 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(buoy.deployDate).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">运行状态</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  buoy.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                  buoy.status === 'drifting' ? 'bg-amber-50 text-amber-600' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {buoy.status === 'active' ? '正常运行' :
                   buoy.status === 'drifting' ? '漂移中' : '已停用'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">图例</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-amber-500" />
                <span className="text-sm text-slate-600">原始轨迹（虚线）</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-cyan-500" />
                <span className="text-sm text-slate-600">校正后轨迹（实线）</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow" />
                <span className="text-sm text-slate-600">锚点位置</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-cyan-500 border-2 border-white shadow" />
                <span className="text-sm text-slate-600">当前位置</span>
              </div>
            </div>
          </div>

          {sameAreaBuoys.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">同海域浮标</h3>
                <List className="w-4 h-4 text-slate-400" />
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sameAreaBuoys.slice(0, 10).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => navigate(`/buoy/${task.buoyId}`)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {task.buoyName}
                        </p>
                        <p className="text-xs text-slate-400">{task.buoyCode}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-cyan-600 font-medium">
                          {task.driftDistance?.toFixed(0)}m
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">漂移趋势</h3>
        </div>
        <div className="p-6">
          <div className="h-48 flex items-end gap-1">
            {trackPoints.slice(0, 50).map((point, idx) => {
              const drift = Math.sqrt(
                Math.pow((point.correctedLat || point.originalLat) - buoy.anchorLat, 2) +
                Math.pow((point.correctedLng || point.originalLng) - buoy.anchorLng, 2)
              ) * 111000;
              const height = Math.min(100, (drift / Math.max(driftStats.maxDrift, 1)) * 100);
              
              return (
                <div
                  key={point.id}
                  className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-300 rounded-t transition-all hover:from-cyan-600 hover:to-cyan-400"
                  style={{ height: `${height}%` }}
                  title={`${new Date(point.timestamp).toLocaleString()}\n漂移: ${drift.toFixed(1)}m`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>开始</span>
            <span>时间</span>
            <span>当前</span>
          </div>
        </div>
      </div>
    </div>
  );
};
