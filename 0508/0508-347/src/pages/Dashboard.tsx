import { Link } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  PackageOpen,
  Archive,
  FileCheck,
  Grid3X3,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import StatusBadge from '../components/StatusBadge';
import { formatShortDate } from '../utils/format';

const workflowStages = [
  {
    id: 'checkout',
    name: '标本借出',
    description: '登记借出标本信息',
    icon: PackageOpen,
    color: 'bg-museum-100 text-museum-700',
    activeColor: 'bg-museum-600 text-white',
  },
  {
    id: 'seal',
    name: '运输封签',
    description: '运输箱封签绑定',
    icon: Archive,
    color: 'bg-museum-100 text-museum-700',
    activeColor: 'bg-museum-600 text-white',
  },
  {
    id: 'acceptance',
    name: '返馆验收',
    description: '标本状态检查验收',
    icon: FileCheck,
    color: 'bg-museum-100 text-museum-700',
    activeColor: 'bg-museum-600 text-white',
  },
  {
    id: 'cabinet',
    name: '柜位回放',
    description: '原柜位置核对',
    icon: Grid3X3,
    color: 'bg-museum-100 text-museum-700',
    activeColor: 'bg-museum-600 text-white',
  },
];

export default function Dashboard() {
  const { specimens, seals, diffs, acceptances } = useAppStore();

  const stats = {
    totalLent: specimens.filter((s) => s.status === 'lent-out' || s.status === 'in-transit').length,
    returned: specimens.filter((s) => s.status === 'returned').length,
    verified: specimens.filter((s) => s.status === 'verified').length,
    pendingDiffs: diffs.filter((d) => d.status === 'pending').length,
  };

  const activeSeals = seals.filter((s) => s.status !== 'unsealed');
  const recentAcceptances = acceptances.slice(-5).reverse();

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-xl font-semibold text-museum-900">
              借展回库工作流
            </h2>
            <p className="text-museum-500 text-sm mt-1">
              当前处于：返馆验收与柜位回放阶段
            </p>
          </div>
          <Link
            to="/cabinet"
            className="btn-primary flex items-center gap-2"
          >
            开始核对
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex items-center justify-between">
          {workflowStages.map((stage, index) => (
            <div key={stage.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    index <= 2 ? stage.activeColor : stage.color
                  } transition-all duration-300`}
                >
                  <stage.icon className="w-6 h-6" />
                </div>
                <p className="mt-2 font-medium text-sm text-museum-900">{stage.name}</p>
                <p className="text-xs text-museum-500">{stage.description}</p>
              </div>
              {index < workflowStages.length - 1 && (
                <div className="mx-4">
                  {index < 2 ? (
                    <div className="w-20 h-1 bg-museum-600 rounded-full"></div>
                  ) : (
                    <div className="w-20 h-1 bg-museum-200 rounded-full"></div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-museum-500 text-sm">待回库标本</p>
              <p className="text-3xl font-bold text-museum-900 mt-1">
                {stats.returned}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="card p-5 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-museum-500 text-sm">已核对完成</p>
              <p className="text-3xl font-bold text-museum-900 mt-1">
                {stats.verified}
              </p>
            </div>
            <div className="p-3 bg-forest-100 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-forest-600" />
            </div>
          </div>
        </div>

        <div className="card p-5 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-museum-500 text-sm">运输中</p>
              <p className="text-3xl font-bold text-museum-900 mt-1">
                {stats.totalLent}
              </p>
            </div>
            <div className="p-3 bg-museum-100 rounded-xl">
              <Package className="w-6 h-6 text-museum-600" />
            </div>
          </div>
        </div>

        <div className="card p-5 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-museum-500 text-sm">待处理差异</p>
              <p className="text-3xl font-bold text-museum-900 mt-1">
                {stats.pendingDiffs}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-museum-900">运输箱状态</h3>
            <Link
              to="/seal"
              className="text-sm text-museum-600 hover:text-museum-800 flex items-center gap-1"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {seals.slice(0, 3).map((seal) => (
              <div
                key={seal.id}
                className="flex items-center justify-between p-3 bg-museum-50 rounded-lg hover:bg-museum-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Archive className="w-5 h-5 text-museum-600" />
                  </div>
                  <div>
                    <p className="font-medium text-museum-900">{seal.boxCode}</p>
                    <p className="text-xs text-museum-500">
                      {seal.specimenIds.length} 件标本
                    </p>
                  </div>
                </div>
                <StatusBadge type="seal" status={seal.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-museum-900">最近验收记录</h3>
            <Link
              to="/acceptance"
              className="text-sm text-museum-600 hover:text-museum-800 flex items-center gap-1"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentAcceptances.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 bg-museum-50 rounded-lg hover:bg-museum-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-museum-900">
                    {record.specimenName}
                  </p>
                  <p className="text-xs text-museum-500">
                    {record.specimenCode} · {formatShortDate(record.acceptedAt)}
                  </p>
                </div>
                <StatusBadge type="condition" status={record.condition} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-museum-900">快捷操作</h3>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <Link
            to="/checkout"
            className="flex flex-col items-center p-4 bg-museum-50 rounded-xl hover:bg-museum-100 transition-colors group"
          >
            <div className="w-12 h-12 bg-museum-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <PackageOpen className="w-6 h-6 text-white" />
            </div>
            <p className="font-medium text-museum-900">标本借出登记</p>
            <p className="text-xs text-museum-500 mt-1">新建借出记录</p>
          </Link>
          <Link
            to="/seal"
            className="flex flex-col items-center p-4 bg-museum-50 rounded-xl hover:bg-museum-100 transition-colors group"
          >
            <div className="w-12 h-12 bg-museum-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Archive className="w-6 h-6 text-white" />
            </div>
            <p className="font-medium text-museum-900">运输封签管理</p>
            <p className="text-xs text-museum-500 mt-1">查看封签状态</p>
          </Link>
          <Link
            to="/acceptance"
            className="flex flex-col items-center p-4 bg-museum-50 rounded-xl hover:bg-museum-100 transition-colors group"
          >
            <div className="w-12 h-12 bg-forest-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <p className="font-medium text-museum-900">返馆验收</p>
            <p className="text-xs text-museum-500 mt-1">标本状态检查</p>
          </Link>
          <Link
            to="/cabinet"
            className="flex flex-col items-center p-4 bg-museum-50 rounded-xl hover:bg-museum-100 transition-colors group"
          >
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Grid3X3 className="w-6 h-6 text-white" />
            </div>
            <p className="font-medium text-museum-900">柜位核对台</p>
            <p className="text-xs text-museum-500 mt-1">标本回放核对</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
