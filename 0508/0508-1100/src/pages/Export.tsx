import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  FileText,
  FileSpreadsheet,
  FileCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ChevronDown,
  Eye,
} from 'lucide-react';
import { api } from '../lib/api';
import { useStore } from '../store';
import type { AnnotationVersion, ExportConfig } from '../types';

type Format = 'pdf' | 'docx';
type PageSize = 'A4' | 'Letter';

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-[#4A3728]' : 'bg-[#E8DDC9]'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </button>
      <div>
        <span className="text-sm font-medium text-[#2B1F14]">{label}</span>
        {description && (
          <p className="mt-0.5 text-xs text-[#6B5A46]">{description}</p>
        )}
      </div>
    </label>
  );
}

function FormatOption({
  value,
  selected,
  onSelect,
  icon: Icon,
  label,
  desc,
}: {
  value: Format;
  selected: boolean;
  onSelect: (v: Format) => void;
  icon: typeof FileText;
  label: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex-1 rounded-md border p-4 text-left transition-all ${
        selected
          ? 'border-[#4A3728] bg-[#FBF7EE] shadow-sm'
          : 'border-[#E8DDC9] bg-[#FBF7EE]/60 hover:bg-[#FBF7EE]'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={18} className={selected ? 'text-[#C84B31]' : 'text-[#6B5A46]'} />
        <span className="text-sm font-medium text-[#2B1F14]">{label}</span>
      </div>
      <p className="text-xs text-[#6B5A46]">{desc}</p>
    </button>
  );
}

export default function ExportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const scoreId = id ?? '';

  const {
    currentScore,
    versions,
    setCurrentScore,
    setVersions,
  } = useStore();

  const [format, setFormat] = useState<Format>('pdf');
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [finalVersionId, setFinalVersionId] = useState<string>('');
  const [includeConflicts, setIncludeConflicts] = useState(true);
  const [includeOralNotes, setIncludeOralNotes] = useState(true);
  const [includeFingerings, setIncludeFingerings] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    id: string;
    url: string;
    fileName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scoreId) return;
    api.getScore(scoreId).then(setCurrentScore);
    api.getVersions(scoreId).then((v) => {
      setVersions(v);
      const final = v.find((x: AnnotationVersion) => x.isFinal);
      if (final) setFinalVersionId(final.id);
      else if (v.length > 0) setFinalVersionId(v[0].id);
    });
  }, [scoreId, setCurrentScore, setVersions]);

  const handleExport = async () => {
    setSubmitting(true);
    setError(null);
    setExportResult(null);
    try {
      const config: ExportConfig = {
        scoreId,
        format,
        includeConflicts,
        includeOralNotes,
        includeFingerings,
        finalVersionId: finalVersionId || undefined,
        pageSize,
      };
      const result = await api.createExport(config);
      const exportId = result?.id ?? result?.exportId ?? 'unknown';
      const fileName = `${currentScore?.title ?? '校样'}-${exportId}.${format === 'pdf' ? 'pdf' : 'docx'}`;
      setExportResult({
        id: exportId,
        url: api.downloadExport(exportId),
        fileName,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '导出失败');
    } finally {
      setSubmitting(false);
    }
  };

  const finalVersion = versions.find((v) => v.id === finalVersionId);

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <header className="sticky top-0 z-10 border-b border-[#E8DDC9] bg-[#F5F0E6]/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-[#6B5A46] hover:text-[#2B1F14]"
          >
            <ArrowLeft size={16} />
            返回
          </button>
          <span className="text-[#E8DDC9]">|</span>
          <h1 className="font-serif text-lg font-semibold text-[#2B1F14]">
            校样导出
          </h1>
          {currentScore && (
            <span className="text-sm text-[#6B5A46]">· {currentScore.title}</span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-[#E8DDC9] bg-[#FBF7EE] p-6">
            <h2 className="text-sm font-semibold text-[#2B1F14] mb-4">导出格式</h2>
            <div className="flex gap-3">
              <FormatOption
                value="pdf"
                selected={format === 'pdf'}
                onSelect={setFormat}
                icon={FileText}
                label="PDF"
                desc="便于审阅和打印的标准格式"
              />
              <FormatOption
                value="docx"
                selected={format === 'docx'}
                onSelect={setFormat}
                icon={FileSpreadsheet}
                label="Word"
                desc="可编辑的文档格式"
              />
            </div>
          </div>

          <div className="rounded-lg border border-[#E8DDC9] bg-[#FBF7EE] p-6">
            <h2 className="text-sm font-semibold text-[#2B1F14] mb-4">包含内容</h2>
            <div className="space-y-4">
              <Toggle
                checked={includeConflicts}
                onChange={setIncludeConflicts}
                label="冲突记录"
                description="包含所有已识别的批注冲突及解决状态"
              />
              <Toggle
                checked={includeOralNotes}
                onChange={setIncludeOralNotes}
                label="口传说明"
                description="老师口述的演奏要点和文化背景"
              />
              <Toggle
                checked={includeFingerings}
                onChange={setIncludeFingerings}
                label="指法标注"
                description="各版本的指法建议与定稿指法"
              />
            </div>
          </div>

          <div className="rounded-lg border border-[#E8DDC9] bg-[#FBF7EE] p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#2B1F14] mb-2">
                  定稿版本
                </label>
                <div className="relative">
                  <select
                    value={finalVersionId}
                    onChange={(e) => setFinalVersionId(e.target.value)}
                    className="w-full h-10 pl-3 pr-9 rounded-md border border-[#E8DDC9] bg-[#FBF7EE] text-sm text-[#2B1F14] appearance-none focus:outline-none focus:ring-2 focus:ring-[#C84B31]/30 focus:border-[#C84B31]"
                  >
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.teacherName} · 第 {v.versionNumber} 版
                        {v.isFinal ? '（已定稿）' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5A46]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2B1F14] mb-2">
                  页面大小
                </label>
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as PageSize)}
                    className="w-full h-10 pl-3 pr-9 rounded-md border border-[#E8DDC9] bg-[#FBF7EE] text-sm text-[#2B1F14] appearance-none focus:outline-none focus:ring-2 focus:ring-[#C84B31]/30 focus:border-[#C84B31]"
                  >
                    <option value="A4">A4 (210 × 297 mm)</option>
                    <option value="Letter">Letter (8.5 × 11 in)</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5A46]"
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {exportResult && (
            <div className="rounded-md border border-[#4A7C59]/40 bg-[#4A7C59]/10 px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-[#4A7C59]" />
                <div>
                  <p className="text-sm font-medium text-[#2B1F14]">校样已生成</p>
                  <p className="text-xs text-[#6B5A46]">{exportResult.fileName}</p>
                </div>
              </div>
              <a
                href={exportResult.url}
                download={exportResult.fileName}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#C84B31] px-3 py-2 text-sm font-medium text-[#F5F0E6] hover:bg-[#b03e28] transition-colors"
              >
                <Download size={14} />
                下载
              </a>
            </div>
          )}

          <button
            type="button"
            onClick={handleExport}
            disabled={submitting || !finalVersionId}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[#C84B31] to-[#4A3728] px-4 py-3 text-sm font-medium text-[#F5F0E6] hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileCheck size={16} />
            )}
            {submitting ? '正在生成校样...' : '生成并导出校样'}
          </button>
        </section>

        <aside className="lg:col-span-1">
          <div className="sticky top-[72px] rounded-lg border border-[#E8DDC9] bg-[#FBF7EE] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Eye size={16} className="text-[#6B5A46]" />
              <h2 className="text-sm font-semibold text-[#2B1F14]">内容预览</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-[#6B5A46]">
                <span>曲谱</span>
                <span className="text-[#2B1F14]">{currentScore?.title ?? '-'}</span>
              </div>
              <div className="flex justify-between text-[#6B5A46]">
                <span>格式</span>
                <span className="text-[#2B1F14] uppercase">{format}</span>
              </div>
              <div className="flex justify-between text-[#6B5A46]">
                <span>页面</span>
                <span className="text-[#2B1F14]">{pageSize}</span>
              </div>
              <div className="flex justify-between text-[#6B5A46]">
                <span>定稿版本</span>
                <span className="text-[#2B1F14]">
                  {finalVersion ? finalVersion.teacherName : '-'}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E8DDC9]">
                <p className="text-xs text-[#6B5A46] mb-2">包含内容</p>
                <ul className="space-y-1 text-xs">
                  <li className={includeConflicts ? 'text-[#2B1F14]' : 'text-[#A59881] line-through'}>
                    · 冲突记录
                  </li>
                  <li className={includeOralNotes ? 'text-[#2B1F14]' : 'text-[#A59881] line-through'}>
                    · 口传说明
                  </li>
                  <li className={includeFingerings ? 'text-[#2B1F14]' : 'text-[#A59881] line-through'}>
                    · 指法标注
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
