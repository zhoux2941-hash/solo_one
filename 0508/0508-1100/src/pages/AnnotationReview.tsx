import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  FileWarning,
  AlertCircle,
  Layers,
  CheckCircle2,
  Music,
  Hand,
  MessageCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../lib/api';
import { useStore } from '../store';
import type { AnnotationVersion, Annotation, Conflict, MissingAnnotation } from '../types';

const TYPE_LABELS: Record<Annotation['type'], string> = {
  fingering: '指法',
  phrasing: '断句',
  oral: '口传',
};

const TYPE_STYLES: Record<Annotation['type'], string> = {
  fingering: 'bg-sky-50 text-sky-700 border-sky-200',
  phrasing: 'bg-violet-50 text-violet-700 border-violet-200',
  oral: 'bg-amber-50 text-amber-700 border-amber-200',
};

function TypeIcon({ type, size = 14 }: { type: Annotation['type']; size?: number }) {
  if (type === 'fingering') return <Hand size={size} />;
  if (type === 'phrasing') return <Music size={size} />;
  return <MessageCircle size={size} />;
}

function diffWords(a: string, b: string): { text: string; diff: boolean }[] {
  const result: { text: string; diff: boolean }[] = [];
  const maxLen = Math.max(a.length, b.length);
  let i = 0;

  while (i < maxLen) {
    if (i < a.length && i < b.length && a[i] === b[i]) {
      let j = i;
      while (j < maxLen && j < a.length && j < b.length && a[j] === b[j]) {
        j++;
      }
      result.push({ text: a.slice(i, j), diff: false });
      i = j;
    } else {
      let j = i;
      while (j < maxLen) {
        const aRemain = a.slice(j);
        const bRemain = b.slice(j);
        let foundMatch = false;
        for (let k = 1; k <= Math.min(3, aRemain.length, bRemain.length); k++) {
          if (aRemain.slice(0, k) === bRemain.slice(0, k)) {
            foundMatch = true;
            break;
          }
        }
        if (foundMatch) break;
        j++;
      }
      if (i < a.length) {
        result.push({ text: a.slice(i, j), diff: true });
      }
      if (i < b.length && i < j) {
        result.push({ text: b.slice(i, j), diff: true });
      }
      i = j;
    }
  }

  return result;
}

function calculateDiffRatio(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 0;
  const maxLen = Math.max(a.length, b.length);
  let sameCount = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) sameCount++;
  }
  return 1 - sameCount / maxLen;
}

function renderDiffContent(
  content: string,
  compareTo: string,
  shouldHighlight: boolean
) {
  if (!shouldHighlight) return <span>{content}</span>;
  const parts = diffWords(content, compareTo);
  return (
    <span>
      {parts.map((part, idx) =>
        part.diff ? (
          <span
            key={idx}
            className="bg-[#C84B31] text-[#FFE082] px-0.5 rounded"
          >
            {part.text}
          </span>
        ) : (
          <span key={idx}>{part.text}</span>
        )
      )}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="flex-1 grid grid-cols-12 gap-4 animate-pulse">
      <aside className="col-span-2 bg-[#FBF7EE] border border-[#E8DDC9] rounded-lg h-[60vh]" />
      <section className="col-span-7 bg-[#FBF7EE] border border-[#E8DDC9] rounded-lg h-[60vh]" />
      <aside className="col-span-3 flex flex-col gap-4">
        <div className="bg-[#FBF7EE] border border-[#E8DDC9] rounded-lg h-[30vh]" />
        <div className="bg-[#FBF7EE] border border-[#E8DDC9] rounded-lg h-[28vh]" />
      </aside>
    </div>
  );
}

