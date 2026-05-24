import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  GitCompare,
  ChevronDown,
  Plus,
  Trash2,
  Moon,
  Sun,
  Clock,
  User,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { DiffChartCanvas, DiffChartCanvasRef } from '../components/DiffChartCanvas';
import { useChartStore, VersionRecord } from '../store/useChartStore';
import { compareElements, computeDiffSummary, type ElementDiff, type ChangeType, changeTypeLabels, changeTypeColors } from '../utils/diffDetector';

const versionTypeIcons: Record<VersionRecord['type'], React.ReactNode> = {
  manual: <FileText size={14} />,
  nightly: <Moon size={14} />,
  auto: <Clock size={14} />,
};

const versionTypeColors: Record<VersionRecord['type'], string> = {
  manual: 'text-blue-400',
  nightly: 'text-purple-400',
  auto: 'text-green-400',
};

export const VersionCompare: React.FC = () => {
  const navigate = useNavigate();
  const { versions, mainRoutes, keyPoints, initDemoVersions } = useChartStore();

  const leftCanvasRef = useRef<DiffChartCanvasRef>(null);
  const rightCanvasRef = useRef<DiffChartCanvasRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [leftVersionId, setLeftVersionId] = useState<string | null>(null);
  const [rightVersionId, setRightVersionId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 });
  const [highlightedChangeType, setHighlightedChangeType] = useState<ChangeType | null>(null);
  const [selectedDiffId, setSelectedDiffId] = useState<string | null>(null);
  const [showLeftDropdown, setShowLeftDropdown] = useState(false);
  const [showRightDropdown, setShowRightDropdown] = useState(false);

  useEffect(() => {
    initDemoVersions();
  }, [initDemoVersions]);

  useEffect(() => {
    if (versions.length >= 2) {
      setLeftVersionId(versions[1]?.id || null);
      setRightVersionId(versions[0]?.id || null);
    } else if (versions.length === 1) {
      setRightVersionId(versions[0].id);
    }
  }, [versions.length]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: Math.floor(width / 2) - 4, height: height - 10 });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const leftVersion = useMemo(
    () => versions.find((v) => v.id === leftVersionId),
    [versions, leftVersionId]
  );

  const rightVersion = useMemo(
    () => versions.find((v) => v.id === rightVersionId),
    [versions, rightVersionId]
  );

  const diffs = useMemo(() => {
    if (!leftVersion || !rightVersion) return [];
    return compareElements(leftVersion.layerData, rightVersion.layerData);
  }, [leftVersion, rightVersion]);

  const diffSummary = useMemo(() => computeDiffSummary(diffs), [diffs]);

  const filteredDiffs = useMemo(() => {
    if (!highlightedChangeType) return diffs.filter((d) => d.type !== 'unchanged');
    return diffs.filter((d) => d.type === highlightedChangeType);
  }, [diffs, highlightedChangeType]);

  const handleDiffClick = useCallback(
    (diff: ElementDiff) => {
      setSelectedDiffId(diff.id);
      if (diff.type !== 'removed' && rightCanvasRef.current) {
        rightCanvasRef.current.focusOnElement(diff.id);
      }
      if (diff.type !== 'added' && leftCanvasRef.current) {
        leftCanvasRef.current.focusOnElement(diff.id);
      }
    },
    []
  );

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const changeTypeFilters: { type: ChangeType | null; label: string; count: number }[] = [
    { type: null, label: '全部', count: diffSummary.added + diffSummary.removed + diffSummary.modified },
    { type: 'added', label: '新增', count: diffSummary.added },
    { type: 'removed', label: '删除', count: diffSummary.removed },
    { type: 'modified', label: '修改', count: diffSummary.modified },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">
      <header className="h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-300" />
          </button>
          <div className="flex items-center gap-2">
            <GitCompare size={20} className="text-blue-400" />
            <h1 className="font-bold text-white text-lg" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              版本比对
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Sun size={14} className="text-yellow-400" />
            <span>白班</span>
            <span className="text-slate-600">vs</span>
            <Moon size={14} className="text-blue-400" />
            <span>夜班</span>
          </div>
        </div>
      </header>

      <div className="flex h-full overflow-hidden">
        <div className="w-72 bg-slate-900 border-r border-slate-700 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-100">差异统计</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {changeTypeFilters.slice(1).map((filter) => (
                <button
                  key={filter.type}
                  onClick={() =>
                    setHighlightedChangeType(
                      highlightedChangeType === filter.type ? null : filter.type
                    )
                  }
                  className={`p-2 rounded-lg border transition-all ${
                    highlightedChangeType === filter.type
                      ? 'bg-slate-700 border-blue-500'
                      : 'bg-slate-800 border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div
                    className="text-lg font-bold"
                    style={{ color: filter.type ? changeTypeColors[filter.type].stroke : '#94A3B8' }}
                  >
                    {filter.count}
                  </div>
                  <div className="text-xs text-slate-400">{filter.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-slate-700">
            <h3 className="font-bold text-slate-100 mb-3">版本选择</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">旧版本</label>
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowLeftDropdown(!showLeftDropdown);
                      setShowRightDropdown(false);
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-left text-sm text-slate-200 flex items-center justify-between hover:border-slate-500 transition-colors"
                  >
                    {leftVersion ? (
                      <span className="truncate">{leftVersion.name}</span>
                    ) : (
                      <span className="text-slate-500">选择版本...</span>
                    )}
                    <ChevronDown size={16} className="text-slate-400" />
                  </button>

                  {showLeftDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                      {versions.map((version) => (
                        <button
                          key={version.id}
                          onClick={() => {
                            setLeftVersionId(version.id);
                            setShowLeftDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700 ${
                            version.id === leftVersionId ? 'bg-slate-700 text-blue-400' : 'text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={versionTypeColors[version.type]}>
                              {versionTypeIcons[version.type]}
                            </span>
                            <span className="flex-1 truncate">{version.name}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 ml-6">
                            {formatTimestamp(version.timestamp)} · {version.operator}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center text-slate-500">
                <GitCompare size={16} className="mx-auto" />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">新版本</label>
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowRightDropdown(!showRightDropdown);
                      setShowLeftDropdown(false);
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-left text-sm text-slate-200 flex items-center justify-between hover:border-slate-500 transition-colors"
                  >
                    {rightVersion ? (
                      <span className="truncate">{rightVersion.name}</span>
                    ) : (
                      <span className="text-slate-500">选择版本...</span>
                    )}
                    <ChevronDown size={16} className="text-slate-400" />
                  </button>

                  {showRightDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                      {versions.map((version) => (
                        <button
                          key={version.id}
                          onClick={() => {
                            setRightVersionId(version.id);
                            setShowRightDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700 ${
                            version.id === rightVersionId ? 'bg-slate-700 text-blue-400' : 'text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={versionTypeColors[version.type]}>
                              {versionTypeIcons[version.type]}
                            </span>
                            <span className="flex-1 truncate">{version.name}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 ml-6">
                            {formatTimestamp(version.timestamp)} · {version.operator}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-700">
              <h3 className="font-bold text-slate-100">
                差异列表
                <span className="text-sm font-normal text-slate-500 ml-2">
                  ({filteredDiffs.length})
                </span>
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredDiffs.length === 0 ? (
                <div className="text-center text-slate-500 py-8 text-sm">
                  暂无差异
                </div>
              ) : (
                filteredDiffs.map((diff) => (
                  <button
                    key={diff.id}
                    onClick={() => handleDiffClick(diff)}
                    className={`w-full p-2 rounded-lg text-left transition-all ${
                      selectedDiffId === diff.id
                        ? 'bg-slate-700 ring-1 ring-blue-500'
                        : 'hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: changeTypeColors[diff.type].stroke }}
                      />
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                        {changeTypeLabels[diff.type]}
                      </span>
                    </div>
                    <div className="text-sm text-slate-200 mt-1 truncate">
                      {diff.newElement?.text || diff.oldElement?.text}
                    </div>
                    {diff.changes && diff.changes.length > 0 && (
                      <div className="text-xs text-slate-500 mt-1">
                        {diff.changes.map((c, i) => (
                          <span key={i} className="mr-2">
                            {c.field}: {String(c.oldValue)} → {String(c.newValue)}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div ref={containerRef} className="flex-1 flex items-stretch gap-2 p-2 bg-slate-950">
          {leftVersion && canvasSize.width > 0 && (
            <div className="flex-1 flex flex-col bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
              <div className="px-3 py-2 bg-slate-800 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`${versionTypeColors[leftVersion.type]}`}>
                    {versionTypeIcons[leftVersion.type]}
                  </span>
                  <span className="text-sm font-medium text-slate-200">{leftVersion.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatTimestamp(leftVersion.timestamp)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {leftVersion.operator}
                  </span>
                </div>
              </div>
              <div className="flex-1 relative">
                <DiffChartCanvas
                  ref={leftCanvasRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  elements={leftVersion.layerData}
                  mainRoutes={mainRoutes}
                  keyPoints={keyPoints}
                  diffs={diffs}
                  diffSide="old"
                  highlightedChangeType={highlightedChangeType}
                  readOnly
                />
                <div className="absolute bottom-3 left-3 flex gap-1">
                  <button className="p-1.5 bg-slate-800/80 border border-slate-600 rounded hover:bg-slate-700 transition-colors">
                    <ZoomIn size={14} className="text-slate-300" />
                  </button>
                  <button className="p-1.5 bg-slate-800/80 border border-slate-600 rounded hover:bg-slate-700 transition-colors">
                    <ZoomOut size={14} className="text-slate-300" />
                  </button>
                  <button className="p-1.5 bg-slate-800/80 border border-slate-600 rounded hover:bg-slate-700 transition-colors">
                    <Maximize2 size={14} className="text-slate-300" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="w-px bg-slate-700 flex-shrink-0" />

          {rightVersion && canvasSize.width > 0 && (
            <div className="flex-1 flex flex-col bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
              <div className="px-3 py-2 bg-slate-800 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`${versionTypeColors[rightVersion.type]}`}>
                    {versionTypeIcons[rightVersion.type]}
                  </span>
                  <span className="text-sm font-medium text-slate-200">{rightVersion.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatTimestamp(rightVersion.timestamp)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {rightVersion.operator}
                  </span>
                </div>
              </div>
              <div className="flex-1 relative">
                <DiffChartCanvas
                  ref={rightCanvasRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  elements={rightVersion.layerData}
                  mainRoutes={mainRoutes}
                  keyPoints={keyPoints}
                  diffs={diffs}
                  diffSide="new"
                  highlightedChangeType={highlightedChangeType}
                  readOnly
                />
                <div className="absolute bottom-3 left-3 flex gap-1">
                  <button className="p-1.5 bg-slate-800/80 border border-slate-600 rounded hover:bg-slate-700 transition-colors">
                    <ZoomIn size={14} className="text-slate-300" />
                  </button>
                  <button className="p-1.5 bg-slate-800/80 border border-slate-600 rounded hover:bg-slate-700 transition-colors">
                    <ZoomOut size={14} className="text-slate-300" />
                  </button>
                  <button className="p-1.5 bg-slate-800/80 border border-slate-600 rounded hover:bg-slate-700 transition-colors">
                    <Maximize2 size={14} className="text-slate-300" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
