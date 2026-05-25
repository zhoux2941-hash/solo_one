import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  User,
  BookOpen,
  AlertTriangle,
  Eye,
  GitCompare,
  Music,
  Hand,
  MessageCircle,
  Loader2,
  FileWarning,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../lib/api';
import { useStore } from '../store';
import type { Annotation, TeacherConflictSummary, TeacherScoreSummary } from '../types';

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

function Skeleton() {
  return (
    <div className="flex-1 flex flex-col gap-4 animate-pulse">
      <div className="grid grid-cols-12 gap-4 flex-1">
        <aside className="col-span-3 bg-[#FBF7EE] border border-[#E8DDC9] rounded-lg h-[55vh]" />
        <section className="col-span-9 bg-[#FBF7EE] border border-[#E8DDC9] rounded-lg h-[55vh]" />
      </div>
      <div className="bg-[#FBF7EE] border border-[#E8DDC9] rounded-lg h-[20vh]" />
    </div>
  );
}

function ScoreCard({
  score,
  selected,
  onClick,
}: {
  score: TeacherScoreSummary;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-4 transition-all ${
        selected
          ? 'border-[#4A3728] bg-[#FBF7EE] shadow-sm'
          : 'border-[#E8DDC9] bg-[#FBF7EE]/60 hover:bg-[#FBF7EE]'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-[#2B1F14] truncate">{score.scoreTitle}</h4>
          <p className="text-xs text-[#6B5A46]">{score.composer}</p>
        </div>
        {score.hasConflicts && (
          <AlertTriangle size={16} className="text-[#C84B31] shrink-0" />
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-[#6B5A46]">
        <span className="inline-flex items-center gap-1">
          <BookOpen size={12} />
          {score.annotationCount} 条批注
        </span>
        {score.conflictCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[#C84B31]">
            <AlertTriangle size={12} />
            {score.conflictCount} 处冲突
          </span>
        )}
      </div>
      <p className="mt-2 text-[10px] text-[#6B5A46]">
        最后批注：{new Date(score.lastAnnotatedAt).toLocaleDateString('zh-CN')}
      </p>
    </button>
  );
}

function ScoreSheet({
  svgContent,
  annotations,
  compareMode,
  teacherId,
  versions,
}: {
  svgContent: string;
  annotations: Annotation[];
  compareMode: boolean;
  teacherId: string;
  versions: Array<{ id: string; teacherId: string; teacherName: string; color: string }>;
}) {
  const versionColor = (vid: string) =>
    versions.find((v) => v.id === vid)?.color ?? '#6B5A46';

  const versionTeacherName = (vid: string) =>
    versions.find((v) => v.id === vid)?.teacherName ?? '未知';

  const isTeacherAnnotation = (a: Annotation) => {
    const v = versions.find((ver) => ver.id === a.versionId);
    return v?.teacherId === teacherId;
  };

  const visible = (compareMode
    ? annotations
    : annotations.filter(isTeacherAnnotation)
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
        {visible.map((a) => {
          const isTeacher = isTeacherAnnotation(a);
          const borderStyle = isTeacher ? 'border-solid' : 'border-dashed';
          const opacity = isTeacher ? 'opacity-100' : 'opacity-60';
          return (
            <div
              key={a.id}
              title={`${TYPE_LABELS[a.type]} · ${a.content} · ${versionTeacherName(a.versionId)}`}
              className={`absolute rounded border-2 ${borderStyle} px-1.5 py-0.5 text-[10px] font-medium shadow-sm ${opacity}`}
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
          );
        })}
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

function ConflictList({
  conflicts,
  onSelectScore,
}: {
  conflicts: TeacherConflictSummary[];
  onSelectScore: (scoreId: string) => void;
}) {
  if (conflicts.length === 0) {
    return (
      <div className="text-sm text-[#6B5A46] text-center py-8">
        <FileWarning size={22} className="mx-auto mb-2 opacity-40" />
        暂无冲突
      </div>
    );
  }
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {conflicts.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelectScore(c.scoreId)}
          className={`shrink-0 w-72 text-left rounded-md border p-4 transition-colors ${
            c.resolved
              ? 'border-[#4A7C59]/30 bg-[#4A7C59]/5 hover:bg-[#4A7C59]/10'
              : 'border-[#C84B31]/30 bg-[#C84B31]/5 hover:bg-[#C84B31]/10'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#2B1F14] truncate">
              {c.scoreTitle}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${TYPE_STYLES[c.type]}`}
            >
              <TypeIcon type={c.type} size={11} />
              <span className="ml-1">{TYPE_LABELS[c.type]}</span>
            </span>
          </div>
          <p className="text-xs text-[#6B5A46] mb-2">
            第 {c.measureNumber} 小节 · {c.resolved ? '已解决' : '待审阅'}
          </p>
          <div className="space-y-2">
            <div className="rounded bg-white/70 border border-[#E8DDC9] px-2 py-1.5">
              <p className="text-[10px] text-[#6B5A46] mb-0.5">该老师批注</p>
              <p className="text-xs text-[#2B1F14]">{c.teacherAnnotation.content}</p>
            </div>
            {c.otherAnnotations.slice(0, 2).map((a, idx) => (
              <div key={a.id} className="rounded bg-white/50 border border-[#E8DDC9] px-2 py-1.5">
                <p className="text-[10px] text-[#6B5A46] mb-0.5">其他老师 {idx + 1}</p>
                <p className="text-xs text-[#2B1F14]">{a.content}</p>
              </div>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}

export default function TeacherReview() {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const tid = teacherId ?? '';

  const {
    currentTeacher,
    teacherScores,
    teacherAnnotations,
    teacherConflicts,
    selectedTeacherScoreId,
    compareMode,
    currentScore,
    versions,
    annotations,
    loading,
    error,
    setCurrentTeacher,
    setTeacherScores,
    setTeacherAnnotations,
    setTeacherConflicts,
    setSelectedTeacherScoreId,
    setCompareMode,
    setCurrentScore,
    setVersions,
    setAnnotations,
    setLoading,
    setError,
  } = useStore();

  const [exporting, setExporting] = useState(false);

  const loadAll = useCallback(async () => {
    if (!tid) return;
    setLoading(true);
    setError(null);
    try {
      const [teacher, scores, conflicts] = await Promise.all([
        api.getTeacher(tid),
        api.getTeacherScores(tid),
        api.getTeacherConflicts(tid),
      ]);
      setCurrentTeacher(teacher);
      setTeacherScores(scores);
      setTeacherConflicts(conflicts);
      if (!selectedTeacherScoreId && scores.length > 0) {
        setSelectedTeacherScoreId(scores[0].scoreId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [
    tid,
    selectedTeacherScoreId,
    setCurrentTeacher,
    setTeacherScores,
    setTeacherConflicts,
    setSelectedTeacherScoreId,
    setLoading,
    setError,
  ]);

  const loadScoreData = useCallback(async (scoreId: string) => {
    if (!tid || !scoreId) return;
    setLoading(true);
    try {
      const [score, vers, teacherAnns, allAnns] = await Promise.all([
        api.getScore(scoreId),
        api.getVersions(scoreId),
        api.getTeacherAnnotations(tid, scoreId),
        api.getAnnotations(scoreId),
      ]);
      setCurrentScore(score);
      setVersions(vers);
      setTeacherAnnotations(teacherAnns);
      setAnnotations(allAnns);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载曲谱失败');
    } finally {
      setLoading(false);
    }
  }, [
    tid,
    setCurrentScore,
    setVersions,
    setTeacherAnnotations,
    setAnnotations,
    setLoading,
    setError,
  ]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (selectedTeacherScoreId) {
      loadScoreData(selectedTeacherScoreId);
    }
  }, [selectedTeacherScoreId, loadScoreData]);

  const handleScoreSelect = (scoreId: string) => {
    setSelectedTeacherScoreId(scoreId);
  };

  const handleExport = async () => {
    if (!tid) return;
    setExporting(true);
    try {
      const result = await api.exportTeacherProof(tid);
      if (result?.exportId) {
        window.open(api.downloadExport(result.exportId), '_blank');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '导出失败');
    } finally {
      setExporting(false);
    }
  };

  const selectedScore = teacherScores.find(
    (s) => s.scoreId === selectedTeacherScoreId
  ) ?? null;

  const unresolvedConflicts = teacherConflicts.filter((c) => !c.resolved);

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
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#4A3728] flex items-center justify-center text-[#F5F0E6] shrink-0">
                <User size={16} />
              </div>
              <h1 className="font-serif text-lg font-semibold text-[#2B1F14] truncate">
                {currentTeacher?.name ?? '加载中...'}
              </h1>
              {currentTeacher?.title && (
                <span className="text-xs text-[#6B5A46] shrink-0">
                  {currentTeacher.title}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCompareMode(!compareMode)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                compareMode
                  ? 'border-[#4A3728] bg-[#4A3728] text-[#F5F0E6]'
                  : 'border-[#E8DDC9] bg-[#FBF7EE] text-[#6B5A46] hover:bg-[#EDE3CF]'
              }`}
            >
              {compareMode ? <GitCompare size={14} /> : <Eye size={14} />}
              {compareMode ? '对比模式' : '仅看此老师'}
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#C84B31] px-3 py-1.5 text-sm font-medium text-[#F5F0E6] hover:bg-[#b03e28] transition-colors disabled:opacity-60"
            >
              {exporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
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
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-12 gap-4 flex-1">
              <aside className="col-span-12 lg:col-span-3">
                <div className="sticky top-[72px]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#2B1F14]">
                      批注曲谱列表
                    </h3>
                    <span className="text-xs text-[#6B5A46]">
                      {teacherScores.length} 首
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {teacherScores.map((score) => (
                      <ScoreCard
                        key={score.scoreId}
                        score={score}
                        selected={score.scoreId === selectedTeacherScoreId}
                        onClick={() => handleScoreSelect(score.scoreId)}
                      />
                    ))}
                  </div>
                </div>
              </aside>

              <section className="col-span-12 lg:col-span-9">
                {selectedScore && currentScore && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h2 className="font-serif text-base font-semibold text-[#2B1F14]">
                          {selectedScore.scoreTitle}
                        </h2>
                        <p className="text-xs text-[#6B5A46]">
                          {selectedScore.composer} · 共 {selectedScore.annotationCount} 条批注
                        </p>
                      </div>
                      {compareMode && (
                        <div className="flex items-center gap-2 text-xs text-[#6B5A46]">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full border-2 border-solid border-[#4A3728]" />
                            该老师（实线）
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full border-2 border-dashed border-[#6B5A46]" />
                            其他老师（虚线）
                          </span>
                        </div>
                      )}
                    </div>
                    <ScoreSheet
                      svgContent={currentScore.svgContent}
                      annotations={compareMode ? annotations : teacherAnnotations}
                      compareMode={compareMode}
                      teacherId={tid}
                      versions={versions}
                    />
                  </>
                )}
                {!selectedScore && (
                  <div className="h-full min-h-[500px] rounded-lg border border-[#E8DDC9] bg-[#FBF7EE] flex items-center justify-center text-[#6B5A46]">
                    <div className="text-center">
                      <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
                      <p>请从左侧选择一首曲谱查看批注</p>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <div className="rounded-lg border border-[#E8DDC9] bg-[#FBF7EE] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-[#C84B31]" />
                  <h3 className="text-sm font-semibold text-[#2B1F14]">
                    该老师涉及的冲突
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#6B5A46]">
                  <span>共 {teacherConflicts.length} 处</span>
                  <span className="text-[#C84B31]">
                    {unresolvedConflicts.length} 处待处理
                  </span>
                </div>
              </div>
              <ConflictList
                conflicts={teacherConflicts}
                onSelectScore={handleScoreSelect}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
