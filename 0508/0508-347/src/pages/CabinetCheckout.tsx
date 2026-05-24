import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  PackageOpen,
  Filter,
  RefreshCw,
  Save,
  CheckCircle2,
  Boxes,
  LayoutGrid,
  TrendingUp,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import CabinetGrid from '../components/CabinetGrid';
import SpecimenCard from '../components/SpecimenCard';
import StatusBadge from '../components/StatusBadge';
import DiffAlert from '../components/DiffAlert';
import type { Specimen, DiffRecord, Position, Seal } from '../../shared/types';
import { formatPosition, formatDate } from '../utils/format';

type ViewMode = 'cabinet' | 'batch';

interface BatchInfo {
  seal: Seal;
  specimens: Specimen[];
}

export default function CabinetCheckout() {
  const {
    specimens,
    cabinets,
    seals,
    diffs,
    selectedCabinetId,
    setSelectedCabinetId,
    updateSpecimenPosition,
  } = useAppStore();

  const [activeSpecimen, setActiveSpecimen] = useState<Specimen | null>(null);
  const [latestDiff, setLatestDiff] = useState<DiffRecord | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cabinet');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('seal-001');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const batches = useMemo<BatchInfo[]>(() => {
    return seals.map(seal => ({
      seal,
      specimens: specimens.filter(s => seal.specimenIds.includes(s.id)),
    }));
  }, [seals, specimens]);

  const selectedBatch = batches.find(b => b.seal.id === selectedBatchId);
  const selectedCabinet = cabinets.find((c) => c.id === selectedCabinetId);

  const cabinetSpecimens = specimens.filter((s) => s.originalCabinetId === selectedCabinetId);
  const batchSpecimens = selectedBatch?.specimens || [];

  const currentSpecimens = viewMode === 'cabinet' ? cabinetSpecimens : batchSpecimens;

  const pendingSpecimens = currentSpecimens.filter(
    (s) => s.status === 'returned' && !s.currentPosition
  );

  const placedSpecimens = currentSpecimens.filter(
    (s) => s.currentPosition || s.status === 'verified'
  );

  const historyDiffStats = useMemo(() => {
    const positionCounts: Record<string, { count: number; specimens: string[] }> = {};
    
    diffs.forEach(diff => {
      const key = `${diff.expectedPosition.row}-${diff.expectedPosition.col}`;
      if (!positionCounts[key]) {
        positionCounts[key] = { count: 0, specimens: [] };
      }
      positionCounts[key].count++;
      if (!positionCounts[key].specimens.includes(diff.specimenName)) {
        positionCounts[key].specimens.push(diff.specimenName);
      }
    });

    return Object.entries(positionCounts)
      .map(([position, data]) => ({
        position,
        ...data,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [diffs]);

  const recentDiffs = useMemo(() => {
    return [...diffs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
  }, [diffs]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveSpecimen(active.data.current as Specimen);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveSpecimen(null);

    if (!over) return;

    const specimen = active.data.current as Specimen;
    const overId = over.id.toString();

    if (overId.startsWith('slot-')) {
      const [, rowStr, colStr] = overId.split('-');
      const position: Position = {
        row: parseInt(rowStr),
        col: parseInt(colStr),
      };

      const diff = updateSpecimenPosition(specimen.id, position);
      if (diff) {
        setLatestDiff(diff);
      }
    }
  };

  const handleDiffDismiss = () => {
    setLatestDiff(null);
  };

  const handleDiffResolve = () => {
    setLatestDiff(null);
  };

  const handleDiffApprove = () => {
    if (latestDiff) {
      setLatestDiff(null);
    }
  };

  const stats = {
    total: currentSpecimens.length,
    placed: placedSpecimens.length,
    verified: currentSpecimens.filter((s) => s.status === 'verified').length,
    pending: pendingSpecimens.length,
  };

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-museum-100 rounded-xl">
              <PackageOpen className="w-6 h-6 text-museum-600" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-museum-900">
                柜位核对台
              </h2>
              <p className="text-museum-500 text-sm">
                拖拽标本到对应位置，系统自动检测与原柜布局的一致性
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-museum-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('cabinet')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  viewMode === 'cabinet'
                    ? 'bg-white shadow text-museum-900'
                    : 'text-museum-600 hover:text-museum-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                按展柜
              </button>
              <button
                onClick={() => setViewMode('batch')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  viewMode === 'batch'
                    ? 'bg-white shadow text-museum-900'
                    : 'text-museum-600 hover:text-museum-900'
                }`}
              >
                <Boxes className="w-4 h-4" />
                按批次
              </button>
            </div>

            {viewMode === 'cabinet' ? (
              <select
                value={selectedCabinetId}
                onChange={(e) => setSelectedCabinetId(e.target.value)}
                className="input-field w-48"
              >
                {cabinets.map((cabinet) => (
                  <option key={cabinet.id} value={cabinet.id}>
                    {cabinet.name}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="input-field w-56"
              >
                {batches.map((batch) => (
                  <option key={batch.seal.id} value={batch.seal.id}>
                    {batch.seal.boxCode} - {batch.seal.destination}
                  </option>
                ))}
              </select>
            )}

            <button className="btn-secondary flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>

            <button className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              保存布局
            </button>
          </div>
        </div>

        {viewMode === 'batch' && selectedBatch && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-blue-600">运输箱编号</p>
                  <p className="font-semibold text-blue-900">{selectedBatch.seal.boxCode}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600">封签号</p>
                  <p className="font-mono font-semibold text-blue-900">{selectedBatch.seal.sealCode}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600">目的地</p>
                  <p className="font-semibold text-blue-900">{selectedBatch.seal.destination}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600">解封时间</p>
                  <p className="font-semibold text-blue-900">{selectedBatch.seal.unsealedAt ? formatDate(selectedBatch.seal.unsealedAt) : '-'}</p>
                </div>
              </div>
              <StatusBadge type="seal" status={selectedBatch.seal.status} />
            </div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-4 gap-4">
          <div className="p-4 bg-museum-50 rounded-lg">
            <p className="text-sm text-museum-500">标本总数</p>
            <p className="text-2xl font-bold text-museum-900">{stats.total}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-600">待放置</p>
            <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600">已放置</p>
            <p className="text-2xl font-bold text-blue-700">{stats.placed}</p>
          </div>
          <div className="p-4 bg-forest-50 rounded-lg">
            <p className="text-sm text-forest-600">已核对</p>
            <p className="text-2xl font-bold text-forest-700">{stats.verified}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="grid grid-cols-4 gap-6">
            <div className="col-span-1">
              <div className="card p-5 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-museum-900">待放置标本</h3>
                  <button className="p-1.5 hover:bg-museum-100 rounded-lg transition-colors">
                    <Filter className="w-4 h-4 text-museum-500" />
                  </button>
                </div>

                {pendingSpecimens.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-forest-400 mx-auto mb-3" />
                    <p className="text-museum-600">所有标本已放置</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin pr-1">
                    {pendingSpecimens.map((specimen) => (
                      <SpecimenCard key={specimen.id} specimen={specimen} />
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-museum-100">
                  <p className="text-xs text-museum-500 mb-2">操作提示</p>
                  <ul className="text-xs text-museum-600 space-y-1">
                    <li>• 拖拽标本卡片到右侧柜位</li>
                    <li>• 虚线框表示该位置的期望标本</li>
                    <li>• 放置位置错误会自动提示差异</li>
                    <li>• 绿色边框表示位置正确</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-span-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                {selectedCabinet && (
                  <CabinetGrid cabinet={selectedCabinet} specimens={placedSpecimens} />
                )}

                <DragOverlay>
                  {activeSpecimen ? (
                    <div className="w-56 opacity-90">
                      <SpecimenCard specimen={activeSpecimen} isDragging />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>

              {selectedCabinet && (
                <div className="card p-5 mt-6">
                  <h3 className="font-semibold text-museum-900 mb-4">验收记录</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-museum-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-museum-600">
                            标本名称
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-museum-600">
                            编号
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-museum-600">
                            原位置
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-museum-600">
                            当前位置
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-museum-600">
                            状态
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentSpecimens.map((specimen) => (
                          <tr
                            key={specimen.id}
                            className="border-b border-museum-100 hover:bg-museum-50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <p className="font-medium text-museum-900">
                                {specimen.name}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-museum-600 text-sm">
                              {specimen.code}
                            </td>
                            <td className="py-3 px-4 text-museum-600 text-sm">
                              {formatPosition(specimen.originalPosition)}
                            </td>
                            <td className="py-3 px-4">
                              {specimen.currentPosition ? (
                                <span
                                  className={`text-sm font-medium ${
                                    specimen.status === 'verified'
                                      ? 'text-forest-600'
                                      : 'text-amber-600'
                                  }`}
                                >
                                  {formatPosition(specimen.currentPosition)}
                                </span>
                              ) : (
                                <span className="text-museum-400 text-sm">未放置</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <StatusBadge type="specimen" status={specimen.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-6">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-museum-900">常放错柜位</h3>
                <p className="text-xs text-museum-500">历史高频放错位置 TOP 5</p>
              </div>
            </div>

            {historyDiffStats.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-10 h-10 text-forest-400 mx-auto mb-2" />
                <p className="text-sm text-museum-500">暂无历史放错记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyDiffStats.map((item, index) => (
                  <div
                    key={item.position}
                    className="p-3 bg-red-50 rounded-lg border border-red-100"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-red-700">
                        位置 {item.position}
                      </span>
                      <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                        {item.count} 次
                      </span>
                    </div>
                    <p className="text-xs text-red-600">
                      涉及标本：{item.specimens.join('、')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-museum-900">最近差异记录</h3>
                <p className="text-xs text-museum-500">近两次回库产生的差异</p>
              </div>
            </div>

            {recentDiffs.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-10 h-10 text-forest-400 mx-auto mb-2" />
                <p className="text-sm text-museum-500">暂无差异记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDiffs.map((diff) => (
                  <div
                    key={diff.id}
                    className="p-3 bg-amber-50 rounded-lg border border-amber-100"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-medium text-amber-900 text-sm truncate">
                        {diff.specimenName}
                      </span>
                      <StatusBadge type="diff" status={diff.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-forest-600 bg-forest-100 px-1.5 py-0.5 rounded">
                        期望：{formatPosition(diff.expectedPosition)}
                      </span>
                      <span className="text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                        实际：{formatPosition(diff.actualPosition)}
                      </span>
                    </div>
                    <p className="text-xs text-museum-400 mt-1">
                      {formatDate(diff.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5 bg-gradient-to-br from-museum-50 to-blue-50">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-museum-600" />
              <h3 className="font-semibold text-museum-900">核对要点</h3>
            </div>
            <ul className="text-xs text-museum-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-museum-400 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>优先核对常放错位置的标本，注意历史问题</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-museum-400 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>同一批次标本注意运输箱号，避免混放</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-museum-400 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>位置差异需记录原因并经主管批准</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-museum-400 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>全部核对完成后点击「保存布局」生成新版本</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <DiffAlert
        diff={latestDiff}
        onDismiss={handleDiffDismiss}
        onResolve={handleDiffResolve}
        onApprove={handleDiffApprove}
      />
    </div>
  );
}
