import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { ArrowRight, Lightbulb, ChevronRight, ChevronLeft } from 'lucide-react';
import dayjs from 'dayjs';

const PAGE_SIZE = 5;

function ScoreBar({ score, label }: { score: number; label: string }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.8 ? 'bg-cyber-danger' : score >= 0.5 ? 'bg-cyber-warning' : 'bg-cyber-cyan';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-cyber-muted">{label}</span>
        <span className="text-white font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 bg-cyber-bg rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ChainFlow({ chain }: { chain: { service_name: string; event: string; time: string; impact: string }[] }) {
  if (chain.length === 0) return null;

  return (
    <div className="overflow-x-auto py-2">
      <div className="flex items-center gap-1 min-w-max">
        {chain.map((item, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-xs whitespace-nowrap hover:border-cyber-cyan/40 transition-all">
              <div className="text-cyber-cyan font-medium">{item.service_name}</div>
              <div className="text-cyber-muted">{item.event}</div>
            </div>
            {i < chain.length - 1 && (
              <ArrowRight size={14} className="text-cyber-muted shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pageNumbers: number[] = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-3">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-1 rounded border border-cyber-border bg-cyber-bg text-cyber-muted hover:text-white hover:border-cyber-cyan/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft size={14} />
      </button>

      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className={`w-7 h-7 rounded text-xs transition-all ${
              currentPage === 1
                ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40'
                : 'bg-cyber-bg text-cyber-muted border border-cyber-border hover:text-white hover:border-cyber-cyan/40'
            }`}
          >
            1
          </button>
          {startPage > 2 && <span className="text-cyber-muted text-xs px-1">...</span>}
        </>
      )}

      {pageNumbers.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-7 h-7 rounded text-xs transition-all ${
            currentPage === page
              ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40'
              : 'bg-cyber-bg text-cyber-muted border border-cyber-border hover:text-white hover:border-cyber-cyan/40'
          }`}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-cyber-muted text-xs px-1">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className={`w-7 h-7 rounded text-xs transition-all ${
              currentPage === totalPages
                ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40'
                : 'bg-cyber-bg text-cyber-muted border border-cyber-border hover:text-white hover:border-cyber-cyan/40'
            }`}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-1 rounded border border-cyber-border bg-cyber-bg text-cyber-muted hover:text-white hover:border-cyber-cyan/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

export default function CausePanel() {
  const result = useStore((s) => s.rootCauseResult);
  const analysisLoading = useStore((s) => s.analysisLoading);
  const analysisHistory = useStore((s) => s.analysisHistory);
  const analysisHistoryTotal = useStore((s) => s.analysisHistoryTotal);
  const fetchHistory = useStore((s) => s.fetchHistory);

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(analysisHistoryTotal / PAGE_SIZE));

  const loadPage = useCallback(
    (page: number) => {
      const offset = (page - 1) * PAGE_SIZE;
      fetchHistory(PAGE_SIZE, offset);
      setCurrentPage(page);
    },
    [fetchHistory]
  );

  useEffect(() => {
    loadPage(1);
  }, []);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      loadPage(page);
    }
  };

  if (analysisLoading) {
    return (
      <div className="p-4 space-y-3">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-24 rounded-lg" />
        <div className="skeleton h-16 rounded-lg" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-64 text-cyber-muted text-sm">
        选择服务并点击分析以查看结果
      </div>
    );
  }

  const conclusionHtml = result.conclusion.replace(
    /(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?)/g,
    '<span class="text-cyber-cyan">$1</span>'
  ).replace(
    new RegExp(`\\b${result.service_name}\\b`, 'g'),
    `<span class="text-cyber-cyan font-medium">${result.service_name}</span>`
  );

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      <div>
        <h3 className="text-sm font-semibold text-cyber-muted mb-2">分析结论</h3>
        <div className="bg-cyber-bg rounded-lg p-3 border border-cyber-border">
          <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: conclusionHtml }} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-cyber-muted mb-2">关联度分析</h3>
        <div className="space-y-2">
          {result.root_causes.map((cause, i) => (
            <div key={i} className="bg-cyber-bg rounded-lg p-3 border border-cyber-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-cyber-cyan font-medium">{cause.service_name}</span>
                <span className="text-xs text-cyber-muted">{cause.event_type}</span>
              </div>
              <ScoreBar score={cause.correlation_score} label="关联度" />
              <p className="text-xs text-slate-300 mt-2">{cause.description}</p>
            </div>
          ))}
        </div>
      </div>

      {result.chain.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-cyber-muted mb-2">事件链路</h3>
          <ChainFlow chain={result.chain} />
        </div>
      )}

      {result.root_causes.some((c) => c.recommendation) && (
        <div>
          <h3 className="text-sm font-semibold text-cyber-muted mb-2">修复建议</h3>
          {result.root_causes
            .filter((c) => c.recommendation)
            .map((cause, i) => (
              <div key={i} className="bg-cyber-bg rounded-lg p-3 border border-cyber-border mb-2">
                <div className="flex items-start gap-2">
                  <Lightbulb size={14} className="text-cyber-warning mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs text-cyber-cyan">{cause.service_name}</span>
                    <p className="text-xs text-slate-300 mt-0.5">{cause.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {analysisHistoryTotal > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-cyber-muted">历史分析</h3>
            <span className="text-xs text-cyber-muted">共 {analysisHistoryTotal} 条</span>
          </div>
          <div className="space-y-1">
            {analysisHistory.map((record) => (
              <div
                key={record.id}
                className="flex items-center gap-2 bg-cyber-bg rounded-lg p-2 border border-cyber-border text-xs hover:border-cyber-cyan/30 transition-all cursor-pointer"
              >
                <ChevronRight size={12} className="text-cyber-muted" />
                <span className="text-cyber-cyan font-medium shrink-0">{record.service_name}</span>
                <span className="text-cyber-muted truncate flex-1">{record.conclusion}</span>
                <span className="text-cyber-muted shrink-0">{dayjs(record.created_at).format('MM-DD HH:mm')}</span>
              </div>
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