function VersionSwitcher({
  versions,
  selectedId,
  onSelect,
}: {
  versions: AnnotationVersion[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wider text-[#6B5A46] uppercase mb-2">
        批注版本
      </h3>
      {versions.map((v) => {
        const active = v.id === selectedId;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id)}
            className={`group relative text-left rounded-md border px-3 py-3 transition-all ${
              active
                ? 'border-[#4A3728] bg-[#FBF7EE] shadow-sm'
                : 'border-[#E8DDC9] bg-[#FBF7EE]/60 hover:bg-[#FBF7EE]'
            }`}
          >
            {active && (
              <span
                className="absolute inset-y-1 left-0 w-1 rounded-r"
                style={{ backgroundColor: v.color }}
              />
            )}
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: v.color }}
                  />
                  <span className="text-sm font-medium text-[#2B1F14] truncate">
                    {v.teacherName}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#6B5A46]">
                  第 {v.versionNumber} 版 · {new Date(v.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
              {v.isFinal && (
                <CheckCircle2 size={16} className="text-[#4A7C59] shrink-0" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ScoreSheet({
  svgContent,
  annotations,
  versions,
  selectedId,
  merged,
}: {
  svgContent: string;
  annotations: Annotation[];
  versions: AnnotationVersion[];
  selectedId: string | null;
  merged: boolean;
}) {
  const versionColor = (vid: string) =>
    versions.find((v) => v.id === vid)?.color ?? '#6B5A46';

  const visible = (merged
    ? annotations
    : annotations.filter((a) => a.versionId === selectedId)
  ).sort((a, b) => {
    if (a.measureNumber !== b.measureNumber)
      return a.measureNumber - b.measureNumber;
    if (a.beatPosition !== b.beatPosition)
      return a.beatPosition - b.beatPosition;
    return a.versionId.localeCompare(b.versionId);
  });

  return (
    <div className="relative h-full min-h-[500px] rounded-lg border border-[#E8DDC9] bg-[#FBF7EE] p-6 overflow-auto">
      <div
        className="relative mx-auto w-full max-w-3xl"
        dangerouslySetInnerHTML={{ __html: svgContent || defaultSvg() }}
      />
      <div className="pointer-events-none absolute inset-6">
        {visible.map((a) => (
          <div
            key={a.id}
            title={`${TYPE_LABELS[a.type]} · ${a.content}`}
            className="absolute rounded border-2 border-dashed px-1.5 py-0.5 text-[10px] font-medium shadow-sm"
            style={{
              left: `${(a.x / 800) * 100}%`,
              top: `${(a.y / 600) * 100}%`,
              width: `${(a.width / 800) * 100}%`,
              borderColor: versionColor(a.versionId),
              color: versionColor(a.versionId),
              backgroundColor: `${versionColor(a.versionId)}15`,
            }}
          >
            {a.content}
          </div>
        ))}
      </div>
    </div>
  );
}

function defaultSvg() {
  return `
    <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto">
      <rect x="0" y="0" width="800" height="600" fill="#FBF7EE"/>
      <g stroke="#2B1F14" stroke-width="1.5" fill="none">
        <line x1="60" y1="140" x2="740" y2="140"/>
        <line x1="60" y1="160" x2="740" y2="160"/>
        <line x1="60" y1="180" x2="740" y2="180"/>
        <line x1="60" y1="200" x2="740" y2="200"/>
        <line x1="60" y1="220" x2="740" y2="220"/>
        <line x1="60" y1="320" x2="740" y2="320"/>
        <line x1="60" y1="340" x2="740" y2="340"/>
        <line x1="60" y1="360" x2="740" y2="360"/>
        <line x1="60" y1="380" x2="740" y2="380"/>
        <line x1="60" y1="400" x2="740" y2="400"/>
        <line x1="250" y1="140" x2="250" y2="220"/>
        <line x1="450" y1="140" x2="450" y2="220"/>
        <line x1="650" y1="140" x2="650" y2="220"/>
        <line x1="250" y1="320" x2="250" y2="400"/>
        <line x1="450" y1="320" x2="450" y2="400"/>
        <line x1="650" y1="320" x2="650" y2="400"/>
      </g>
      <g fill="#2B1F14">
        <circle cx="150" cy="190" r="5"/><circle cx="200" cy="180" r="5"/>
        <circle cx="300" cy="170" r="5"/><circle cx="350" cy="190" r="5"/>
        <circle cx="500" cy="180" r="5"/><circle cx="550" cy="170" r="5"/>
        <circle cx="700" cy="190" r="5"/>
        <circle cx="150" cy="370" r="5"/><circle cx="200" cy="360" r="5"/>
        <circle cx="300" cy="350" r="5"/><circle cx="350" cy="370" r="5"/>
        <circle cx="500" cy="360" r="5"/><circle cx="550" cy="350" r="5"/>
        <circle cx="700" cy="370" r="5"/>
      </g>
      <text x="60" y="110" fill="#6B5A46" font-family="serif" font-size="14">示例谱面 · 请替换为真实 SVG</text>
    </svg>
  `;
}

function ConflictPanel({
  conflicts,
  versions,
  scoreId,
  onRefresh,
}: {
  conflicts: Conflict[];
  versions: AnnotationVersion[];
  scoreId: string;
  onRefresh: () => Promise<void>;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [finalizingVersionId, setFinalizingVersionId] = useState<string | null>(null);

  const toggleExpand = (conflictId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(conflictId)) {
        next.delete(conflictId);
      } else {
        next.add(conflictId);
      }
      return next;
    });
  };

  const getVersionByAnnotation = (annotation: Annotation) => {
    return versions.find((v) => v.id === annotation.versionId) ?? null;
  };

  const getSortedAnnotations = (conflict: Conflict) => {
    return [...conflict.annotations]
      .map((a) => ({
        annotation: a,
        version: getVersionByAnnotation(a),
      }))
      .filter((item) => item.version !== null)
      .sort(
        (a, b) =>
          new Date(b.version!.createdAt).getTime() -
          new Date(a.version!.createdAt).getTime()
      )
      .slice(0, 3);
  };

  const handleAdopt = async (versionId: string) => {
    setFinalizingVersionId(versionId);
    try {
      await api.finalizeVersion(scoreId, versionId);
      await onRefresh();
    } finally {
      setFinalizingVersionId(null);
    }
  };

  const shouldHighlightDiff = (content1: string, content2: string) => {
    return calculateDiffRatio(content1, content2) > 0.3;
  };

  const getResolvedTeacherName = (conflict: Conflict) => {
    if (!conflict.resolvedVersionId) return null;
    const version = versions.find((v) => v.id === conflict.resolvedVersionId);
    return version?.teacherName ?? null;
  };

  if (conflicts.length === 0) {
    return (
      <div className="text-sm text-[#6B5A46] text-center py-8">
        <FileWarning size={22} className="mx-auto mb-2 opacity-40" />
        暂无冲突
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {conflicts.map((c) => {
        const sortedItems = getSortedAnnotations(c);
        const hasMultipleVersions = sortedItems.length >= 3;
        const isExpanded = expandedIds.has(c.id);
        const resolvedTeacherName = getResolvedTeacherName(c);

        return (
          <li
            key={c.id}
            className={`rounded-md border p-3 ${
              c.resolved
                ? 'border-[#4A7C59]/30 bg-[#4A7C59]/5'
                : 'border-[#C84B31]/30 bg-[#C84B31]/5'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#2B1F14]">
                第 {c.measureNumber} 小节
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${TYPE_STYLES[c.type]}`}
              >
                <TypeIcon type={c.type} size={11} />
                <span className="ml-1">{TYPE_LABELS[c.type]}</span>
              </span>
            </div>

            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[#6B5A46]">
                {c.resolved ? '已解决' : '存在差异，需审阅'}
              </p>
              {c.resolved && resolvedTeacherName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#4A7C59]/20 text-[#4A7C59] px-2 py-0.5 text-[11px] font-medium">
                  <CheckCircle2 size={12} />
                  已采纳{resolvedTeacherName}版本
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              {c.annotations.slice(0, 3).map((a) => (
                <span
                  key={a.id}
                  className="rounded bg-white/70 border border-[#E8DDC9] px-2 py-1 text-[11px] text-[#2B1F14]"
                >
                  {a.content}
                </span>
              ))}
            </div>

            {hasMultipleVersions && (
              <>
                <button
                  type="button"
                  onClick={() => toggleExpand(c.id)}
                  className="flex items-center gap-1 text-[11px] text-[#6B5A46] hover:text-[#2B1F14] transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={14} />
                      收起差异
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} />
                      查看差异
                    </>
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#E8DDC9]">
                    <h4 className="text-xs font-semibold text-[#2B1F14] mb-3">
                      近三版差异摘要
                    </h4>
                    <div className="overflow-hidden rounded-lg border border-[#E8DDC9]">
                      <table className="w-full text-xs">
                        <thead className="bg-[#4A3728] text-[#F5F0E6]">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium">
                              老师
                            </th>
                            <th className="px-3 py-2 text-left font-medium">
                              版本
                            </th>
                            <th className="px-3 py-2 text-left font-medium">
                              批注内容
                            </th>
                            {!c.resolved && (
                              <th className="px-3 py-2 text-center font-medium">
                                操作
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {sortedItems.map((item, idx) => {
                            const { annotation, version } = item;
                            const isFirst = idx === 0;
                            const firstContent = sortedItems[0].annotation.content;
                            const highlight = isFirst
                              ? false
                              : shouldHighlightDiff(
                                  annotation.content,
                                  firstContent
                                );
                            const isFinalizing =
                              finalizingVersionId === version!.id;

                            return (
                              <tr
                                key={annotation.id}
                                className={`border-b border-[#E8DDC9] last:border-b-0 ${
                                  idx % 2 === 0 ? 'bg-[#FBF7EE]' : 'bg-white'
                                }`}
                              >
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="inline-block w-2 h-2 rounded-full shrink-0"
                                      style={{
                                        backgroundColor: version!.color,
                                      }}
                                    />
                                    <span className="text-[#2B1F14] font-medium">
                                      {version!.teacherName}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-[#6B5A46]">
                                  第{version!.versionNumber}版
                                  <br />
                                  {new Date(
                                    version!.createdAt
                                  ).toLocaleDateString('zh-CN')}
                                </td>
                                <td className="px-3 py-2 text-[#2B1F14]">
                                  {renderDiffContent(
                                    annotation.content,
                                    firstContent,
                                    highlight
                                  )}
                                </td>
                                {!c.resolved && (
                                  <td className="px-3 py-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAdopt(version!.id)
                                      }
                                      disabled={isFinalizing}
                                      className="inline-flex items-center gap-1 rounded-md bg-[#C84B31] px-2 py-1 text-[10px] font-medium text-white hover:bg-[#b03e28] disabled:opacity-50 transition-colors"
                                    >
                                      {isFinalizing ? (
                                        <Loader2
                                          size={12}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <CheckCircle2 size={12} />
                                      )}
                                      采纳此版
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function MissingAlert({ missing }: { missing: MissingAnnotation[] }) {
  if (missing.length === 0) {
    return (
      <div className="text-sm text-[#6B5A46] text-center py-8">
        <AlertCircle size={22} className="mx-auto mb-2 opacity-40" />
        暂无缺失提醒
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {missing.map((m) => (
        <li
          key={m.id}
          className="rounded-md border border-amber-200 bg-amber-50/60 p-3"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-[#2B1F14]">
              第 {m.measureNumber} 小节
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${TYPE_STYLES[m.type]}`}
            >
              <TypeIcon type={m.type} size={11} />
              <span className="ml-1">{TYPE_LABELS[m.type]}</span>
            </span>
          </div>
          <p className="text-xs text-[#6B5A46] mb-2">
            在 {m.missingInVersions.length} 个版本中缺失
          </p>
          <p className="text-[11px] text-[#2B1F14]">参考内容：{m.annotation.content}</p>
        </li>
      ))}
    </ul>
  );
}

export default function AnnotationReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const scoreId = id ?? '';

  const {
    currentScore,
    versions,
    annotations,
    conflicts,
    missingAnnotations,
    selectedVersionId,
    mergedView,
    loading,
    error,
    setCurrentScore,
    setVersions,
    setAnnotations,
    setConflicts,
    setMissingAnnotations,
    setSelectedVersionId,
    setMergedView,
    setLoading,
    setError,
  } = useStore();

  const [finalizing, setFinalizing] = useState(false);

  const loadAll = useCallback(async () => {
    if (!scoreId) return;
    setLoading(true);
    setError(null);
    try {
      const [score, vers, anns, confl, miss] = await Promise.all([
        api.getScore(scoreId),
        api.getVersions(scoreId),
        api.getAnnotations(scoreId),
        api.getConflicts(scoreId),
        api.getMissing(scoreId),
      ]);
      setCurrentScore(score);
      setVersions(vers);
      setAnnotations(anns);
      setConflicts(confl);
      setMissingAnnotations(miss);
      if (!selectedVersionId && vers.length > 0) {
        setSelectedVersionId(vers[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [
    scoreId,
    selectedVersionId,
    setCurrentScore,
    setVersions,
    setAnnotations,
    setConflicts,
    setMissingAnnotations,
    setSelectedVersionId,
    setLoading,
    setError,
  ]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleFinalize = async () => {
    if (!scoreId || !selectedVersionId) return;
    setFinalizing(true);
    try {
      await api.finalizeVersion(scoreId, selectedVersionId);
      await loadAll();
    } finally {
      setFinalizing(false);
    }
  };

  const current = versions.find((v) => v.id === selectedVersionId) ?? null;

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <header className="sticky top-0 z-10 border-b border-[#E8DDC9] bg-[#F5F0E6]/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 text-sm text-[#6B5A46] hover:text-[#2B1F14]"
            >
              <ArrowLeft size={16} />
              返回
            </button>
            <span className="text-[#E8DDC9]">|</span>
            <h1 className="font-serif text-lg font-semibold text-[#2B1F14] truncate">
              {currentScore?.title ?? '加载中...'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMergedView(!mergedView)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                mergedView
                  ? 'border-[#4A3728] bg-[#4A3728] text-[#F5F0E6]'
                  : 'border-[#E8DDC9] bg-[#FBF7EE] text-[#6B5A46] hover:bg-[#EDE3CF]'
              }`}
            >
              <Layers size={14} />
              {mergedView ? '合并视图' : '单版视图'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/score/${scoreId}/export`)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#C84B31] px-3 py-1.5 text-sm font-medium text-[#F5F0E6] hover:bg-[#b03e28] transition-colors"
            >
              <Download size={14} />
              导出校样
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && <Skeleton />}

        {!loading && (
          <div className="grid grid-cols-12 gap-4">
            <aside className="col-span-12 lg:col-span-2">
              <div className="sticky top-[72px]">
                <VersionSwitcher
                  versions={versions}
                  selectedId={selectedVersionId}
                  onSelect={setSelectedVersionId}
                />
                {current && !current.isFinal && (
                  <button
                    type="button"
                    onClick={handleFinalize}
                    disabled={finalizing}
                    className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-gradient-to-r from-[#C84B31] to-[#4A3728] px-3 py-2 text-sm font-medium text-[#F5F0E6] hover:opacity-90 disabled:opacity-60"
                  >
                    {finalizing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    以此版定稿
                  </button>
                )}
                {current?.isFinal && (
                  <div className="mt-4 rounded-md border border-[#4A7C59]/40 bg-[#4A7C59]/10 px-3 py-2 text-xs text-[#4A7C59] text-center">
                    当前版本为定稿
                  </div>
                )}
              </div>
            </aside>

            <section className="col-span-12 lg:col-span-7">
              <ScoreSheet
                svgContent={currentScore?.svgContent ?? ''}
                annotations={annotations}
                versions={versions}
                selectedId={selectedVersionId}
                merged={mergedView}
              />
            </section>

            <aside className="col-span-12 lg:col-span-3 flex flex-col gap-4">
              <div className="rounded-lg border border-[#E8DDC9] bg-[#FBF7EE] p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#2B1F14]">冲突批注</h3>
                  <span className="text-xs text-[#6B5A46]">
                    {conflicts.filter((c) => !c.resolved).length} 处待处理
                  </span>
                </div>
                <ConflictPanel
                  conflicts={conflicts}
                  versions={versions}
                  scoreId={scoreId}
                  onRefresh={loadAll}
                />
              </div>

              <div className="rounded-lg border border-[#E8DDC9] bg-[#FBF7EE] p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#2B1F14]">缺失提醒</h3>
                  <span className="text-xs text-[#6B5A46]">
                    {missingAnnotations.length} 处
                  </span>
                </div>
                <MissingAlert missing={missingAnnotations} />
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
